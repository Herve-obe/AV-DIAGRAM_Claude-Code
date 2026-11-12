// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it, vi } from 'vitest'
import type { ReactFlowProps, NodeProps } from '@xyflow/react'
import '../i18n'
import { LIBRARY_BY_ID } from '../library/generic'
import { addEquipment, createProject } from '../model/project'
import { useProject } from '../store/projectStore'
import { useUi } from '../store/uiStore'
import { useCollab } from '../collab/session'
import { Canvas } from './Canvas'
import { EquipmentNode, type EquipmentFlowNode, type EquipmentNodeData } from './EquipmentNode'
const flow = vi.hoisted(() => ({ props: undefined as ReactFlowProps | undefined, measure: vi.fn(), api: { fitView: vi.fn(), setViewport: vi.fn(), getViewport: () => ({ x: 0, y: 0, zoom: 1 }) } }))
vi.mock('@xyflow/react', async original => ({
  ...await original<typeof import('@xyflow/react')>(),
  ReactFlow: (props: ReactFlowProps) => { flow.props = props; return null },
  useReactFlow: () => flow.api,
  useUpdateNodeInternals: () => flow.measure,
  Handle: ({ id, isConnectable }: { id: string; isConnectable: boolean }) => <span data-port={id} data-connectable={String(isConnectable)} />,
}))
it('affiche le switch partagé et ses ports raccordables avec sa configuration incluse, puis garde le câble visible en Audio et Réseau', () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  const desk = addEquipment(createProject('Dante'), LIBRARY_BY_ID.get('gen-console')!, { x: 0, y: 0 })
  const sw = addEquipment(desk.project, LIBRARY_BY_ID.get('gen-switch8')!, { x: 400, y: 0 })
  useProject.setState({ project: sw.project })
  useUi.setState({ layer: 'sound', currentSheetId: 'sh-1', mode: 'expert', selectedEquipment: [], selectedLinks: [], hiddenSignals: [] })
  useCollab.setState({ status: 'connected', started: true, role: 'guest', userId: 'audio', claims: { sound: [{ userId: 'audio', name: 'Son', color: '#000' }] } })
  const element = document.createElement('div'); document.body.append(element); const root = createRoot(element)
  try {
    act(() => root.render(<Canvas />))
    const node = flow.props!.nodes!.find(n => n.id === sw.id)!
    expect(node.hidden).toBe(false)
    expect(node.draggable).toBe(true)
    expect(node.connectable).toBe(true)
    act(() => root.render(<EquipmentNode {...({ id: sw.id, data: node.data as EquipmentNodeData, selected: true } as NodeProps<EquipmentFlowNode>)} />))
    expect(element.querySelector('[data-connectable="true"]')).not.toBeNull()
    expect(element.querySelector<HTMLButtonElement>('.eq-port-tools button')!.disabled).toBe(false)
    const a = sw.project.equipment[desk.id].ports.find(p => p.signal === 'audioIp')!, b = sw.project.equipment[sw.id].ports[0]
    let id: string | null = null
    act(() => { id = useProject.getState().connect({ equipmentId: desk.id, portId: a.id }, { equipmentId: sw.id, portId: b.id }); root.render(<Canvas />) })
    expect(id).not.toBeNull()
    expect(flow.props!.edges!.find(l => l.id === id)!.hidden).toBe(false)
    act(() => useUi.setState({ layer: 'network' }))
    expect(flow.props!.nodes!.find(n => n.id === desk.id)!.hidden).toBe(false)
    expect(flow.props!.nodes!.find(n => n.id === sw.id)!.hidden).toBe(false)
    expect(flow.props!.edges!.find(l => l.id === id)!.hidden).toBe(false)
    act(() => useUi.setState({ layer: 'all' }))
    expect(flow.props!.nodes!.find(n => n.id === desk.id)!.draggable).toBe(false)
    expect(flow.props!.nodes!.find(n => n.id === sw.id)!.connectable).toBe(false)
  } finally { act(() => root.unmount()); element.remove(); useCollab.setState({ status: 'off' }) }
})

it('déplacer un bloc ne renouvelle que ses propres données : les autres blocs et les liaisons restent mémorisés', () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  const desk = addEquipment(createProject('Scène'), LIBRARY_BY_ID.get('gen-console')!, { x: 0, y: 0 })
  const sw = addEquipment(desk.project, LIBRARY_BY_ID.get('gen-switch8')!, { x: 400, y: 0 })
  const third = addEquipment(sw.project, LIBRARY_BY_ID.get('gen-console')!, { x: 0, y: 400 })
  useProject.setState({ project: third.project })
  useUi.setState({ layer: 'all', currentSheetId: 'sh-1', mode: 'expert', selectedEquipment: [], selectedLinks: [], hiddenSignals: [] })
  const element = document.createElement('div'); document.body.append(element); const root = createRoot(element)
  try {
    act(() => root.render(<Canvas />))
    const a = third.project.equipment[desk.id].ports.find(p => p.signal === 'audioIp')!, b = third.project.equipment[sw.id].ports[0]
    let id: string | null = null
    act(() => { id = useProject.getState().connect({ equipmentId: desk.id, portId: a.id }, { equipmentId: sw.id, portId: b.id }) })
    const dataOf = (eqId: string) => flow.props!.nodes!.find(n => n.id === eqId)!.data
    const before = { desk: dataOf(desk.id), sw: dataOf(sw.id), third: dataOf(third.id), edge: flow.props!.edges!.find(l => l.id === id)!.data }
    act(() => useProject.getState().moveEquipment(third.id, { x: 50, y: 450 }))
    expect(dataOf(third.id)).not.toBe(before.third)
    expect(dataOf(desk.id)).toBe(before.desk)
    expect(dataOf(sw.id)).toBe(before.sw)
    expect(flow.props!.edges!.find(l => l.id === id)!.data).toBe(before.edge)
  } finally { act(() => root.unmount()); element.remove() }
})
