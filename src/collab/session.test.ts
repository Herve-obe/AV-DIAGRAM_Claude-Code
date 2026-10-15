// Deux instances isolées du logiciel, avec un relais simulant le routage authentifié du module Rust.
import { createHash } from 'node:crypto'
import { afterEach, expect, it, vi } from 'vitest'

const native = vi.hoisted(() => ({ invoke: vi.fn() }))
vi.mock('@tauri-apps/api/core', () => ({ isTauri: () => true, invoke: native.invoke }))
vi.mock('@tauri-apps/plugin-dialog', () => ({ message: vi.fn() }))

class RelaySocket {
  static OPEN = 1
  static peers = new Map<number, RelaySocket>()
  static next = 1
  readyState = 0
  onopen: (() => void) | null = null
  onmessage: ((e: { data: string | ArrayBuffer }) => void) | null = null
  onclose: (() => void) | null = null
  host = false
  id = 0
  userId = ''
  constructor() { setTimeout(() => { this.readyState = 1; this.onopen?.() }, 0) }
  deliver(data: string | ArrayBuffer) { queueMicrotask(() => { if (this.readyState === 1) this.onmessage?.({ data }) }) }
  send(value: string | Uint8Array) {
    if (typeof value === 'string') {
      const h = JSON.parse(value)
      this.id = RelaySocket.next++; this.host = h.hostToken === 'private-host'
      this.userId = createHash('sha256').update(h.clientToken ?? 'probe').digest('hex')
      const peers = [...RelaySocket.peers.values()].map(p => ({ id: p.id, userId: p.userId, name: 'Poste', address: '127.0.0.1' }))
      RelaySocket.peers.set(this.id, this)
      this.deliver(JSON.stringify({ type: 'welcome', peerId: this.id, userId: this.userId, peers }))
      for (const p of RelaySocket.peers.values()) if (p !== this) p.deliver(JSON.stringify({ type: 'peer-joined', peerId: this.id, userId: this.userId }))
      return
    }
    const bytes = new Uint8Array(value)
    if (this.host) {
      if (bytes[0] === 254) RelaySocket.peers.get(new DataView(bytes.buffer, bytes.byteOffset).getUint32(1))?.deliver(bytes.slice(5).buffer)
      else for (const p of RelaySocket.peers.values()) if (p !== this) p.deliver(bytes.slice().buffer)
    } else {
      const wrapped = new Uint8Array(5 + bytes.length)
      wrapped[0] = 255; new DataView(wrapped.buffer).setUint32(1, this.id); wrapped.set(bytes, 5)
      for (const p of RelaySocket.peers.values()) if (p.host) p.deliver(wrapped.buffer)
    }
  }
  close() {
    if (this.readyState === 3) return
    this.readyState = 3; RelaySocket.peers.delete(this.id)
    for (const p of RelaySocket.peers.values()) p.deliver(JSON.stringify({ type: 'peer-left', peerId: this.id }))
    queueMicrotask(() => this.onclose?.())
  }
}

async function instance(name: string) {
  vi.resetModules()
  const storage = new Map<string, string>([['avd.collab', JSON.stringify({ name, backup: false })]])
  vi.stubGlobal('localStorage', { getItem: (k: string) => storage.get(k) ?? null, setItem: (k: string, v: string) => { storage.set(k, v) }, removeItem: (k: string) => { storage.delete(k) } })
  const session = await import('./session')
  const { useProject } = await import('../store/projectStore')
  const { useUi } = await import('../store/uiStore')
  const { LIBRARY_BY_ID } = await import('../library/generic')
  return { session, useProject, useUi, LIBRARY_BY_ID }
}
let host: Awaited<ReturnType<typeof instance>>, guest: Awaited<ReturnType<typeof instance>>
afterEach(() => { guest?.session.leave(); host?.session.leave(); RelaySocket.peers.clear(); RelaySocket.next = 1; vi.unstubAllGlobals() })

