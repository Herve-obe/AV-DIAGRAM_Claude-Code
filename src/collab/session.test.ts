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
  static protocol: number | undefined = 6
  static held = false
  static queued: (() => void)[] = []
  static flush() {
    RelaySocket.held = false
    for (const deliver of RelaySocket.queued.splice(0)) queueMicrotask(deliver)
  }
  readyState = 0
  onopen: (() => void) | null = null
  onmessage: ((e: { data: string | ArrayBuffer }) => void) | null = null
  onclose: (() => void) | null = null
  host = false
  id = 0
  userId = ''
  constructor() { setTimeout(() => { this.readyState = 1; this.onopen?.() }, 0) }
  deliver(data: string | ArrayBuffer) {
    const deliver = () => { if (this.readyState === 1) this.onmessage?.({ data }) }
    if (RelaySocket.held) RelaySocket.queued.push(deliver)
    else queueMicrotask(deliver)
  }
  send(value: string | Uint8Array) {
    if (typeof value === 'string') {
      const h = JSON.parse(value)
      expect(h.protocol).toBe(6)
      this.id = RelaySocket.next++; this.host = h.hostToken === 'private-host'
      this.userId = createHash('sha256').update(h.clientToken ?? 'probe').digest('hex')
      const peers = [...RelaySocket.peers.values()].map(p => ({ id: p.id, userId: p.userId, name: 'Poste', address: '127.0.0.1' }))
      RelaySocket.peers.set(this.id, this)
      this.deliver(JSON.stringify({ type: 'welcome', protocol: RelaySocket.protocol, peerId: this.id, userId: this.userId, peers }))
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
let videoGuest: Awaited<ReturnType<typeof instance>> | undefined
afterEach(() => {
  RelaySocket.held = false; RelaySocket.queued = []
  videoGuest?.session.leave(); videoGuest = undefined
  guest?.session.leave(); host?.session.leave()
  RelaySocket.peers.clear(); RelaySocket.next = 1; RelaySocket.protocol = 6; vi.unstubAllGlobals()
})

it.each([undefined, 1, 2, 3, 4, 5])('refuse un ancien hôte de protocole %s sans remplacer le projet local', async protocol => {
  vi.stubGlobal('window', { location: { search: '' }, addEventListener: vi.fn() })
  vi.stubGlobal('WebSocket', RelaySocket)
  native.invoke.mockResolvedValue(undefined)
  RelaySocket.protocol = protocol
  guest = await instance('Invité')
  const before = guest.useProject.getState().project
  await expect(guest.session.joinSession('127.0.0.1', '123456')).rejects.toThrow()
  expect(guest.session.useCollab.getState().error).toBe('version')
  expect(guest.session.useCollab.getState().status).toBe('off')
  expect(guest.useProject.getState().project).toBe(before)
})

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
  host.session.assignLayer('sound', person.userId!, true)
  await vi.waitFor(() => expect(guest.session.useCollab.getState().claims.sound).toEqual([expect.objectContaining({ userId: person.userId })]))
  guest.useUi.getState().setPref('layer', 'sound')
  const waiting = guest.useProject.getState().project
  guest.useProject.getState().addEquipment(guest.LIBRARY_BY_ID.get('gen-console')!, { x: 10, y: 20 })
  expect(guest.useProject.getState().project).toBe(waiting)
  expect(guest.session.beginSession()).toBe(false)
  expect(host.session.beginSession()).toBe(true)
  await vi.waitFor(() => expect(guest.session.useCollab.getState().started).toBe(true))
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
  host.session.assignLayer('sound', person.userId!, false)
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
  host.session.beginSession()
  guest = await instance('Ancien hôte')
  guest.session.useCollab.setState({ resumable: {
    code: '123456', origin: 'host', port: 4455, ranks: [['original:4455'], ['backup:4455']], backupIds: [],
    state: 'ancien-instantane-inutilise', savedAt: Date.now(), projectName: 'Ancienne version',
  } })
  await guest.session.resumeSession()
  expect(guest.useProject.getState().project.name).toBe('Version conservée chez le secours')
  expect(guest.session.useCollab.getState().role).toBe('guest')
  expect(guest.session.useCollab.getState().started).toBe(true)
  expect(host.session.useCollab.getState().role).toBe('host')
  expect(native.invoke.mock.calls.filter(([command]) => command === 'collab_host_start')).toHaveLength(1)
})

