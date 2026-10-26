// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from 'vitest'
import '../i18n'
import { GENERIC_LIBRARY } from '../library/generic'
import { createProject, DEFAULT_SHEET_ID } from '../model/project'
import { createDraft, layoutDraft, runTool } from '../ai/tools'
import { setProjectGuard, useProject } from './projectStore'
import { isReady, useAi } from './aiStore'
import { useLibrary } from './libraryStore'
import { useUi } from './uiStore'

const native = vi.hoisted(() => ({ request: vi.fn(), stop: vi.fn(), ensure: vi.fn() }))
vi.mock('../ai/transport', () => ({ nativeTransport: { request: native.request } }))
vi.mock('../ai/local', () => ({ ensureServer: native.ensure, stopServer: native.stop }))
vi.mock('../library', async () => ({ LIBRARY: (await import('../library/generic')).GENERIC_LIBRARY }))
const settings = { enabled: true, consent: false, provider: 'builtin' as const, model: 'qwen3-4b', managed: { catalogId: 'qwen3-4b' } }
const answer = (text: string) => ({ status: 200, body: JSON.stringify({ choices: [{ message: { content: text } }] }) })
const proposal = () => {
  const base = useProject.getState().project
  return runTool(createDraft(base, DEFAULT_SHEET_ID), { id: '1', name: 'add_equipment', args: { template_id: 'gen-mic-dyn' } }, { library: GENERIC_LIBRARY, describe: i => i.code }).draft
}

beforeEach(() => {
  useLibrary.setState({ userTemplates: [] })
  vi.clearAllMocks(); setProjectGuard(() => true)
  useProject.setState({ project: createProject('Test'), past: [], future: [] })
  useAi.getState().clear(); useAi.setState({ settings, setupOpen: false })
  native.stop.mockResolvedValue(undefined); native.ensure.mockResolvedValue(true)
  native.request.mockResolvedValue(answer('Bonjour'))
})

it('limite réellement les ajouts IA au parc et bloque un catalogue entreprise vide', async () => {
  useAi.setState({ settings: { ...settings, libraryScope: 'company' } })
  await useAi.getState().send('Ajoute un micro')
  expect(native.request).not.toHaveBeenCalled()
  expect(useAi.getState().bubbles.at(-1)?.text).toContain('vide')
  const own = { ...GENERIC_LIBRARY.find(t => t.id === 'gen-mic-dyn')!, id: 'user-mic', status: 'user' as const }
  useLibrary.setState({ userTemplates: [own] })
  native.request.mockResolvedValueOnce({ status: 200, body: JSON.stringify({ choices: [{ message: { tool_calls: [{ id: '1', type: 'function', function: { name: 'add_equipment', arguments: JSON.stringify({ template_id: 'gen-mic-dyn' }) } }] } }] }) })
  await useAi.getState().send('Ajoute un micro sans connexion')
  expect(useAi.getState().proposal).toBeNull()
  expect(useAi.getState().history.some(m => m.role === 'tool' && m.results.some(r => r.content.includes('Modèle inconnu')))).toBe(true)
})

