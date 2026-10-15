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
vi.mock('@xyflow/react', () => ({
  Handle: ({ id }: { id: string }) => <span data-handle={id} />,
  Position: { Left: 'left', Right: 'right', Top: 'top', Bottom: 'bottom' },
  useUpdateNodeInternals: () => measure,
}))

describe('stagebox repliée', () => {
  let host: HTMLDivElement, root: Root
  const template = LIBRARY_BY_ID.get('gen-console')!
  const added = addEquipment(createProject('Test'), template, { x: 0, y: 0 })
  const equipment = { ...added.project.equipment[added.id], id: 'stage', ports: Array.from({ length: 56 }, (_, i) => ({
    id: `p${i + 1}`, name: `Port ${i + 1}`, direction: i < 32 ? 'in' as const : 'out' as const, signal: 'audioAnalog' as const, connector: 'xlr3',
  })) }
  const data: EquipmentNodeData = { equipment, connectedPorts: ['p1', 'p9', 'p33'], compact: false, offPage: { p9: 'Scène' }, layer: 'all', hints: 0 }
  const draw = (next = data) => act(() => root.render(<EquipmentNode {...({ id: 'stage', data: next, selected: false } as NodeProps<EquipmentFlowNode>)} />))
  const click = (text: string) => act(() => { const button = [...host.querySelectorAll('button')].find(b => b.textContent === text); expect(button).toBeDefined(); button!.click() })

  beforeEach(() => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
    useUi.setState({ expandedEquipment: {}, presenting: false })
    host = document.createElement('div'); document.body.append(host); root = createRoot(host)
    measure.mockClear()
  })
  afterEach(() => { act(() => root.unmount()); host.remove() })

  it('garde les trois ports câblés et le renvoi, puis montre les 56 sans modifier le projet', () => {
    const project = useProject.getState().project
    draw()
    expect([...host.querySelectorAll('[data-handle]')].map(n => n.getAttribute('data-handle'))).toEqual(['p1', 'p9', 'p33'])
    expect(host.textContent).toContain('Scène')
    click('Tous les ports')
    expect(host.querySelectorAll('[data-handle]')).toHaveLength(56)
    click('Ports reliés')
    expect(host.querySelectorAll('[data-handle]')).toHaveLength(3)
    expect(useProject.getState().project).toBe(project)
    expect(measure).toHaveBeenCalledWith('stage')
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
})