it('trois postes éditent et ajoutent des ports audio et vidéo du même appareil sans se déconnecter ni annuler le travail de l’autre', async () => {
  vi.stubGlobal('window', { location: { search: '' }, addEventListener: vi.fn() })
  vi.stubGlobal('WebSocket', RelaySocket)
  native.invoke.mockReset().mockImplementation(async (command: string, args?: { peerId?: number }) => {
    if (command === 'collab_local_addresses') return ['127.0.0.1:4455']
    if (command === 'collab_host_start' || command === 'collab_host_status') return { port: 4455, code: '123456', hostToken: 'private-host', addresses: ['127.0.0.1:4455'], peers: [] }
    if (command === 'collab_kick') { RelaySocket.peers.get(args!.peerId!)?.close(); return true }
  })
  host = await instance('Hôte')
  host.useProject.getState().addEquipment(host.LIBRARY_BY_ID.get('gen-console')!, { x: 0, y: 0 })
  const camId = host.useProject.getState().addEquipment(host.LIBRARY_BY_ID.get('gen-camera')!, { x: 400, y: 0 })
  const audioId = host.useProject.getState().addPort(camId, { name: 'Audio in', direction: 'in', signal: 'audioAnalog', connector: 'xlr3' })!
  const videoId = host.useProject.getState().project.equipment[camId].ports.find(p => p.signal === 'video')!.id
  await host.session.hostSession()
  await vi.waitFor(() => expect(host.session.useCollab.getState().status).toBe('connected'))
  guest = await instance('Audio'); await guest.session.joinSession('127.0.0.1', '123456')
  videoGuest = await instance('Vidéo'); await videoGuest.session.joinSession('127.0.0.1', '123456')
  const video = videoGuest
  await vi.waitFor(() => expect(host.session.useCollab.getState().participants).toHaveLength(3))
  const audioUser = guest.session.useCollab.getState().userId, videoUser = video.session.useCollab.getState().userId
  host.session.assignLayer('sound', audioUser, true)
  host.session.assignLayer('image', videoUser, true)
  host.session.beginSession()
  await vi.waitFor(() => expect(guest.session.useCollab.getState().claims.sound).toEqual([expect.objectContaining({ userId: audioUser })]))
  await vi.waitFor(() => expect(video.session.useCollab.getState().claims.image).toEqual([expect.objectContaining({ userId: videoUser })]))
  await vi.waitFor(() => expect(video.session.useCollab.getState().started).toBe(true))
  guest.useUi.getState().setPref('layer', 'sound'); video.useUi.getState().setPref('layer', 'image')
  await vi.waitFor(() => {
    const people = host.session.useCollab.getState().participants
    expect(people.find(p => p.userId === audioUser)?.layer).toBe('sound')
    expect(people.find(p => p.userId === videoUser)?.layer).toBe('image')
  })
  const instances = [host, guest, video]
  const port = (node: typeof host, id: string) => node.useProject.getState().project.equipment[camId].ports.find(p => p.id === id)
  RelaySocket.held = true
  guest.useProject.getState().updatePort(camId, audioId, { name: 'Micro reportage' })
  video.useProject.getState().updatePort(camId, videoId, { name: 'SDI scène' })
  RelaySocket.flush()
  await vi.waitFor(() => {
    for (const node of instances) {
      expect(port(node, audioId)?.name).toBe('Micro reportage')
      expect(port(node, videoId)?.name).toBe('SDI scène')
    }
  })
  guest.useProject.getState().undo()
  await vi.waitFor(() => {
    for (const node of instances) {
      expect(port(node, audioId)?.name, node.session.useCollab.getState().name).toBe('Audio in')
      expect(port(node, videoId)?.name).toBe('SDI scène')
    }
  })
  RelaySocket.held = true
  const addedAudio = guest.useProject.getState().addPort(camId, { name: 'Audio supplémentaire', direction: 'in', signal: 'audioAnalog', connector: 'xlr3' })!
  const addedVideo = video.useProject.getState().addPort(camId, { name: 'Vidéo supplémentaire', direction: 'out', signal: 'video', connector: 'bnc' })!
  expect(addedAudio).not.toBe(addedVideo)
  RelaySocket.flush()
  await vi.waitFor(() => {
    for (const node of instances) {
      expect(port(node, addedAudio)?.name).toBe('Audio supplémentaire')
      expect(port(node, addedVideo)?.name).toBe('Vidéo supplémentaire')
      expect(node.session.useCollab.getState().status).toBe('connected')
    }
  })
  expect(native.invoke.mock.calls.some(([command]) => command === 'collab_kick')).toBe(false)
})

