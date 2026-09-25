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
import { getTemplate } from '../store/libraryStore'
import { groupInterface, groupNodeId, isGroupNodeId, isInside, placeOnView, sheetIdOfGroupNode } from '../model/groups'
import { DEFAULT_SHEET_ID, sheetName } from '../model/project'
import { SIGNAL_STYLE } from '../model/signals'
import type { Link, Project } from '../model/types'
import { useProject } from '../store/projectStore'
import { useIssues, worstByLink } from '../store/useIssues'
import { useUi } from '../store/uiStore'
import { AnnotationNode, type AnnotationFlowNode } from './AnnotationNode'
import { GroupNode, type GroupFlowNode } from './GroupNode'
import { EquipmentNode, type EquipmentFlowNode } from './EquipmentNode'
import { SignalEdge, type SignalFlowEdge } from './SignalEdge'

export const DND_MIME = 'application/x-avd-template'

const nodeTypes = { equipment: EquipmentNode, annotation: AnnotationNode, subsheet: GroupNode }
const edgeTypes = { signal: SignalEdge }

type CanvasNode = EquipmentFlowNode | AnnotationFlowNode | GroupFlowNode

type PortRef = { equipmentId: string; portId: string }

/** Où se dessine l'extrémité d'une liaison sur la feuille affichée : bloc de l'équipement ou bloc du groupe qui le contient. */
function endpointOnView(project: Project, ref: PortRef, viewId: string): { node: string; handle: string } | null {
  const eq = project.equipment[ref.equipmentId]
  if (!eq) return null
  const place = placeOnView(project, eq.sheetId ?? DEFAULT_SHEET_ID, viewId)
  if (!place) return null
  if (place.kind === 'self') return { node: eq.id, handle: ref.portId }
  return { node: groupNodeId(place.groupId), handle: `${eq.id}:${ref.portId}` }
}

