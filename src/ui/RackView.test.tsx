// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import '../i18n'
import { useCollab } from '../collab/session'
import { LIBRARY_BY_ID } from '../library/generic'
import * as ops from '../model/project'
import { addRack } from '../model/racks'
import { useProject, setHistoryDriver, setProjectGuard } from '../store/projectStore'
import { useUi } from '../store/uiStore'
import { RackView } from './RackView'
import { ModuleEditor } from './ModuleEditor'

const exportOpen = vi.hoisted(() => vi.fn())
vi.mock('./ExportPdfDialog', () => ({ useExportPdf: { getState: () => ({ setOpen: exportOpen }) } }))

describe('vue Baies : commandes et cartes', () => {
  let element: HTMLDivElement, root: Root, id: string, rackId: string
  const state = () => useProject.getState()
  const click = (label: string) => act(() => {
    const button = [...element.querySelectorAll('button')].find(b => b.textContent?.trim() === label)
    expect(button, label).toBeDefined(); button!.click()
  })
  const change = (selector: string, value: string) => act(() => {
    const el = element.querySelector<HTMLInputElement | HTMLSelectElement>(selector)!
    const proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(el, value)
    el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }))
  })
  beforeEach(() => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
    setProjectGuard(() => true); setHistoryDriver(null)
    const host = ops.addEquipment(ops.createProject('Baies'), LIBRARY_BY_ID.get('gen-modular-chassis')!, { x: 0, y: 0 })
    id = host.id
    const rack = addRack(host.project, { heightU: 10, depthMm: 600, maxWeightKg: 50 })
    rackId = rack.id
    useProject.setState({ project: rack.project, past: [], future: [] })
    useUi.setState({ view: 'racks', mode: 'expert', selectedEquipment: [id], selectedLinks: [] })
    useCollab.setState({ role: null, status: 'off' })
    element = document.createElement('div'); document.body.append(element); root = createRoot(element)
  })
  afterEach(() => { act(() => root.unmount()); element.remove(); setProjectGuard(() => true) })

  it('permet le montage au clavier, refuse un dépassement et ouvre le bon export', () => {
    act(() => root.render(<RackView />))
    change('#mount-u', '10')
    click('Monter / déplacer')
    expect(state().project.equipment[id].mount).toBeUndefined()
    expect(element.textContent).toContain('dépasse de la baie')
    change('#mount-u', '4'); change('#mount-face', 'rear')
    click('Monter / déplacer')
    expect(state().project.equipment[id].mount).toEqual({ rackId, face: 'rear', u: 4 })
    click('Exporter les baies en PDF')
    expect(exportOpen).toHaveBeenCalledWith(true)
    const unmount = element.querySelector<HTMLButtonElement>('button[aria-label="Retirer de la baie"]')!
    act(() => unmount.click())
    expect(state().project.equipment[id].mount).toBeUndefined()
    act(() => state().undo())
    expect(state().project.equipment[id].mount?.u).toBe(4)
  })
  it('désactive les réglages communs de baie côté invité', () => {
    useCollab.setState({ role: 'guest' })
    act(() => root.render(<RackView />))
    expect(element.querySelector<HTMLInputElement>('.rack-name')!.disabled).toBe(true)
    expect(element.querySelector<HTMLFieldSetElement>('.rack-limits')!.disabled).toBe(true)
    expect([...element.querySelectorAll('button')].find(b => b.textContent?.includes('Ajouter une baie'))!.disabled).toBe(true)
  })
  it('insère une carte et demande confirmation avant de supprimer ses câbles ; Annuler restaure tout', () => {
    function Editor() { const eq = useProject(s => s.project.equipment[id]); return <ModuleEditor eq={eq} /> }
    act(() => root.render(<Editor />))
    change('select[aria-label="Insérer une carte dans Slot 1"]', 'gen-module-audio')
    const eq = state().project.equipment[id]
    expect(eq.modules).toHaveLength(1)
    act(() => { state().connect({ equipmentId: id, portId: eq.ports[2].id }, { equipmentId: id, portId: eq.ports[0].id }) })
    expect(Object.keys(state().project.links)).toHaveLength(1)
    click('Retirer la carte')
    expect(state().project.equipment[id].modules).toHaveLength(1)
    click('Retirer et supprimer 1 liaison(s)')
    expect(state().project.equipment[id].ports).toHaveLength(0)
    expect(Object.keys(state().project.links)).toHaveLength(0)
    act(() => state().undo())
    expect(state().project.equipment[id].modules).toHaveLength(1)
    expect(Object.keys(state().project.links)).toHaveLength(1)
  })
})