it('deux invités partagent le même calque, gardent leur annulation et perdent seulement les droits retirés', async () => {
  vi.stubGlobal('window', { location: { search: '' }, addEventListener: vi.fn() })
  vi.stubGlobal('WebSocket', RelaySocket)
  native.invoke.mockReset().mockImplementation(async (command: string) => {
    if (command === 'collab_local_addresses') return ['127.0.0.1:4455']
    if (command === 'collab_host_start' || command === 'collab_host_status') return { port: 4455, code: '123456', hostToken: 'private-host', addresses: ['127.0.0.1:4455'], peers: [] }
  })
  host = await instance('Hôte')
  const first = host.useProject.getState().addEquipment(host.LIBRARY_BY_ID.get('gen-console')!, { x: 0, y: 0 })
  const second = host.useProject.getState().addEquipment(host.LIBRARY_BY_ID.get('gen-console')!, { x: 200, y: 0 })
  const camera = host.useProject.getState().addEquipment(host.LIBRARY_BY_ID.get('gen-camera')!, { x: 400, y: 0 })
  await host.session.hostSession()
  await vi.waitFor(() => expect(host.session.useCollab.getState().status).toBe('connected'))
  guest = await instance('Son A'); await guest.session.joinSession('127.0.0.1', '123456')
  videoGuest = await instance('Son B'); await videoGuest.session.joinSession('127.0.0.1', '123456')
  const other = videoGuest
  await vi.waitFor(() => expect(host.session.useCollab.getState().participants).toHaveLength(3))
  const a = guest.session.useCollab.getState().userId, b = other.session.useCollab.getState().userId
  host.session.assignLayer('sound', a, true)
  host.session.assignLayer('sound', b, true)
  host.session.assignLayer('image', a, true)
  host.session.beginSession()
  await vi.waitFor(() => {
    expect(guest.session.useCollab.getState().claims.sound).toHaveLength(2)
    expect(other.session.useCollab.getState().claims.sound).toHaveLength(2)
    expect(guest.session.useCollab.getState().started).toBe(true)
    expect(other.session.useCollab.getState().started).toBe(true)
  })
  guest.session.assignLayer('image', b, true)
  host.session.assignLayer('sound', 'inconnu', true)
  expect(host.session.useCollab.getState().claims.sound).toHaveLength(2)
  expect(host.session.useCollab.getState().claims.image).toEqual([expect.objectContaining({ userId: a })])
  guest.useUi.getState().setPref('layer', 'image')
  guest.useProject.getState().moveEquipment(camera, { x: 450, y: 10 })
  await vi.waitFor(() => expect(host.useProject.getState().project.equipment[camera].position.x).toBe(450))
  guest.useUi.getState().setPref('layer', 'sound'); other.useUi.getState().setPref('layer', 'sound')
  await vi.waitFor(() => expect(host.session.useCollab.getState().participants.filter(p => !p.self).every(p => p.layer === 'sound')).toBe(true))
  RelaySocket.held = true
  guest.useProject.getState().moveEquipment(first, { x: 30, y: 0 })
  other.useProject.getState().moveEquipment(second, { x: 230, y: 0 })
  RelaySocket.flush()
  const instances = [host, guest, other]
  await vi.waitFor(() => { for (const node of instances) {
    expect(node.useProject.getState().project.equipment[first].position.x).toBe(30)
    expect(node.useProject.getState().project.equipment[second].position.x).toBe(230)
  } })
  guest.useProject.getState().undo()
  await vi.waitFor(() => { for (const node of instances) {
    expect(node.useProject.getState().project.equipment[first].position.x).toBe(0)
    expect(node.useProject.getState().project.equipment[second].position.x).toBe(230)
  } })
  host.session.assignLayer('sound', a, false)
  await vi.waitFor(() => expect(guest.session.useCollab.getState().claims.sound).toEqual([expect.objectContaining({ userId: b })]))
  const before = guest.useProject.getState().project
  guest.useProject.getState().moveEquipment(first, { x: 99, y: 0 })
  expect(guest.useProject.getState().project).toBe(before)
  expect(guest.session.useCollab.getState().claims.image).toEqual([expect.objectContaining({ userId: a })])
  other.useProject.getState().moveEquipment(second, { x: 260, y: 0 })
  await vi.waitFor(() => expect(host.useProject.getState().project.equipment[second].position.x).toBe(260))
  host.useProject.getState().moveEquipment(first, { x: 60, y: 0 })
  await vi.waitFor(() => expect(guest.useProject.getState().project.equipment[first].position.x).toBe(60))
})

