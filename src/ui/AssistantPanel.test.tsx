// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it, vi } from 'vitest'
import '../i18n'
import { GENERIC_LIBRARY } from '../library/generic'
import { createDraft, layoutDraft, runTool } from '../ai/tools'
import { createProject, DEFAULT_SHEET_ID } from '../model/project'
import { setProjectGuard, useProject } from '../store/projectStore'
import { useAi } from '../store/aiStore'
import { AssistantPanel } from './AssistantPanel'

vi.mock('../library', async () => ({ LIBRARY: (await import('../library/generic')).GENERIC_LIBRARY }))
vi.mock('../ai/transport', () => ({ nativeAvailable: () => true, nativeTransport: { request: vi.fn() } }))

it('propose les formats avec leur nombre de pages et réserve leur application au projet', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  const scrollTo = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollTo')
  Object.defineProperty(HTMLElement.prototype, 'scrollTo', { value: vi.fn(), configurable: true })
  const base = createProject('Pages'), ctx = { library: GENERIC_LIBRARY, describe: (i: { code: string }) => i.code }
  let draft = createDraft(base, DEFAULT_SHEET_ID)
  for (let i = 0; i < 42; i++) draft = runTool(draft, { id: String(i), name: 'add_equipment', args: { template_id: 'gen-mic-dyn' } }, ctx).draft
  setProjectGuard(() => true); useProject.setState({ project: base })
  useAi.getState().clear(); useAi.setState({ proposal: layoutDraft(draft) })
  const element = document.createElement('div'), root = createRoot(element)
  document.body.append(element)
  try {
    await act(async () => root.render(<AssistantPanel />))
    const select = element.querySelector<HTMLSelectElement>('.ai-layout select')!
    expect(select).not.toBeNull()
    expect(select.textContent).toContain('recommandé')
    expect(select.textContent).toContain('A3')
    await act(async () => { select.value = 'A2'; select.dispatchEvent(new Event('change', { bubbles: true })) })
    expect(select.value).toBe('A2')
    expect(useAi.getState().proposal?.project.settings.export?.paper).toBe('A2')
    expect(useProject.getState().project).toBe(base)
    await act(async () => useAi.setState({ busy: true }))
    expect(select.disabled).toBe(true)
    expect([...element.querySelectorAll('button')].find(b => b.textContent?.includes('Appliquer'))?.disabled).toBe(true)
  } finally {
    await act(async () => root.unmount()); element.remove(); useAi.setState({ busy: false }); useAi.getState().clear()
    if (scrollTo) Object.defineProperty(HTMLElement.prototype, 'scrollTo', scrollTo)
    else Reflect.deleteProperty(HTMLElement.prototype, 'scrollTo')
  }
})
