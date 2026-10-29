// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import i18n from '../i18n'
import { createProject } from '../model/project'
import { useProject } from '../store/projectStore'
import { useUi } from '../store/uiStore'
import { useSaveFolder } from '../store/saveFolderStore'
import { StartDialog } from './StartDialog'
const recent = vi.hoisted(() => ({ listRecent: vi.fn(), loadRecent: vi.fn(), restoredProject: vi.fn(), forgetRecent: vi.fn() }))
const lifecycle = vi.hoisted(() => ({ prepareToLeave: vi.fn(), openDocument: vi.fn() }))
vi.mock('../store/persistence', () => recent)
vi.mock('../io/documentLifecycle', () => lifecycle)
vi.mock('../collab/session', () => ({ useCollab: { getState: () => ({ setDialogOpen: vi.fn() }) } }))
let root: Root, container: HTMLDivElement
beforeEach(async () => {
  vi.resetAllMocks()
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  await i18n.changeLanguage('fr')
  useProject.setState({ project: createProject('Vide'), saved: true })
  useUi.getState().setStartOpen(true)
  recent.restoredProject.mockReturnValue(null)
  lifecycle.prepareToLeave.mockResolvedValue(true)
  container = document.createElement('div'); document.body.append(container); root = createRoot(container)
})
afterEach(async () => { await act(async () => root.unmount()); container.remove() })
const lastButton = () => [...container.querySelectorAll<HTMLButtonElement>('.template-card')].find(b => b.textContent?.includes(i18n.t('start.last')))!
it('reprend le dernier récent après une fermeture sans copie de récupération', async () => {
  const p = createProject('Dernier sur disque')
  recent.listRecent.mockResolvedValue([{ id:p.id, name:p.name, updatedAt:p.updatedAt, equipment:0 }])
  recent.loadRecent.mockResolvedValue(p)
  useSaveFolder.getState().setProjectFile(p.id,'/test/dernier.avd')
  await act(async () => root.render(<StartDialog />))
  expect(lastButton().disabled).toBe(false)
  await act(async () => lastButton().click())
  expect(recent.loadRecent).toHaveBeenCalledWith(p.id)
  expect(useProject.getState().project.id).toBe(p.id)
  expect(useUi.getState().startOpen).toBe(false)
})
it('reprend une récupération déjà chargée sans la remplacer par la version du disque', async () => {
  const p = createProject('Modifications récupérées')
  useProject.setState({ project:p, saved:false })
  recent.restoredProject.mockReturnValue({id:p.id,name:p.name,updatedAt:p.updatedAt,equipment:0})
  recent.listRecent.mockResolvedValue([])
  await act(async () => root.render(<StartDialog />))
  await act(async () => lastButton().click())
  expect(recent.loadRecent).not.toHaveBeenCalled()
  expect(lifecycle.prepareToLeave).not.toHaveBeenCalled()
  expect(useProject.getState().project).toBe(p)
  expect(useProject.getState().saved).toBe(false)
})