it('le profil Audio configure son interface, raccorde le switch et annule depuis Réseau sans exclusion, puis respecte le retrait', async () => {
  vi.stubGlobal('window', { location: { search: '' }, addEventListener: vi.fn() })
  vi.stubGlobal('WebSocket', RelaySocket)
  native.invoke.mockReset().mockImplementation(async (command: string, args?: { peerId?: number }) => {
    if (command === 'collab_local_addresses') return ['127.0.0.1:4455']
    if (command === 'collab_host_start' || command === 'collab_host_status') return { port: 4455, code: '123456', hostToken: 'private-host', addresses: ['127.0.0.1:4455'], peers: [] }
    if (command === 'collab_kick') { RelaySocket.peers.get(args!.peerId!)?.close(); return true }
  })
  host = await instance('Hôte')
  const consoleId = host.useProject.getState().addEquipment(host.LIBRARY_BY_ID.get('gen-console')!, { x: 0, y: 0 })
  const swId = host.useProject.getState().addEquipment(host.LIBRARY_BY_ID.get('gen-switch8')!, { x: 400, y: 0 })
  const rxId = host.useProject.getState().addEquipment(host.LIBRARY_BY_ID.get('gen-wireless-rx')!, { x: 0, y: 300 })
  const portId = host.useProject.getState().addPort(consoleId, { name: 'Gestion', signal: 'network', direction: 'bidir', connector: 'rj45' })!
  await host.session.hostSession()
  await vi.waitFor(() => expect(host.session.useCollab.getState().status).toBe('connected'))
  guest = await instance('Son'); await guest.session.joinSession('127.0.0.1', '123456')
  const userId = guest.session.useCollab.getState().userId
  await vi.waitFor(() => expect(host.session.useCollab.getState().participants).toHaveLength(2))
  host.session.assignLayer('sound', userId, true); host.session.beginSession()
  await vi.waitFor(() => expect(guest.session.useCollab.getState().started).toBe(true))
  guest.useUi.getState().setPref('layer', 'network')
  guest.useProject.getState().updatePort(consoleId, portId, { network: { address: '192.168.1.50', vlan: 10 } })
  const address = (node: typeof host) => node.useProject.getState().project.equipment[consoleId].ports.find(p => p.id === portId)?.network?.address
  await vi.waitFor(() => expect(address(host)).toBe('192.168.1.50'))
  guest.useProject.getState().undo()
  await vi.waitFor(() => expect(address(host)).toBeUndefined())
  guest.useProject.getState().redo()
  await vi.waitFor(() => expect(address(host)).toBe('192.168.1.50'))
  guest.useProject.getState().beginGesture()
  const p = guest.useProject.getState().project, desk = p.equipment[consoleId].ports.find(p => p.signal === 'audioIp')!, slot = p.equipment[swId].ports[0]
  const linkId = guest.useProject.getState().connect({ equipmentId: consoleId, portId: desk.id }, { equipmentId: swId, portId: slot.id })!
  await vi.waitFor(() => expect(host.useProject.getState().project.links[linkId]).toBeDefined())
  guest.useProject.getState().undo()
  await vi.waitFor(() => expect(host.useProject.getState().project.links[linkId]).toBeUndefined())
  guest.useProject.getState().redo()
  await vi.waitFor(() => expect(host.useProject.getState().project.links[linkId]).toBeDefined())
  guest.useProject.getState().beginGesture()
  guest.useProject.getState().remove([rxId], [])
  await vi.waitFor(() => expect(host.useProject.getState().project.equipment[rxId]).toBeUndefined())
  guest.useProject.getState().undo()
  await vi.waitFor(() => expect(host.useProject.getState().project.equipment[rxId]).toBeDefined())
  host.session.assignLayer('sound', userId, false)
  await vi.waitFor(() => expect(guest.session.useCollab.getState().claims.sound).toBeUndefined())
  const accepted = guest.useProject.getState().project
  const socket = [...RelaySocket.peers.values()].find(p => !p.host)!, send = vi.spyOn(socket, 'send')
  guest.useProject.getState().redo()
  guest.useProject.getState().updatePort(consoleId, portId, { network: { address: '192.168.1.99' } })
  expect(guest.useProject.getState().project).toBe(accepted)
  expect(send).not.toHaveBeenCalled()
  send.mockRestore()
  expect(guest.session.useCollab.getState().status).toBe('connected')
  expect(native.invoke.mock.calls.some(([command]) => command === 'collab_kick')).toBe(false)
})

