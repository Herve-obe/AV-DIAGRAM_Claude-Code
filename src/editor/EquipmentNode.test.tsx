// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { NodeProps } from '@xyflow/react'
import { LIBRARY_BY_ID } from '../library/generic'
import { addEquipment, createProject } from '../model/project'
import { useProject } from '../store/projectStore'
import { useUi } from '../store/uiStore'
import { EquipmentNode, type EquipmentFlowNode, type EquipmentNodeData } from './EquipmentNode'

const measure = vi.hoisted(() => vi.fn())
const rights = vi.hoisted(() => ({ equipment: true, port: true }))
vi.mock('../collab/useEditing', () => ({ useEditing: () => ({ equipment: () => rights.equipment, port: () => rights.port }) }))
vi.mock('@xyflow/react', () => ({
  Handle: ({ id }: { id: string }) => <span data-handle={id} />,
  Position: { Left: 'left', Right: 'right', Top: 'top', Bottom: 'bottom' },
  useUpdateNodeInternals: () => measure,
}))

describe('prises repliées de toutes les familles', () => {
  let host: HTMLDivElement, root: Root
  const template = LIBRARY_BY_ID.get('gen-console')!
  const added = addEquipment(createProject('Test'), template, { x: 0, y: 0 })
  const equipment = { ...added.project.equipment[added.id], id: 'stage', ports: Array.from({ length: 56 }, (_, i) => ({
    id: `p${i + 1}`, name: `Port ${i + 1}`, direction: i < 32 ? 'in' as const : 'out' as const, signal: 'audioAnalog' as const, connector: 'xlr3',
  })) }
  const data: EquipmentNodeData = { equipment, connectedPorts: ['p1', 'p9', 'p33'], compact: false, offPage: { p9: 'Scène' }, layer: 'all', hints: 0 }
  function Live({ data: next }: { data: EquipmentNodeData }) {
    const eq = useProject(s => s.project.equipment.stage)
    return <EquipmentNode {...({ id: 'stage', data: { ...next, equipment: eq }, selected: true } as NodeProps<EquipmentFlowNode>)} />
  }
  const draw = (next = data) => act(() => {
    useProject.setState(s => ({ project: { ...s.project, equipment: { stage: next.equipment } } }))
    root.render(<Live data={next} />)
  })
  const click = (text: string) => act(() => { const button = [...host.querySelectorAll('button')].find(b => b.textContent?.startsWith(text)); expect(button).toBeDefined(); button!.click() })

  beforeEach(() => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
    useUi.setState({ presenting: false })
    useProject.setState({ project: { ...createProject('Test'), equipment: { stage: equipment } }, past: [], future: [], saved: true })
    rights.equipment = true; rights.port = true
    host = document.createElement('div'); document.body.append(host); root = createRoot(host)
    measure.mockClear()
  })
  afterEach(() => { act(() => root.unmount()); host.remove() })

  it('garde les prises câblées et mémorise le choix après sauvegarde, réouverture et annulation', () => {
    draw()
    expect([...host.querySelectorAll('[data-handle]')].map(n => n.getAttribute('data-handle'))).toEqual(['p1', 'p9', 'p33'])
    expect(host.textContent).toContain('Scène')
    click('Tous les ports')
    expect(host.querySelectorAll('[data-handle]')).toHaveLength(56)
    expect(useProject.getState().saved).toBe(false)
    const saved = JSON.stringify(useProject.getState().project)
    act(() => useProject.getState().load(JSON.parse(saved)))
    expect(host.querySelectorAll('[data-handle]')).toHaveLength(56)
    click('Ports reliés')
    expect(host.querySelectorAll('[data-handle]')).toHaveLength(3)
    act(() => useProject.getState().undo())
    expect(host.querySelectorAll('[data-handle]')).toHaveLength(56)
    act(() => useProject.getState().redo())
    expect(host.querySelectorAll('[data-handle]')).toHaveLength(3)
    expect(useProject.getState().project.equipment.stage.ports).toHaveLength(56)
    expect(measure).toHaveBeenCalledWith('stage')
  })
  it.each(['camera', 'lightingControl', 'network'] as const)('applique les mêmes commandes à %s, même avec peu de prises', family => {
    const small = { ...equipment, family, ports: equipment.ports.slice(0, 4) }
    draw({ ...data, equipment: small })
    expect(host.querySelectorAll('[data-handle]')).toHaveLength(4)
    click('Ports reliés')
    expect(host.querySelectorAll('[data-handle]')).toHaveLength(1)
    click('Ajouter une connexion')
    expect(host.textContent).toContain('3 prises disponibles')
    expect(host.querySelector('optgroup')?.label).toBe('Audio analogique')
    click('Tous les ports')
    expect(host.querySelectorAll('[data-handle]')).toHaveLength(4)
  })
  it('respecte les droits et distingue les bidirectionnels des sorties', () => {
    rights.equipment = false; rights.port = false
    draw({ ...data, equipment: { ...equipment, ports: [...equipment.ports, { id: 'net', name: 'Réseau', signal: 'network', direction: 'bidir', connector: 'rj45' }] } })
    expect(host.textContent).toContain('sorties : 23 · bidirectionnelles : 1')
    expect(host.querySelector('button')?.disabled).toBe(true)
    expect([...host.querySelectorAll('button')].some(b => b.textContent?.startsWith('Ajouter une connexion'))).toBe(false)
    expect(useProject.getState().project.equipment.stage.portsExpanded).toBeUndefined()
  })
  it('révèle un port libre, le conserve après branchement et le replie après annulation', () => {
    draw(); click('Ajouter une connexion')
    act(() => { const select = host.querySelector('select')!; select.value = 'p2'; select.dispatchEvent(new Event('change', { bubbles: true })) })
    expect(host.querySelectorAll('[data-handle]')).toHaveLength(4)
    draw({ ...data, connectedPorts: [...data.connectedPorts, 'p2'] })
    expect(host.querySelector('select')).toBeNull()
    draw(data)
    expect(host.querySelectorAll('[data-handle]')).toHaveLength(3)
  })
  it('donne un accès direct aux sorties libres et révèle une sortie à droite', () => {
    draw(); click('Ajouter une connexion'); click('Sorties')
    const select = host.querySelector('select')!
    expect([...select.options].slice(1).map(o => o.value)).toEqual(Array.from({ length: 23 }, (_, i) => `p${i + 34}`))
    act(() => { select.value = 'p34'; select.dispatchEvent(new Event('change', { bubbles: true })) })
    expect(host.querySelector('.port-right[data-dir="out"] [data-handle="p34"]')).not.toBeNull()
    draw({ ...data, connectedPorts: [...data.connectedPorts, 'p34'] })
    draw(data)
    expect(host.querySelector('[data-handle="p34"]')).toBeNull()
  })
  it('sépare aussi les ports bidirectionnels en respectant le calque actif', () => {
    const next: EquipmentNodeData = { ...data, layer: 'sound', equipment: { ...equipment, ports: [...equipment.ports,
      { id: 'dante', name: 'Dante', direction: 'bidir', signal: 'audioIp', connector: 'ethercon' },
      { id: 'sdi', name: 'SDI', direction: 'out', signal: 'video', connector: 'bnc' },
    ] } }
    draw(next); click('Ajouter une connexion'); click('Bidirectionnels')
    expect([...host.querySelectorAll('option')].slice(1).map(o => o.value)).toEqual(['dante'])
    click('Sorties')
    expect(host.querySelector('option[value="sdi"]')).toBeNull()
    expect(host.querySelector('option[value="p34"]')).not.toBeNull()
  })
  it('propose directement les sorties quand toutes les entrées sont déjà câblées', () => {
    draw({ ...data, connectedPorts: equipment.ports.filter(p => p.direction === 'in').map(p => p.id) })
    click('Ajouter une connexion')
    expect([...host.querySelectorAll('option')].slice(1).map(o => o.value)).toEqual(Array.from({ length: 24 }, (_, i) => `p${i + 33}`))
    expect([...host.querySelectorAll('button')].find(b => b.textContent === 'Entrées')).toBeUndefined()
    expect([...host.querySelectorAll('button')].find(b => b.textContent === 'Sorties')?.getAttribute('aria-pressed')).toBe('true')
  })
})