it('synchronise deux postes, applique les droits de l’hôte et les conserve après reconnexion', async () => {
  vi.stubGlobal('window', { location: { search: '' }, addEventListener: vi.fn() })
  vi.stubGlobal('WebSocket', RelaySocket)
  native.invoke.mockImplementation(async (command: string, args?: { peerId?: number }) => {
    if (command === 'collab_local_addresses') return ['127.0.0.1:4455']
    if (command === 'collab_host_start' || command === 'collab_host_status') return { port: 4455, code: '123456', hostToken: 'private-host', addresses: ['127.0.0.1:4455'], peers: [] }
    if (command === 'collab_kick') { RelaySocket.peers.get(args!.peerId!)?.close(); return true }
  })
  host = await instance('Hôte')
  host.useProject.getState().rename('Concert partagé')
  await host.session.hostSession()
  await vi.waitFor(() => expect(host.session.useCollab.getState().status).toBe('connected'))
  guest = await instance('Audio')
  expect(guest.useProject.getState().saved).toBe(true)
  expect(guest.session.useCollab.getState().status).toBe('off')
  expect(await (await import('../io/documentLifecycle')).prepareToLeave()).toBe(true)
  await guest.session.joinSession('127.0.0.1', '123456')
  expect(guest.useProject.getState().project.name).toBe('Concert partagé')
  await vi.waitFor(() => expect(host.session.useCollab.getState().participants).toHaveLength(2))
  const person = host.session.useCollab.getState().participants.find(p => !p.self)!
  host.session.assignLayer('sound', person.peerId!)
  await vi.waitFor(() => expect(guest.session.useCollab.getState().claims.sound?.userId).toBe(person.userId))
  guest.useUi.getState().setPref('layer', 'sound')
  const id = guest.useProject.getState().addEquipment(guest.LIBRARY_BY_ID.get('gen-console')!, { x: 10, y: 20 })
  await vi.waitFor(() => expect(host.useProject.getState().project.equipment[id]).toBeDefined())
  const before = guest.useProject.getState().project
  guest.useUi.getState().setPref('layer', 'all')
  guest.useProject.getState().moveEquipment(id, { x: 999, y: 0 })
  expect(guest.useProject.getState().project).toBe(before)
  host.useProject.getState().moveEquipment(id, { x: 30, y: 40 })
  await vi.waitFor(() => expect(guest.useProject.getState().project.equipment[id].position.x).toBe(30))
  const oldPeerId = person.peerId!
  RelaySocket.peers.get(oldPeerId)!.close()
  await vi.waitFor(() => expect(guest.session.useCollab.getState().status).toBe('reconnecting'))
  await vi.waitFor(() => expect(guest.session.useCollab.getState().status).toBe('connected'), { timeout: 6000 })
  expect(guest.session.useCollab.getState().userId).toBe(person.userId)
  guest.useUi.getState().setPref('layer', 'sound')
  guest.useProject.getState().moveEquipment(id, { x: 50, y: 60 })
  await vi.waitFor(() => expect(host.useProject.getState().project.equipment[id].position.x).toBe(50))
  host.session.assignLayer('sound', null)
  await vi.waitFor(() => expect(guest.session.useCollab.getState().claims.sound).toBeUndefined())
  const accepted = guest.useProject.getState().project
  guest.useProject.getState().moveEquipment(id, { x: 100, y: 0 })
  expect(guest.useProject.getState().project).toBe(accepted)
})

it('l’ancien hôte rejoint le secours actif sans rouvrir un relais avec son ancien document', async () => {
  vi.stubGlobal('window', { location: { search: '' }, addEventListener: vi.fn() })
  vi.stubGlobal('WebSocket', RelaySocket)
  native.invoke.mockReset().mockImplementation(async (command: string) => {
    if (command === 'collab_local_addresses') return ['backup:4455']
    if (command === 'collab_host_start' || command === 'collab_host_status') return { port: 4455, code: '123456', hostToken: 'private-host', addresses: ['backup:4455'], peers: [] }
  })
  host = await instance('Secours')
  host.useProject.getState().rename('Version conservée chez le secours')
  await host.session.hostSession()
  await vi.waitFor(() => expect(host.session.useCollab.getState().status).toBe('connected'))
  guest = await instance('Ancien hôte')
  guest.session.useCollab.setState({ resumable: {
    code: '123456', origin: 'host', port: 4455, ranks: [['original:4455'], ['backup:4455']], backupIds: [],
    state: 'ancien-instantane-inutilise', savedAt: Date.now(), projectName: 'Ancienne version',
  } })
  await guest.session.resumeSession()
  expect(guest.useProject.getState().project.name).toBe('Version conservée chez le secours')
  expect(guest.session.useCollab.getState().role).toBe('guest')
  expect(host.session.useCollab.getState().role).toBe('host')
  expect(native.invoke.mock.calls.filter(([command]) => command === 'collab_host_start')).toHaveLength(1)
})