export function Canvas() {
  const project = useProject((s) => s.project)
  const { moveEquipment, moveAnnotation, moveGroup, beginGesture, connect, remove, addEquipment } = useProject.getState()
  const { selectedEquipment, selectedLinks, hiddenSignals, mode, focusRequest, select, currentSheetId, presenting } = useUi()
  const issues = useIssues()
  const rf = useReactFlow()

  // Nœuds de la feuille courante, reconstruits depuis le projet en conservant les mesures de React Flow
  const [nodes, setNodes] = useState<CanvasNode[]>([])
  useEffect(() => {
    const onSheet = (sheetId?: string) => (sheetId ?? DEFAULT_SHEET_ID) === currentSheetId
    // Renvois : poignée affichée dont l'autre extrémité n'est pas visible sur cette feuille
    const offPage = new Map<string, Record<string, string>>()
    const mark = (end: { node: string; handle: string }, otherSheet: string | undefined) =>
      offPage.set(end.node, { ...offPage.get(end.node), [end.handle]: sheetName(project, otherSheet) })
    for (const l of Object.values(project.links)) {
      const a = endpointOnView(project, l.source, currentSheetId)
      const b = endpointOnView(project, l.target, currentSheetId)
      if (a && !b) mark(a, project.equipment[l.target.equipmentId]?.sheetId)
      if (b && !a) mark(b, project.equipment[l.source.equipmentId]?.sheetId)
    }
    const groupNodes: GroupFlowNode[] = (project.sheets ?? [])
      .filter((sh) => sh.parentId === currentSheetId)
      .map((sh) => ({
        id: groupNodeId(sh.id),
        type: 'subsheet',
        position: sh.groupPosition ?? { x: 0, y: 0 },
        data: {
          name: sh.name,
          count: Object.values(project.equipment).filter((e) => isInside(project, e.sheetId ?? DEFAULT_SHEET_ID, sh.id)).length,
          ports: groupInterface(project, sh.id),
          offPage: offPage.get(groupNodeId(sh.id)) ?? {},
        },
        selected: selectedEquipment.includes(groupNodeId(sh.id)),
      }))
    setNodes((prev) => {
      const measured = new Map(prev.map((n) => [n.id, n.measured]))
      const frames: AnnotationFlowNode[] = []
      const notes: AnnotationFlowNode[] = []
      for (const a of Object.values(project.annotations ?? {})) {
        if (!onSheet(a.sheetId)) continue
        const node: AnnotationFlowNode = {
          id: a.id,
          type: 'annotation',
          position: a.position,
          data: { annotation: a, readOnly: presenting },
          selected: selectedEquipment.includes(a.id),
          measured: measured.get(a.id),
          zIndex: a.kind === 'frame' ? -1 : 1,
          width: a.size.w,
          height: a.size.h,
        }
        ;(a.kind === 'frame' ? frames : notes).push(node)
      }
      const equipment: EquipmentFlowNode[] = Object.values(project.equipment)
        .filter((eq) => onSheet(eq.sheetId))
        .map((eq) => ({
          id: eq.id,
          type: 'equipment',
          position: eq.position,
          data: { equipment: eq, compact: mode === 'beginner', offPage: offPage.get(eq.id) ?? {} },
          selected: selectedEquipment.includes(eq.id),
          measured: measured.get(eq.id),
        }))
      const groupsWithSize = groupNodes.map((g) => ({ ...g, measured: measured.get(g.id) }))
      // Les cadres d'abord (dessous), puis les équipements et les groupes, puis les notes
      return [...frames, ...equipment, ...groupsWithSize, ...notes]
    })
  }, [project, selectedEquipment, mode, currentSheetId, presenting])

  const edges = useMemo<SignalFlowEdge[]>(() => {
    const worst = worstByLink(issues)
    // Liaison dans un multipaire : l'étiquette indique le câble et la paire (ex. FOH-AUD-001 · MP-01/3)
    const via = (l: Link) => {
      const mc = l.multicoreId ? project.multicores?.[l.multicoreId] : undefined
      const base = mc ? `${l.label} · ${mc.label}/${l.pair ?? '?'}` : l.label
      return l.channels ? `${base} · ${l.channels} ch` : base
    }
    return Object.values(project.links).flatMap((l) => {
      const a = endpointOnView(project, l.source, currentSheetId)
      const b = endpointOnView(project, l.target, currentSheetId)
      // Non visible ici, ou interne à un même groupe replié : pas de trait (renvoi sur les ports)
      if (!a || !b || (a.node === b.node && isGroupNodeId(a.node))) return []
      const port = project.equipment[l.source.equipmentId]?.ports.find((p) => p.id === l.source.portId)
      const signal = port?.signal ?? 'audioAnalog'
      return [{
        id: l.id,
        type: 'signal' as const,
        source: a.node,
        sourceHandle: a.handle,
        target: b.node,
        targetHandle: b.handle,
        selected: selectedLinks.includes(l.id),
        hidden: hiddenSignals.includes(signal),
        data: { signal, label: via(l), severity: worst.get(l.id), showLabel: mode === 'expert' || presenting },
      }]
    })
  }, [project, issues, selectedLinks, hiddenSignals, mode, currentSheetId, presenting])

  const onNodesChange = useCallback(
    (changes: NodeChange<CanvasNode>[]) => {
      setNodes((n) => applyNodeChanges(changes, n))
      const annotations = useProject.getState().project.annotations ?? {}
      for (const c of changes) {
        if (c.type !== 'position' || !c.position || !c.dragging) continue
        if (annotations[c.id]) moveAnnotation(c.id, { position: c.position })
        else if (isGroupNodeId(c.id)) moveGroup(sheetIdOfGroupNode(c.id), c.position)
        else moveEquipment(c.id, c.position)
      }
    },
    [moveEquipment, moveAnnotation, moveGroup],
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
      const tpl = getTemplate(ev.dataTransfer.getData(DND_MIME))
      if (!tpl || useUi.getState().presenting) return
      const pos = rf.screenToFlowPosition({ x: ev.clientX, y: ev.clientY })
      const id = addEquipment(tpl, { x: Math.round(pos.x / 10) * 10, y: Math.round(pos.y / 10) * 10 }, useUi.getState().currentSheetId)
      select([id], [])
    },
    [rf, addEquipment, select],
  )

  // Recadrage à l'ouverture d'un autre projet ou d'une autre feuille
  useEffect(() => {
    const timer = setTimeout(() => rf.fitView({ padding: 0.15, duration: 250 }), 80)
    return () => clearTimeout(timer)
  }, [project.id, currentSheetId, presenting, rf])

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
    if (!ids.length) return
    const sheet = useProject.getState().project.equipment[ids[0]]?.sheetId
    const ui = useUi.getState()
    const fit = () => rf.fitView({ nodes: ids.map((id) => ({ id })), duration: 350, maxZoom: 1.3, padding: 0.4 })
    if (sheet && sheet !== ui.currentSheetId) {
      ui.setSheet(sheet)
      ui.select(focusRequest.kind === 'equipment' ? [focusRequest.id] : [], focusRequest.kind === 'link' ? [focusRequest.id] : [])
      setTimeout(fit, 120)
    } else fit()
  }, [focusRequest, rf])

  return (
    <div className="canvas" onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' }} onDrop={onDrop}>
      <ReactFlow<CanvasNode, SignalFlowEdge>
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onNodeDragStart={beginGesture}
        onNodeDoubleClick={(_e, n) => isGroupNodeId(n.id) && useUi.getState().setSheet(sheetIdOfGroupNode(n.id))}
        nodesDraggable={!presenting}
        nodesConnectable={!presenting}
        elementsSelectable={!presenting}
        deleteKeyCode={presenting ? null : ['Delete', 'Backspace']}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        onDelete={({ nodes: n, edges: e }) => remove(n.map((x) => x.id), e.map((x) => x.id))}
        connectionMode={ConnectionMode.Loose}
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
