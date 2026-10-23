// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it, vi } from 'vitest'
import '../i18n'
import { GENERIC_LIBRARY } from '../library/generic'
import { addEquipment, createProject, DEFAULT_SHEET_ID } from '../model/project'
import { createDraft, runTool } from '../ai/tools'
import { useLibrary } from '../store/libraryStore'
import { CompanyAlerts } from './CompanyAlerts'

vi.mock('../library', async () => ({ LIBRARY: (await import('../library/generic')).GENERIC_LIBRARY }))
it('affiche les mêmes alertes pour des ajouts manuels et une proposition IA', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  const own = { ...GENERIC_LIBRARY.find(t => t.id === 'gen-mic-dyn')!, id: 'user-mic', status: 'user' as const, companyQuantity: 1 }
  useLibrary.setState({ userTemplates: [own] })
  const base = createProject('Fictif'), ctx = { library: [own, ...GENERIC_LIBRARY], company: [own], describe: (i: { code: string }) => i.code }
  let manual = base, draft = createDraft(base, DEFAULT_SHEET_ID)
  for (const template of [own, own, GENERIC_LIBRARY.find(t => t.id === 'gen-mic-dyn')!]) {
    manual = addEquipment(manual, template, { x: 0, y: 0 }).project
    draft = runTool(draft, { id: 'add', name: 'add_equipment', args: { template_id: template.id } }, ctx).draft
  }
  const element = document.createElement('div'), root = createRoot(element)
  try {
    await act(async () => root.render(<CompanyAlerts project={manual} />))
    const text = element.textContent
    expect(text).toContain('2 exemplaire(s) utilisé(s), pour 1')
    expect(text).toContain('Disponibilité non vérifiée')
    expect(text).toContain('bibliothèque générale')
    await act(async () => root.render(<CompanyAlerts project={draft.project} />))
    expect(element.textContent).toBe(text)
    const checks = JSON.parse(runTool(draft, { id: 'check', name: 'check_project', args: {} }, ctx).content)
    expect(checks.company_alerts.map((a: { code: string }) => a.code)).toEqual(['shortage', 'outside', 'unknown'])
  } finally { act(() => root.unmount()); useLibrary.setState({ userTemplates: [] }) }
})
