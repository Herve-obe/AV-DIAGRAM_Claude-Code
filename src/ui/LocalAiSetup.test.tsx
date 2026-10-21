// @vitest-environment jsdom
import { act, StrictMode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import '../i18n'
import { useAi } from '../store/aiStore'
import { LocalAiSetup } from './LocalAiSetup'

const actions = vi.hoisted(() => ({ catalog: vi.fn(), download: vi.fn(), progress: vi.fn(), cancel: vi.fn(), start: vi.fn(), stop: vi.fn(), run: vi.fn(), directory: vi.fn(), pick: vi.fn() }))
vi.mock('../ai/local', async original => ({ ...await original<typeof import('../ai/local')>(), localCatalog: actions.catalog, downloadModel: actions.download,
  downloadProgress: actions.progress, cancelDownload: actions.cancel, startServer: actions.start, stopServer: actions.stop, setModelDirectory: actions.directory }))
vi.mock('@tauri-apps/plugin-dialog', () => ({ open: actions.pick }))
vi.mock('../ai/agent', async original => ({ ...await original<typeof import('../ai/agent')>(), runTurn: actions.run }))
vi.mock('../ai/transport', () => ({ nativeAvailable: () => true, nativeTransport: {}, openExternal: vi.fn() }))
vi.mock('../library', async () => ({ LIBRARY: (await import('../library/generic')).GENERIC_LIBRARY }))
const model = { id: 'qwen3-4b', label: 'Qwen3 4B', size: 2497280256, minimum_ram_gb: 8, license: 'Apache-2.0', installed: false, partial: 0 }
let element: HTMLDivElement, root: Root
const button = (text: string) => [...element.querySelectorAll('button')].find(b => b.textContent === text)!
const click = (text: string) => act(async () => { button(text).click() })
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); vi.clearAllMocks()
  useAi.getState().clear(); useAi.setState({ settings: { enabled: false, consent: false }, setupOpen: true, installerDirectory: null })
  actions.catalog.mockResolvedValue({ models: [{ ...model }], memory_bytes: 16 * 1024 ** 3, runtime_available: true, directory: 'C:/Models' })
  actions.progress.mockResolvedValue({ running: false, id: null, downloaded: 0, total: 0 })
  actions.start.mockResolvedValue(['qwen3-4b']); actions.stop.mockResolvedValue(undefined)
  actions.cancel.mockResolvedValue(undefined)
  actions.directory.mockResolvedValue(undefined); actions.pick.mockResolvedValue(null)
  actions.run.mockResolvedValue({ toolsUsed: ['check_project'] })
  element = document.createElement('div'); document.body.append(element); root = createRoot(element)
})
afterEach(() => { act(() => root.unmount()); element.remove() })
const draw = () => act(async () => { root.render(<LocalAiSetup back={() => undefined} advanced={() => undefined} />) })

it('affiche taille et licence, et exige téléchargement puis test avant activation', async () => {
  await draw()
  expect(element.textContent).toContain('2,5 Go'); expect(element.textContent).toContain('Apache-2.0')
  expect(button('Activer l’IA locale').disabled).toBe(true)
  expect(button('Charger et tester').disabled).toBe(true)
  actions.download.mockImplementation(async () => {
    actions.catalog.mockResolvedValue({ models: [{ ...model, installed: true }], memory_bytes: 16 * 1024 ** 3, runtime_available: true })
  })
  await click('Télécharger le modèle')
  expect(actions.download).toHaveBeenCalledWith('qwen3-4b')
  expect(button('Activer l’IA locale').disabled).toBe(true)
  await click('Charger et tester')
  expect(actions.start).toHaveBeenCalledWith({ catalogId: 'qwen3-4b' }, undefined)
  await click('Activer l’IA locale')
  expect(useAi.getState().settings).toMatchObject({ enabled: true, provider: 'builtin', consent: false, managed: { catalogId: 'qwen3-4b' } })
  expect(useAi.getState().setupOpen).toBe(false)
})
it('n’active pas un modèle qui répond sans appeler les outils', async () => {
  actions.catalog.mockResolvedValue({ models: [{ ...model, installed: true }], memory_bytes: 16 * 1024 ** 3, runtime_available: true })
  actions.run.mockResolvedValue({ toolsUsed: [] })
  await draw(); await click('Charger et tester')
  expect(button('Activer l’IA locale').disabled).toBe(true)
  expect(element.textContent).toContain('n’a pas utilisé les outils')
})
it('expose l’annulation d’un téléchargement et empêche un deuxième lancement', async () => {
  actions.progress.mockResolvedValue({ running: true, id: 'qwen3-4b', downloaded: 100, total: model.size })
  await draw()
  expect(button('Télécharger le modèle').disabled).toBe(true)
  await click('Annuler le téléchargement'); expect(actions.cancel).toHaveBeenCalledOnce()
  act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })))
  expect(useAi.getState().setupOpen).toBe(true)
})
it('signale une empreinte incorrecte sans permettre l’activation', async () => {
  actions.download.mockRejectedValue('integrity')
  await draw(); await click('Télécharger le modèle')
  expect(element.textContent).toContain('ne correspond pas au modèle officiel')
  expect(button('Activer l’IA locale').disabled).toBe(true)
})
it('permet de retélécharger un modèle installé dont l’empreinte a été altérée', async () => {
  actions.catalog.mockResolvedValue({ models: [{ ...model, installed: true }], memory_bytes: 16 * 1024 ** 3, runtime_available: true })
  actions.start.mockRejectedValue('integrity')
  await draw(); await click('Charger et tester')
  expect(button('Télécharger le modèle').disabled).toBe(false)
  expect(button('Activer l’IA locale').disabled).toBe(true)
})
it('explique la limite macOS avant de proposer un téléchargement inutile', async () => {
  actions.catalog.mockResolvedValue({ models: [{ ...model }], memory_bytes: 16 * 1024 ** 3, runtime_available: false, runtime_error: 'platform' })
  await draw()
  expect(element.textContent).toContain('macOS 13.3')
  expect(button('Télécharger le modèle').disabled).toBe(true)
})
it('reprend une seule fois le choix fait dans l’installeur, même en mode React strict', async () => {
  useAi.setState({ installerDirectory: 'D:/IA locale é test' })
  actions.download.mockResolvedValue(undefined)
  await act(async () => root.render(<StrictMode><LocalAiSetup back={() => undefined} advanced={() => undefined} /></StrictMode>))
  expect(actions.directory).toHaveBeenCalledExactlyOnceWith('D:/IA locale é test')
  expect(actions.download).toHaveBeenCalledExactlyOnceWith('qwen3-4b')
  expect(button('Activer l’IA locale').disabled).toBe(true)
})
it('change le dossier sans activation automatique et invalide le réglage précédent', async () => {
  useAi.setState({ settings: { enabled: true, consent: false, provider: 'builtin', model: model.id, managed: { catalogId: model.id } } })
  actions.pick.mockResolvedValue('D:/IA locale')
  await draw(); await click('Choisir…')
  expect(actions.directory).toHaveBeenCalledWith('D:/IA locale')
  expect(useAi.getState().settings.enabled).toBe(false)
  expect(actions.download).not.toHaveBeenCalled()
})
