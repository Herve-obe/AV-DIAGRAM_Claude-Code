// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import '../i18n'
import { useAi } from '../store/aiStore'
import { useProject } from '../store/projectStore'
import { AiSetupDialog } from './AiSetupDialog'

const api = vi.hoisted(() => ({ present: vi.fn(), set: vi.fn(), remove: vi.fn(), models: vi.fn(), request: vi.fn() }))
vi.mock('../ai/transport', () => ({ nativeAvailable: () => true, nativeTransport: { request: api.request }, openExternal: vi.fn(), keyStore: { present: api.present, set: api.set, remove: api.remove } }))
vi.mock('../ai/agent', async original => ({ ...await original<typeof import('../ai/agent')>(), listModels: api.models }))
vi.mock('../ai/local', async original => ({ ...await original<typeof import('../ai/local')>(), stopServer: vi.fn().mockResolvedValue(undefined) }))
vi.mock('../library', async () => ({ LIBRARY: (await import('../library/generic')).GENERIC_LIBRARY }))

let element: HTMLDivElement, root: Root
const button = (text: string) => [...element.querySelectorAll('button')].find(b => b.textContent?.startsWith(text))!
const click = (text: string) => act(async () => { button(text).click() })
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); vi.clearAllMocks()
  useAi.getState().clear(); useAi.setState({ settings: { enabled: false, consent: false }, setupOpen: true, panelOpen: false, installerDirectory: null })
  api.present.mockResolvedValue(true); api.models.mockResolvedValue(['test-model']); api.request.mockResolvedValue({ status: 200, body: JSON.stringify({ choices: [{ message: { tool_calls: [{ id: 'test', type: 'function', function: { name: 'check_project', arguments: '{}' } }] } }] }) })
  element = document.createElement('div'); document.body.append(element); root = createRoot(element)
})
afterEach(() => { act(() => root.unmount()); element.remove() })

async function accountUntilConsent() {
  await act(async () => root.render(<AiSetupDialog />))
  await click('IA externe via API')
  await act(async () => { element.querySelectorAll<HTMLInputElement>('input[type=radio]')[1].click() })
  await click('Suivant') // Création de clé
  await click('Suivant') // Clé déjà dans le trousseau
  expect(element.querySelector<HTMLInputElement>('#ai-key')?.value).toBe('')
  await click('Suivant') // Connexion
  await click('Tester la connexion')
  expect(api.models).toHaveBeenCalledWith({ request: api.request }, 'openai', undefined)
  await click('Suivant') // Modèle et accord
}

it('exige l’accord puis un test des outils avant d’activer l’API et d’ouvrir le chat', async () => {
  const project = useProject.getState().project
  await accountUntilConsent()
  expect(button('Suivant').disabled).toBe(true)
  expect(api.request).not.toHaveBeenCalled()
  await act(async () => { element.querySelector<HTMLInputElement>('input[type=checkbox]')!.click() })
  await click('Suivant')
  expect(button('Terminer').disabled).toBe(true)
  await click('Lancer le test')
  const test = JSON.parse(api.request.mock.calls[0][2].body)
  expect(test.tools.map((t: { function: { name: string } }) => t.function.name)).toEqual(['check_project'])
  expect(JSON.stringify(test)).not.toContain(project.id)
  expect(useProject.getState().project).toBe(project)
  await click('Terminer')
  expect(useAi.getState().settings).toMatchObject({ enabled: true, provider: 'openai', model: 'test-model', consent: true })
  expect(useAi.getState().setupOpen).toBe(false)
  expect(useAi.getState().panelOpen).toBe(true)
})

it('refuse l’activation si une API répond sans utiliser les outils demandés', async () => {
  api.request.mockResolvedValue({ status: 200, body: JSON.stringify({ choices: [{ message: { content: 'Je vais vérifier.' } }] }) })
  await accountUntilConsent()
  await act(async () => { element.querySelector<HTMLInputElement>('input[type=checkbox]')!.click() })
  await click('Suivant'); await click('Lancer le test')
  expect(button('Terminer').disabled).toBe(true)
  expect(element.textContent).toContain('n’a pas utilisé les outils')
  expect(useAi.getState().settings.enabled).toBe(false)
})