it('le plein droit ouvre Général et les paramètres communs, puis sa révocation protège undo et redo sans exclusion', async () => {
  vi.stubGlobal('window', { location: { search: '' }, addEventListener: vi.fn() })
  vi.stubGlobal('WebSocket', RelaySocket)
  native.invoke.mockReset().mockImplementation(async (command: string) => {
    if (command === 'collab_local_addresses') return ['127.0.0.1:4455']
    if (command === 'collab_host_start' || command === 'collab_host_status') return { port: 4455, code: '123456', hostToken: 'private-host', addresses: ['127.0.0.1:4455'], peers: [] }
  })
  host = await instance('Hôte'); await host.session.hostSession()
  await vi.waitFor(() => expect(host.session.useCollab.getState().status).toBe('connected'))
  guest = await instance('Invité'); await guest.session.joinSession('127.0.0.1', '123456')
  const userId = guest.session.useCollab.getState().userId
  await vi.waitFor(() => expect(host.session.useCollab.getState().participants).toHaveLength(2))
  host.session.assignLayer('sound', userId, true)
  host.session.assignLayer('full', userId, true)
  await vi.waitFor(() => expect(guest.session.useCollab.getState().claims.full).toBeDefined())
  const waiting = guest.useProject.getState().project
  guest.useProject.getState().rename('Attente interdite')
  expect(guest.useProject.getState().project).toBe(waiting)
  host.session.beginSession()
  await vi.waitFor(() => expect(guest.session.useCollab.getState().started).toBe(true))
  guest.useUi.getState().setPref('layer', 'all')
  expect(guest.session.beginSession()).toBe(false)
  guest.session.assignLayer('image', userId, true)
  expect(guest.session.useCollab.getState().claims.image).toBeUndefined()
  await guest.session.kick(1)
  expect(native.invoke.mock.calls.some(([command]) => command === 'collab_kick')).toBe(false)
  guest.useProject.getState().rename('Nom partagé')
  await vi.waitFor(() => expect(host.useProject.getState().project.name).toBe('Nom partagé'))
  guest.useProject.getState().undo()
  await vi.waitFor(() => expect(host.useProject.getState().project.name).toBe(waiting.name))
  host.session.assignLayer('full', userId, false)
  await vi.waitFor(() => expect(guest.session.useCollab.getState().claims.full).toBeUndefined())
  expect(guest.session.useCollab.getState().claims.sound).toBeDefined()
  const socket = [...RelaySocket.peers.values()].find(p => !p.host)!, send = vi.spyOn(socket, 'send')
  guest.useProject.getState().redo()
  guest.useProject.getState().rename('Interdit')
  expect(send).not.toHaveBeenCalled()
  send.mockRestore()
  host.session.assignLayer('full', userId, true)
  await vi.waitFor(() => expect(guest.session.useCollab.getState().claims.full).toBeDefined())
  guest.useProject.getState().redo()
  await vi.waitFor(() => expect(host.useProject.getState().project.name).toBe('Nom partagé'))
  host.session.assignLayer('full', userId, false)
  await vi.waitFor(() => expect(guest.session.useCollab.getState().claims.full).toBeUndefined())
  const sendAgain = vi.spyOn(socket, 'send')
  guest.useProject.getState().undo()
  expect(sendAgain).not.toHaveBeenCalled()
  sendAgain.mockRestore()
  expect(guest.session.useCollab.getState().status).toBe('connected')
  expect(native.invoke.mock.calls.some(([command]) => command === 'collab_kick')).toBe(false)
})