it('le mode embarqué ne demande ni compte ni consentement pour envoyer', async () => {
  await useAi.getState().send('Bonjour')
  expect(native.ensure).toHaveBeenCalledWith({ catalogId: 'qwen3-4b' }, undefined)
  expect(native.request.mock.calls[0][0]).toBe('builtin')
  expect(useAi.getState().bubbles.at(-1)?.text).toBe('Bonjour')
})
it('ouvre la configuration sans assistant actif et ferme le chat à la désactivation', () => {
  useAi.getState().saveSettings({ enabled: false, consent: false })
  useAi.getState().setPanelOpen(true)
  expect(useAi.getState().setupOpen).toBe(true)
  expect(useAi.getState().panelOpen).toBe(false)
  useAi.getState().saveSettings(settings)
  useAi.getState().setPanelOpen(true)
  expect(useAi.getState().panelOpen).toBe(true)
  useAi.getState().saveSettings({ ...settings, enabled: false })
  expect(useAi.getState().panelOpen).toBe(false)
  expect(isReady({ enabled: true, provider: 'openai', model: 'test', consent: false })).toBe(false)
})
it('applique une proposition dans une seule étape annulable', () => {
  const before = useProject.getState().project
  useAi.setState({ proposal: proposal() }); useAi.getState().applyProposal()
  expect(Object.keys(useProject.getState().project.equipment)).toHaveLength(1)
  useProject.getState().undo(); expect(useProject.getState().project).toBe(before)
})
it('prévisualise un nouveau format sans changer le projet ni appeler le modèle, puis annule tout ensemble', () => {
  const before = useProject.getState().project
  useAi.setState({ proposal: layoutDraft(proposal()) })
  useAi.getState().setProposalPaper('A2')
  expect(useProject.getState().project).toBe(before)
  expect(useAi.getState().proposal?.project.settings.export?.paper).toBe('A2')
  expect(native.request).not.toHaveBeenCalled()
  useAi.getState().applyProposal()
  expect(useProject.getState().project.settings.export?.paper).toBe('A2')
  useProject.getState().undo()
  expect(useProject.getState().project).toBe(before)
})
it('refuse un changement de format interdit ou pendant une requête', () => {
  const draft = layoutDraft(proposal())
  useAi.setState({ proposal: draft }); setProjectGuard(() => false)
  useAi.getState().setProposalPaper('A2')
  expect(useAi.getState().proposal).toBe(draft)
  expect(useAi.getState().bubbles.at(-1)?.text).toContain('droits')
  setProjectGuard(() => true); useAi.setState({ busy: true })
  useAi.getState().setProposalPaper('A2'); useAi.getState().applyProposal()
  expect(useAi.getState().proposal).toBe(draft)
  expect(useProject.getState().project).toBe(draft.base)
  useAi.setState({ busy: false })
})
it('recalcule la disposition après de nouveaux ajouts sans perdre les ajouts précédents', () => {
  const first = layoutDraft(proposal())
  const next = runTool(first, { id: 'more', name: 'add_equipment', args: { template_id: 'gen-mic-dyn' } }, { library: GENERIC_LIBRARY, describe: i => i.code }).draft
  expect(next.layout).toBeUndefined()
  const second = layoutDraft(next)
  expect(second.addedEquipment).toHaveLength(2)
  expect(Object.keys(second.project.equipment)).toHaveLength(2)
  expect(second.layout?.choices.every(c => Object.keys(c.project.equipment).length === 2)).toBe(true)
})
it('refuse une proposition si les droits ont changé avant son application', () => {
  const before = useProject.getState().project
  useAi.setState({ proposal: proposal() }); setProjectGuard(() => false)
  useAi.getState().applyProposal()
  expect(useProject.getState().project).toBe(before)
  expect(useAi.getState().bubbles.at(-1)?.text).toContain('droits')
})
it('écarte la proposition après une modification du schéma', () => {
  useAi.setState({ proposal: proposal() })
  useProject.getState().rename('Modifié'); useAi.getState().applyProposal()
  expect(Object.keys(useProject.getState().project.equipment)).toHaveLength(0)
  expect(useAi.getState().proposal).toBeNull()
})
it('ne conserve pas une réponse tardive après un changement de projet', async () => {
  let resolve!: (r: ReturnType<typeof answer>) => void
  native.request.mockImplementation(() => new Promise(r => { resolve = r }))
  const pending = useAi.getState().send('Vérifie mon schéma')
  await vi.waitFor(() => expect(native.request).toHaveBeenCalled())
  useProject.setState({ project: createProject('Autre projet') })
  resolve(answer('Ancien projet'))
  await pending
  expect(useAi.getState().bubbles).toEqual([]); expect(useAi.getState().history).toEqual([])
  expect(useAi.getState().busy).toBe(false); expect(native.stop).toHaveBeenCalled()
})
it('arrête le moteur géré et ignore la réponse d’une requête arrêtée', async () => {
  let resolve!: (r: ReturnType<typeof answer>) => void
  native.request.mockImplementation(() => new Promise(r => { resolve = r }))
  const pending = useAi.getState().send('Bonjour')
  await vi.waitFor(() => expect(native.request).toHaveBeenCalled())
  useAi.getState().cancel(); resolve(answer('Trop tard')); await pending
  expect(useAi.getState().bubbles.some(b => b.text === 'Trop tard')).toBe(false)
  expect(native.stop).toHaveBeenCalledOnce()
})

it('revient à l’accueil après la configuration ouverte par l’installeur uniquement', () => {
  useUi.getState().setStartOpen(false)
  useAi.setState({ setupOpen: true, installerDirectory: 'C:/Models' })
  useAi.getState().setSetupOpen(false)
  expect(useUi.getState().startOpen).toBe(true)
  expect(useAi.getState().installerDirectory).toBeNull()
  useUi.getState().setStartOpen(false)
  useAi.getState().setSetupOpen(true)
  useAi.getState().setSetupOpen(false)
  expect(useUi.getState().startOpen).toBe(false)
})

it('réorganise sans lancer le modèle, puis applique et annule dans une étape', async () => {
  const { buildTemplate } = await import('../library/templates')
  const before = buildTemplate('concert', 'Concert')
  useProject.setState({ project: before, past: [], future: [] })
  useUi.getState().setSheet(DEFAULT_SHEET_ID)
  useAi.setState({ settings: { ...settings, libraryScope: 'company' } })
  await useAi.getState().send('Adapte ce schéma pour qu’il tienne sur une seule page')
  expect(native.request).not.toHaveBeenCalled()
  expect(native.ensure).not.toHaveBeenCalled()
  expect(useProject.getState().project).toBe(before)
  expect(useAi.getState().proposal?.rearrangedEquipment).toHaveLength(13)
  useAi.getState().applyProposal()
  expect(Object.keys(useProject.getState().project.links)).toHaveLength(15)
  useProject.getState().undo()
  expect(useProject.getState().project).toBe(before)
})
