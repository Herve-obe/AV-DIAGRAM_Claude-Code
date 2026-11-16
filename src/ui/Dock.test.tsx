// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import i18n from '../i18n'
import { LIBRARY_BY_ID } from '../library/generic'
import { addEquipment, connect, createProject } from '../model/project'
import { useProject } from '../store/projectStore'
import { useUi } from '../store/uiStore'
import { blur, buttonByName, click, mount, typeInto, type Mounted } from '../test-utils/dom'
import { Dock } from './Dock'

const t = (k: string, o?: Record<string, unknown>) => i18n.t(k, o) as string

/** Console -> caméra reliées par un seul câble. */
function setup(withLink = true) {
  const a = addEquipment(createProject('Test'), LIBRARY_BY_ID.get('gen-console')!, { x: 0, y: 0 })
  const b = addEquipment(a.project, LIBRARY_BY_ID.get('gen-camera')!, { x: 400, y: 0 })
  let project = b.project
  let link: string | null = null
  if (withLink) {
    const out = project.equipment[a.id].ports.find(p => p.direction === 'out')!
    const inp = project.equipment[b.id].ports.find(p => p.direction === 'in') ?? project.equipment[b.id].ports[0]
    const r = connect(project, { equipmentId: a.id, portId: out.id }, { equipmentId: b.id, portId: inp.id })
    project = r.project; link = r.id
  }
  useProject.setState({ project, past: [], future: [] })
  return { a: a.id, b: b.id, link }
}

let view: Mounted
beforeEach(() => { useUi.setState({ dockOpen: true, dockTab: 'cables', mode: 'expert', selectedLinks: [], selectedEquipment: [] }) })
afterEach(() => view?.unmount())

describe('Dock', () => {
  it('liste chaque liaison avec son numéro et les noms des équipements reliés', () => {
    const { a, b, link } = setup()
    view = mount(<Dock />)
    const project = useProject.getState().project
    const row = view.element.querySelector('tbody tr')!
    expect(row.textContent).toContain(project.links[link!].label)
    expect(row.textContent).toContain(project.equipment[a].name)
    expect(row.textContent).toContain(project.equipment[b].name)
  })

  it('cliquer une ligne du câblage sélectionne la liaison', () => {
    const { link } = setup()
    view = mount(<Dock />)
    click(view.element.querySelector('tbody tr')!)
    expect(useUi.getState().selectedLinks).toEqual([link])
  })

  it('le compteur de l’onglet Câblage suit le nombre de liaisons', () => {
    setup()
    view = mount(<Dock />)
    const tab = buttonByName(view.element, t('dock.cables'))
    expect(tab.textContent).toContain('1')
    useProject.getState().remove([], Object.keys(useProject.getState().project.links))
    view.render(<Dock />)
    expect(buttonByName(view.element, t('dock.cables')).textContent).toContain('0')
    expect(view.element.textContent).toContain(t('dock.none'))
  })

  it('« Renuméroter » n’apparaît qu’en mode Expert et renumérote la série', () => {
    setup()
    view = mount(<Dock />)
    expect(buttonByName(view.element, t('dock.renumber'))).toBeTruthy()
    const before = useProject.getState().project
    click(buttonByName(view.element, t('dock.renumber')))
    expect(useProject.getState().project).not.toBe(before) // un pas d’historique est ajouté
    expect(useProject.getState().past.length).toBe(1)
    useUi.setState({ mode: 'beginner' })
    view.render(<Dock />)
    expect(() => buttonByName(view.element, t('dock.renumber'))).toThrow()
  })

  it('l’onglet Nomenclature totalise les équipements', () => {
    setup()
    view = mount(<Dock />)
    click(buttonByName(view.element, t('dock.bom')))
    expect(useUi.getState().dockTab).toBe('bom')
    const foot = view.element.querySelector('tfoot')!
    expect(foot.textContent).toContain(t('dock.total'))
    // deux équipements posés : le total d’équipements de la nomenclature vaut 2
    expect(foot.querySelectorAll('td')[1].textContent).toBe('2')
  })

  it('un nouveau multipaire se crée puis se modifie, et la suppression le retire', () => {
    setup(false)
    view = mount(<Dock />)
    click(buttonByName(view.element, t('dock.multicores')))
    expect(view.element.textContent).toContain(t('dock.noMulticore'))
    click(buttonByName(view.element, t('dock.multicoreNew')))
    const project = () => useProject.getState().project
    expect(Object.keys(project().multicores ?? {})).toHaveLength(1)
    const id = Object.keys(project().multicores!)[0]
    const pairs = view.element.querySelector<HTMLInputElement>(`input[aria-label="${t('dock.pairs')}"]`)!
    typeInto(pairs, '24')
    blur(pairs)
    expect(project().multicores![id].pairs).toBe(24)
    click(buttonByName(view.element, t('dock.delete')))
    expect(project().multicores ?? {}).toEqual({})
  })
})
