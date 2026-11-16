// @vitest-environment jsdom
import { ReactFlowProvider } from '@xyflow/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import i18n from '../i18n'
import { LIBRARY_BY_ID } from '../library/generic'
import { addEquipment, connect, createProject } from '../model/project'
import { useProject } from '../store/projectStore'
import { useUi } from '../store/uiStore'
import { blur, buttonByName, click, mount, press, typeInto, type Mounted } from '../test-utils/dom'
import { Inspector } from './Inspector'

const t = (k: string, o?: Record<string, unknown>) => i18n.t(k, o) as string

/** Projet avec une console reliée à une caméra ; renvoie les identifiants utiles. */
function setup() {
  const a = addEquipment(createProject('Test'), LIBRARY_BY_ID.get('gen-console')!, { x: 0, y: 0 })
  const b = addEquipment(a.project, LIBRARY_BY_ID.get('gen-camera')!, { x: 400, y: 0 })
  const eqA = b.project.equipment[a.id], eqB = b.project.equipment[b.id]
  const out = eqA.ports.find(p => p.direction === 'out')!
  const inp = eqB.ports.find(p => p.direction === 'in') ?? eqB.ports[0]
  const link = connect(b.project, { equipmentId: a.id, portId: out.id }, { equipmentId: b.id, portId: inp.id })
  useProject.setState({ project: link.project, past: [], future: [] })
  return { a: a.id, b: b.id, link: link.id! }
}

const Wrapped = () => <ReactFlowProvider><Inspector /></ReactFlowProvider>
let view: Mounted
beforeEach(() => { useUi.setState({ mode: 'expert', selectedEquipment: [], selectedLinks: [] }) })
afterEach(() => view?.unmount())

describe('Inspector', () => {
  it('affiche le nom de l’équipement sélectionné et renomme à la sortie du champ, en un pas annulable', () => {
    const { a } = setup()
    useUi.setState({ selectedEquipment: [a], selectedLinks: [] })
    view = mount(<Wrapped />)
    const input = view.element.querySelector<HTMLInputElement>('#eq-name')!
    expect(input.value).toBe(useProject.getState().project.equipment[a].name)
    typeInto(input, 'Régie façade')
    expect(useProject.getState().project.equipment[a].name).not.toBe('Régie façade') // pas de validation avant la sortie
    blur(input)
    expect(useProject.getState().project.equipment[a].name).toBe('Régie façade')
    useProject.getState().undo()
    expect(useProject.getState().project.equipment[a].name).not.toBe('Régie façade')
  })

  it('Échap abandonne la saisie du nom sans modifier le projet', () => {
    const { a } = setup()
    const before = useProject.getState().project.equipment[a].name
    useUi.setState({ selectedEquipment: [a], selectedLinks: [] })
    view = mount(<Wrapped />)
    const input = view.element.querySelector<HTMLInputElement>('#eq-name')!
    typeInto(input, 'Abandonné')
    press(input, 'Escape')
    expect(useProject.getState().project.equipment[a].name).toBe(before)
    expect(view.element.querySelector<HTMLInputElement>('#eq-name')!.value).toBe(before)
  })

  it('le bouton de rotation change l’orientation de l’équipement', () => {
    const { a } = setup()
    useUi.setState({ selectedEquipment: [a], selectedLinks: [] })
    view = mount(<Wrapped />)
    const before = useProject.getState().project.equipment[a].rotation ?? 0
    click(buttonByName(view.element, t('inspector.rotateCw')))
    expect(useProject.getState().project.equipment[a].rotation ?? 0).not.toBe(before)
  })

  it('« Dupliquer » ajoute un équipement et le sélectionne', () => {
    const { a } = setup()
    useUi.setState({ selectedEquipment: [a], selectedLinks: [] })
    view = mount(<Wrapped />)
    const count = Object.keys(useProject.getState().project.equipment).length
    click(buttonByName(view.element, t('inspector.duplicate')))
    expect(Object.keys(useProject.getState().project.equipment)).toHaveLength(count + 1)
    expect(useUi.getState().selectedEquipment).toHaveLength(1)
    expect(useUi.getState().selectedEquipment[0]).not.toBe(a)
  })

  it('en mode débutant, la famille et la puissance (réservées à Expert) sont absentes', () => {
    const { a } = setup()
    useUi.setState({ mode: 'beginner', selectedEquipment: [a], selectedLinks: [] })
    view = mount(<Wrapped />)
    expect(view.element.querySelector('#eq-family')).toBeNull()
    expect(view.element.querySelector('#eq-power')).toBeNull()
    useUi.setState({ mode: 'expert' })
    view.render(<Wrapped />)
    expect(view.element.querySelector('#eq-family')).not.toBeNull()
    expect(view.element.querySelector('#eq-power')).not.toBeNull()
  })

  it('une liaison sélectionnée affiche son numéro et enregistre sa longueur', () => {
    const { link } = setup()
    useUi.setState({ selectedEquipment: [], selectedLinks: [link] })
    view = mount(<Wrapped />)
    expect(view.element.textContent).toContain(useProject.getState().project.links[link].label)
    const length = view.element.querySelector<HTMLInputElement>('#lk-length')!
    typeInto(length, '12.5')
    press(length, 'Enter')
    expect(useProject.getState().project.links[link].lengthM).toBe(12.5)
  })
})
