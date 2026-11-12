import { afterEach, beforeEach, expect, it, vi } from 'vitest'

const collab = vi.hoisted(() => ({
  getState: () => ({ status: 'off', role: null, claims: {}, participants: [], userId: 'me', started: true }),
  subscribe: vi.fn(), setState: vi.fn(),
}))
vi.mock('../collab/session', () => ({ useCollab: collab }))
vi.mock('@tauri-apps/api/core', () => ({ isTauri: () => false }))
let channel: { onmessage: ((e: { data: unknown }) => void) | null; postMessage: ReturnType<typeof vi.fn> }
beforeEach(() => {
  vi.resetModules()
  vi.stubGlobal('window', { location: { search: '' }, addEventListener: vi.fn() })
  vi.stubGlobal('requestAnimationFrame', vi.fn())
  vi.stubGlobal('BroadcastChannel', vi.fn(function () {
    channel = { onmessage: null, postMessage: vi.fn() }
    return channel
  }))
})
afterEach(() => vi.unstubAllGlobals())

it('la fenêtre principale refuse une modification interdite venant de la fenêtre Infos et lui renvoie l’état accepté', async () => {
  const { useProject, setProjectGuard } = await import('./projectStore')
  const { startWindowSync } = await import('./windowSync')
  await startWindowSync()
  const p = useProject.getState().project
  setProjectGuard(() => false)
  channel.onmessage!({ data: { from: 'infos', kind: 'project', base: p, project: { ...p, name: 'Interdit' } } })
  expect(useProject.getState().project).toBe(p)
  expect(channel.postMessage).toHaveBeenCalledWith(expect.objectContaining({ kind: 'state', project: p }))
})
it('une fenêtre Infos en retard ne peut pas écraser une modification réseau plus récente', async () => {
  const { useProject } = await import('./projectStore')
  const { startWindowSync } = await import('./windowSync')
  await startWindowSync()
  const old = useProject.getState().project, current = { ...old, name: 'Reçu du réseau' }
  useProject.setState({ project: current })
  channel.onmessage!({ data: { from: 'infos', kind: 'project', base: old, project: { ...old, name: 'État périmé' } } })
  expect(useProject.getState().project).toBe(current)
})

it('partage le démarrage et les droits de plusieurs membres vers la fenêtre Infos', async () => {
  const { startWindowSync } = await import('./windowSync')
  await startWindowSync()
  channel.onmessage!({ data: { from: 'infos', kind: 'hello' } })
  expect(channel.postMessage).toHaveBeenCalledWith(expect.objectContaining({ kind: 'access', access: expect.objectContaining({ started: true }) }))
})
it('la fenêtre Infos reçoit aussi le retrait des droits et la salle d’attente', async () => {
  window.location.search = '?window=panels'
  const { startWindowSync } = await import('./windowSync')
  await startWindowSync()
  const access = { status: 'connected', role: 'guest', userId: 'me', participants: [], claims: { full: [{ userId: 'me', name: 'Son', color: '#333' }], sound: [{ userId: 'me', name: 'Son', color: '#333' }, { userId: 'other', name: 'Autre', color: '#333' }] }, started: true }
  channel.onmessage!({ data: { from: 'main', kind: 'access', access } })
  expect(collab.setState).toHaveBeenLastCalledWith(access)
  channel.onmessage!({ data: { from: 'main', kind: 'access', access: { ...access, started: false, claims: {} } } })
  expect(collab.setState).toHaveBeenLastCalledWith({ ...access, started: false, claims: {} })
})
