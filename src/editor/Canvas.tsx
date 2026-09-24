// Canevas du synoptique (React Flow). Le store du projet est la source de vérité ;
// React Flow garde seulement les mesures des blocs et l'état de glissement.
import { useCallback, useEffect, useMemo, useState, type DragEvent } from 'react'
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  Controls,
  MiniMap,
  ReactFlow,
  applyNodeChanges,
  useReactFlow,
  type Connection,
  type NodeChange,
  type OnSelectionChangeParams,
} from '@xyflow/react'
import { LIBRARY_BY_ID } from '../library/generic'
import { SIGNAL_STYLE } from '../model/signals'
import { useProject } from '../store/projectStore'
import { useIssues, worstByLink } from '../store/useIssues'
import { useUi } from '../store/uiStore'
import { EquipmentNode, type EquipmentFlowNode } from './EquipmentNode'
import { SignalEdge, type SignalFlowEdge } from './SignalEdge'

export const DND_MIME = 'application/x-avd-template'

const nodeTypes = { equipment: EquipmentNode }
const edgeTypes = { signal: SignalEdge }

export function Canvas() {
  const project = useProject((s) => s.project)
  const { moveEquipment, beginGesture, connect, remove, addEquipment } = useProject.getState()
  const { selectedEquipment, selectedLinks, hiddenSignals, mode, focusRequest, select } = useUi()
  const issues = useIssues()
  const rf = useReactFlow()

  // Nœuds : reconstruits depuis le projet en conservant les mesures faites par React Flow
  const [nodes, setNodes] = useState<EquipmentFlowNode[]>([])
  useEffect(() => {
    setNodes((prev) => {
      const measured = new Map(prev.map((n) => [n.id, n.measured]))
      return Object.values(project.equipment).map((eq) => ({
        id: eq.id,
        type: 'equipment',
        position: eq.position,
        data: { equipment: eq, compact: mode === 'beginner' },
        selected: selectedEquipment.includes(eq.id),
        measured: measured.get(eq.id),
      }))
    })
  }, [project.equipment, selectedEquipment, mode])

  const edges = useMemo<SignalFlowEdge[]>(() => {
    const worst = worstByLink(issues)
    return Object.values(project.links).map((l) => {
      const port = project.equipment[l.source.equipmentId]?.ports.find((p) => p.id === l.source.portId)
      const signal = port?.signal ?? 'audioAnalog'
      return {
        id: l.id,
        type: 'signal',
        source: l.source.equipmentId,
        sourceHandle: l.source.portId,
        target: l.target.equipmentId,
        targetHandle: l.target.portId,
        selected: selectedLinks.includes(l.id),
        hidden: hiddenSignals.includes(signal),
        data: { signal, label: l.label, severity: worst.get(l.id), showLabel: mode === 'expert' },
      }
    })
  }, [project.links, project.equipment, issues, selectedLinks, hiddenSignals, mode])

  const onNodesChange = useCallback(
    (changes: NodeChange<EquipmentFlowNode>[]) => {
      setNodes((n) => applyNodeChanges(changes, n))
      for (const c of changes) {
        if (c.type === 'position' && c.position && c.dragging) moveEquipment(c.id, c.position)
      }
    },
    [moveEquipment],
  )

  const onConnect = useCallback(
    (c: Connection) => {
      if (!c.sourceHandle || !c.targetHandle) return
      const id = connect(
        { equipmentId: c.source, portId: c.sourceHandle },
        { equipmentId: c.target, portId: c.targetHandle },
      )
      if (id) select([], [id])
    },
    [connect, select],
  )

  const onSelectionChange = useCallback(
    ({ nodes: n, edges: e }: OnSelectionChangeParams) => select(n.map((x) => x.id), e.map((x) => x.id)),
    [select],
  )

  const onDrop = useCallback(
    (ev: DragEvent) => {
      ev.preventDefault()
      const tpl = LIBRARY_BY_ID.get(ev.dataTransfer.getData(DND_MIME))
      if (!tpl) return
      const pos = rf.screenToFlowPosition({ x: ev.clientX, y: ev.clientY })
      const id = addEquipment(tpl, { x: Math.round(pos.x / 10) * 10, y: Math.round(pos.y / 10) * 10 })
      select([id], [])
    },
    [rf, addEquipment, select],
  )

  // Centrage demandé depuis une liste (câblage, alertes)
  useEffect(() => {
    if (!focusRequest) return
    const ids =
      focusRequest.kind === 'equipment'
        ? [focusRequest.id]
        : (() => {
            const l = useProject.getState().project.links[focusRequest.id]
            return l ? [l.source.equipmentId, l.target.equipmentId] : []
          })()
    if (ids.length) rf.fitView({ nodes: ids.map((id) => ({ id })), duration: 350, maxZoom: 1.3, padding: 0.4 })
  }, [focusRequest, rf])

  return (
    <div className="canvas" onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' }} onDrop={onDrop}>
      <ReactFlow<EquipmentFlowNode, SignalFlowEdge>
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onNodeDragStart={beginGesture}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        onDelete={({ nodes: n, edges: e }) => remove(n.map((x) => x.id), e.map((x) => x.id))}
        connectionMode={ConnectionMode.Loose}
        deleteKeyCode={['Delete', 'Backspace']}
        multiSelectionKeyCode={['Shift', 'Meta', 'Control']}
        snapToGrid
        snapGrid={[10, 10]}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.1}
        maxZoom={3}
        proOptions={{ hideAttribution: false }}
        defaultEdgeOptions={{ type: 'signal' }}
        connectionLineStyle={{ stroke: 'var(--accent)', strokeWidth: 2 }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1.4} color="var(--grid-dot)" />
        <Controls showInteractive={false} position="bottom-left" />
        <MiniMap
          position="bottom-right"
          pannable
          zoomable
          nodeColor="var(--bg-4)"
          maskColor="rgba(0,0,0,0.35)"
          style={{ background: 'var(--bg-1)' }}
        />
      </ReactFlow>
    </div>
  )
}

/** Couleur CSS d'une famille de signal (utilisée par les listes et les filtres). */
export const signalColor = (s: keyof typeof SIGNAL_STYLE) => SIGNAL_STYLE[s].color
