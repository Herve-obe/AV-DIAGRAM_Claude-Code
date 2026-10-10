// Canevas du synoptique (React Flow). Le store du projet est la source de vérité ;
// React Flow garde seulement les mesures des blocs et l'état de glissement.
import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { fullyLocked, lockedLayers } from '../collab/protection'
import { useCollab } from '../collab/session'
import { PageGrid } from './PageGrid'
import { CanvasMenu, type MenuAt } from './CanvasMenu'
import { EmptyCanvasHint } from '../ui/BeginnerGuide'
import { arrangeSelection } from '../ui/arrangeActions'
import { onCommand } from '../store/windowSync'
import type { ArrangeAction } from './arrange'
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  Controls,
  MiniMap,
  ReactFlow,
  SelectionMode,
  applyNodeChanges,
  useReactFlow,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from '@xyflow/react'
import { getTemplate } from '../store/libraryStore'
import { groupInterface, groupNodeId, isGroupNodeId, isInside, placeOnView, sheetIdOfGroupNode } from '../model/groups'
import { DEFAULT_SHEET_ID, sheetName } from '../model/project'
import { familiesCompatible, SIGNAL_FAMILIES, SIGNAL_STYLE } from '../model/signals'
import type { Equipment, Link, Project } from '../model/types'
import { checkLink, checkProject } from '../model/rules'
import { crossLayerHints, equipmentInView, layerOfSignal } from '../model/layers'
import { useAi } from '../store/aiStore'
import { useProject } from '../store/projectStore'
import { worstByLink } from '../store/useIssues'
import { useUi } from '../store/uiStore'
import { AnnotationNode, type AnnotationFlowNode } from './AnnotationNode'
import { GroupNode, type GroupFlowNode } from './GroupNode'
import { EquipmentNode, type EquipmentFlowNode } from './EquipmentNode'
import { EdgeRouter } from './EdgeRouter'
import { SignalEdge, type SignalFlowEdge } from './SignalEdge'

/** Bandeau d'aperçu : la proposition de l'assistant s'applique ou se refuse aussi depuis le canevas. */
function ProposalBanner({ equipment, links, sheetId }: { equipment: number; links: number; sheetId: string }) {
  const { t } = useTranslation()
  const currentSheetId = useUi((s) => s.currentSheetId)
  const ai = useAi.getState()
  return (
    <div className="proposal-banner" role="status">
      <span className="proposal-dot" />
      <span>{t('ai.preview', { equipment, links })}</span>
      {sheetId !== currentSheetId && <button className="btn btn-ghost" onClick={() => useUi.getState().setSheet(sheetId)}>{t('ai.showSheet')}</button>}
      <button className="btn btn-ghost" onClick={() => ai.discardProposal()}>{t('ai.discard')}</button>
      <button className="btn btn-primary" onClick={() => ai.applyProposal()}>{t('ai.apply')}</button>
    </div>
  )
}

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
  const stored = useProject((s) => s.project)
  // Proposition de l'assistant en attente : le canevas montre le brouillon, ajouts en pointillés
  const proposal = useAi((s) => s.proposal)
  const preview = proposal && proposal.base === stored ? proposal : null
  const project = preview?.project ?? stored
  const proposedEq = useMemo(() => new Set(preview?.addedEquipment ?? []), [preview])
  const proposedLinks = useMemo(() => new Set(preview?.addedLinks ?? []), [preview])
  const { moveEquipment, moveAnnotation, moveGroup, beginGesture, connect, remove, addEquipment } = useProject.getState()
  const { selectedEquipment, selectedLinks, hiddenSignals, mode, focusRequest, select, currentSheetId, presenting, linkView, autoRoute, layer } = useUi()
  const { t } = useTranslation()
  const issues = useMemo(() => checkProject(project), [project])
  // Rappels inter-calques en attente, par équipement (ports d'un autre domaine non reliés)
  // Session de collaboration : blocs sélectionnés par les autres participants
  const participants = useCollab((s) => s.participants)
  const claims = useCollab((s) => s.claims)
  const me = useCollab((s) => s.userId)
  const locked = useMemo(() => lockedLayers(claims, me), [claims, me])
  const presenceByEq = useMemo(() => {
    const m = new Map<string, { name: string; color: string }[]>()
    for (const p of participants) {
      if (p.self) continue
      for (const id of p.selection) m.set(id, [...(m.get(id) ?? []), { name: p.name, color: p.color }])
    }
    return m
  }, [participants])
  /** Nom de la personne qui a réservé tous les calques de l'équipement (sinon undefined) */
  const lockOf = useCallback((eq: Equipment) => {
    const l = fullyLocked(eq, locked)
    return l ? `${t(`library.domain.${l}`)} : ${claims[l]?.name ?? '?'}` : undefined
  }, [locked, claims, t])
  const hintsByEq = useMemo(() => {
    const m = new Map<string, string[]>()
    for (const h of crossLayerHints(project)) {
      if (h.dismissed) continue
      m.set(h.equipmentId, [...(m.get(h.equipmentId) ?? []), t('layers.hintBadge', { count: h.ports.length, layer: t(`library.domain.${h.layer}`) })])
    }
    return m
  }, [project, t])
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
          measured: measured.get(a.id),
          zIndex: a.kind === 'frame' ? -1 : 1,
          // Cadre : saisi par son onglet de titre ou ses bords (l'intérieur laisse passer la souris)
          ...(a.kind === 'frame' ? { dragHandle: '.annotation-grip', className: 'is-frame' } : {}),
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
          data: {
            equipment: eq,
            compact: mode === 'beginner',
            offPage: offPage.get(eq.id) ?? {},
            layer,
            hints: hintsByEq.get(eq.id)?.length ?? 0,
            hintTitle: hintsByEq.get(eq.id)?.join('\n'),
            presence: presenceByEq.get(eq.id),
            lockedBy: lockOf(eq),
          },
          // Calque actif : seuls les équipements de ce domaine (ou qui en ont des ports) restent visibles
          hidden: !equipmentInView(eq, layer),
          measured: measured.get(eq.id),
          // Un équipement proposé n'existe pas encore dans le projet : ni déplaçable, ni supprimable
          // Équipement d'un calque réservé par quelqu'un d'autre : ni déplaçable, ni supprimable
          ...(lockOf(eq) ? { draggable: false, deletable: false, connectable: false } : {}),
          ...(proposedEq.has(eq.id)
            ? { className: 'is-proposed', draggable: false, selectable: false, deletable: false, connectable: false }
            : {}),
        }))
      const groupsWithSize = groupNodes.map((g) => ({ ...g, measured: measured.get(g.id) }))
      // Les cadres d'abord (dessous), puis les équipements et les groupes, puis les notes
      return [...frames, ...equipment, ...groupsWithSize, ...notes]
    })
  }, [project, mode, currentSheetId, presenting, proposedEq, layer, hintsByEq, presenceByEq, lockOf])

  // Sélection appliquée au rendu, comme pour les liaisons, plutôt que par l'effet ci-dessus (un rendu
  // plus tard) : blocs et liaisons montrent toujours la même sélection que le store.
  const shownNodes = useMemo(() => {
    const sel = new Set(selectedEquipment)
    return nodes.map((n) => (!!n.selected === sel.has(n.id) ? n : { ...n, selected: sel.has(n.id) }))
  }, [nodes, selectedEquipment])

  const edgeLinkIds = useRef(new Map<string, string[]>())
  const edges = useMemo<SignalFlowEdge[]>(() => {
    const worst = worstByLink(issues)
    // Calque actif : liaisons de ce domaine (synchro et contrôle : si leurs deux équipements sont visibles)
    const linkInView = (l: Link, signal: keyof typeof SIGNAL_STYLE) => {
      if (layer === 'all') return true
      const sl = layerOfSignal(signal)
      if (sl && sl !== layer) return false
      const a = project.equipment[l.source.equipmentId]
      const b = project.equipment[l.target.equipmentId]
      return (!a || equipmentInView(a, layer)) && (!b || equipmentInView(b, layer))
    }
    // Liaison dans un multipaire : l'étiquette indique le câble et la paire (ex. FOH-AUD-001 · MP-01/3)
    const via = (l: Link) => {
      const mc = l.multicoreId ? project.multicores?.[l.multicoreId] : undefined
      const base = mc ? `${l.label} · ${mc.label}/${l.pair ?? '?'}` : l.label
      return l.channels ? `${base} · ${l.channels} ch` : base
    }
    // Vue « Câbles » : les liaisons d'un même multipaire entre deux blocs forment un seul trait
    const bundles = new Map<string, SignalFlowEdge>()
    const bundleSides = new Map<string, { a: Set<string>; b: Set<string> }>()
    const flows = Object.values(project.links).flatMap((l) => {
      const a = endpointOnView(project, l.source, currentSheetId)
      const b = endpointOnView(project, l.target, currentSheetId)
      // Non visible ici, ou interne à un même groupe replié : pas de trait (renvoi sur les ports)
      if (!a || !b || (a.node === b.node && isGroupNodeId(a.node))) return []
      const port = project.equipment[l.source.equipmentId]?.ports.find((p) => p.id === l.source.portId)
      const signal = port?.signal ?? 'audioAnalog'
      const mc = linkView === 'cables' && l.multicoreId ? project.multicores?.[l.multicoreId] : undefined
      if (mc) {
        // Un trait par multipaire et par feuille : toutes ses paires, quels que soient les blocs reliés
        const key = `mc:${mc.id}`
        const prev = bundles.get(key)
        if (prev) {
          prev.data!.linkIds!.push(l.id)
          // Paire tirée dans l'autre sens (retour) : on la remet dans le sens du trait
          const sides = bundleSides.get(key)!
          const flip = sides.b.has(a.node) || sides.a.has(b.node)
          const [na, nb] = flip ? [b, a] : [a, b]
          sides.a.add(na.node)
          sides.b.add(nb.node)
          prev.data!.ends!.push({ sourceNode: na.node, sourceHandle: na.handle, targetNode: nb.node, targetHandle: nb.handle })
        } else {
          bundleSides.set(key, { a: new Set([a.node]), b: new Set([b.node]) })
          bundles.set(key, {
            id: key, type: 'signal', source: a.node, sourceHandle: a.handle, target: b.node, targetHandle: b.handle,
            deletable: false,
            hidden: !linkInView(l, signal),
            data: { signal, label: mc.label, showLabel: true, linkIds: [l.id], ends: [{ sourceNode: a.node, sourceHandle: a.handle, targetNode: b.node, targetHandle: b.handle }] },
          })
        }
        return []
      }
      return [{
        id: l.id,
        type: 'signal' as const,
        source: a.node,
        sourceHandle: a.handle,
        target: b.node,
        targetHandle: b.handle,
        selected: selectedLinks.includes(l.id),
        hidden: hiddenSignals.includes(signal) || !linkInView(l, signal),
        data: { signal, label: via(l), severity: worst.get(l.id), showLabel: mode === 'expert' || presenting || proposedLinks.has(l.id), bendX: l.bendX },
        ...(proposedLinks.has(l.id) ? { className: 'is-proposed', selectable: false, deletable: false } : {}),
      }]
    })
    for (const e of bundles.values()) {
      const ids = e.data!.linkIds!
      const mc = project.multicores?.[ids.length ? project.links[ids[0]].multicoreId ?? '' : '']
      e.data!.label = `${e.data!.label} · ${ids.length}/${mc?.pairs ?? '?'}`
      e.selected = ids.some((id) => selectedLinks.includes(id))
    }
    edgeLinkIds.current = new Map([...bundles.values()].map((e) => [e.id, e.data!.linkIds!]))
    return [...flows, ...bundles.values()]
  }, [project, issues, selectedLinks, hiddenSignals, mode, currentSheetId, presenting, linkView, proposedLinks, layer])

  // La sélection ne revient au store que par les changements « select » que React Flow émet sur un geste
  // (clic, cadre de sélection, Échap, clic dans le vide). onSelectionChange n'est pas utilisé : il
  // rapporte la sélection avec un rendu de retard et, dès que le store la modifie lui-même (ajout d'un
  // bloc, nouvelle liaison), la renvoyait périmée ; la sélection oscillait alors sans fin
  // (« Maximum update depth exceeded », écran noir après une connexion).
  const applySelection = useCallback((changes: (NodeChange<CanvasNode> | EdgeChange<SignalFlowEdge>)[], kind: 'equipment' | 'links') => {
    const picks = changes.filter((c) => c.type === 'select')
    if (!picks.length) return
    const ui = useUi.getState()
    const next = new Set(kind === 'equipment' ? ui.selectedEquipment : ui.selectedLinks)
    for (const c of picks) {
      // Trait groupé (multipaire en vue Câbles) : il représente plusieurs liaisons
      const ids = kind === 'links' ? edgeLinkIds.current.get(c.id) ?? [c.id] : [c.id]
      for (const id of ids) {
        if (c.selected) next.add(id)
        else next.delete(id)
      }
    }
    if (kind === 'equipment') ui.select([...next], ui.selectedLinks)
    else ui.select(ui.selectedEquipment, [...next])
  }, [])

  const onNodesChange = useCallback(
    (changes: NodeChange<CanvasNode>[]) => {
      setNodes((n) => applyNodeChanges(changes, n))
      applySelection(changes, 'equipment')
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

  // Pendant qu'on tire une liaison, les ports compatibles s'allument (sens opposé, signal compatible)
  const [connecting, setConnecting] = useState<string | null>(null)
  const onConnectStart = useCallback((_: unknown, p: { nodeId: string | null; handleId: string | null }) => {
    const port = p.nodeId && p.handleId ? useProject.getState().project.equipment[p.nodeId]?.ports.find((x) => x.id === p.handleId) : undefined
    if (!port) return
    const dirs = port.direction === 'in' ? ['out', 'bidir'] : port.direction === 'out' ? ['in', 'bidir'] : ['in', 'out', 'bidir']
    const fams = SIGNAL_FAMILIES.filter((f) => familiesCompatible(port.signal, f))
    const sel = fams.flatMap((f) => dirs.map((d) => `.port[data-sig="${f}"][data-dir="${d}"] .handle`)).join(',')
    setConnecting(`${sel} { box-shadow: 0 0 0 3px color-mix(in srgb, var(--port-color) 45%, transparent); transform: scale(1.35); }
      .port[data-sig] .handle { opacity: 0.35; } ${fams.flatMap((f) => dirs.map((d) => `.port[data-sig="${f}"][data-dir="${d}"] .handle`)).join(',')} { opacity: 1; }`)
  }, [])
  const onConnectEnd = useCallback(() => setConnecting(null), [])

  const onConnect = useCallback(
    (c: Connection) => {
      if (!c.sourceHandle || !c.targetHandle) return
      const id = connect(
        { equipmentId: c.source, portId: c.sourceHandle },
        { equipmentId: c.target, portId: c.targetHandle },
      )
      if (!id) return
      select([], [id])
      // Liaison douteuse (deux sorties, signal ou niveau incompatible…) : on demande confirmation
      const p = useProject.getState().project
      if (checkLink(p, p.links[id]).some((i) => i.severity !== 'info')) useUi.getState().setLinkCheck(id)
    },
    [connect, select],
  )

  const onEdgesChange = useCallback((changes: EdgeChange<SignalFlowEdge>[]) => applySelection(changes, 'links'), [])

  // Menu clic droit : un clic droit hors de la sélection sélectionne d'abord l'élément visé
  const [menu, setMenu] = useState<MenuAt | null>(null)
  const closeMenu = useCallback(() => setMenu(null), [])
  const openMenu = useCallback((e: { preventDefault: () => void; clientX: number; clientY: number }, target?: { kind: 'node' | 'edge'; id: string; linkIds?: string[] }) => {
    e.preventDefault()
    if (useUi.getState().presenting) return
    const ui = useUi.getState()
    if (target?.kind === 'node' && !ui.selectedEquipment.includes(target.id)) ui.select([target.id], [])
    if (target?.kind === 'edge') {
      const ids = target.linkIds ?? [target.id]
      if (!ids.every((id) => ui.selectedLinks.includes(id))) ui.select([], ids)
    }
    setMenu({ x: e.clientX, y: e.clientY })
  }, [])
  const selectAll = useCallback(() => {
    const nodeIds = rf.getNodes().filter((n) => !n.hidden).map((n) => n.id)
    const linkIds = rf.getEdges().filter((x) => !x.hidden)
      .flatMap((x) => (x.data as SignalFlowEdge['data'])?.linkIds ?? [x.id])
      .filter((id) => useProject.getState().project.links[id])
    select(nodeIds, [...new Set(linkIds)])
  }, [rf, select])

  // Cadre de sélection : les blocs entièrement dedans et les liaisons que le cadre touche, même
  // partiellement, sans prendre les blocs qu'elles relient. Avec Maj ou Ctrl, chaque élément du cadre
  // bascule : ajouté s'il n'était pas sélectionné, retiré s'il l'était (comme Maj+clic, en lot).
  const boxStart = useRef<{ x: number; y: number; toggle: boolean; nodes: string[]; links: string[] } | null>(null)
  // Sélection relevée à l'appui du bouton : React Flow la vide au début du cadre
  // Sélection et point de départ relevés à l'appui du bouton : React Flow vide la sélection au début du
  // cadre et ne le signale qu'au premier déplacement, quelques pixels plus loin
  const beforeBox = useRef({ x: 0, y: 0, nodes: [] as string[], links: [] as string[] })
  const onPointerDownCapture = useCallback((e: React.PointerEvent) => {
    const ui = useUi.getState()
    beforeBox.current = { x: e.clientX, y: e.clientY, nodes: ui.selectedEquipment, links: ui.selectedLinks }
  }, [])
  const onSelectionStart = useCallback((e: React.MouseEvent) => {
    boxStart.current = { toggle: e.shiftKey || e.ctrlKey || e.metaKey, ...beforeBox.current }
  }, [])
  const onSelectionEnd = useCallback((e: React.MouseEvent) => {
    const start = boxStart.current
    boxStart.current = null
    if (!start) return
    const box = { x1: Math.min(start.x, e.clientX), x2: Math.max(start.x, e.clientX), y1: Math.min(start.y, e.clientY), y2: Math.max(start.y, e.clientY) }
    if (box.x2 - box.x1 < 3 && box.y2 - box.y1 < 3) return
    const inNodes = new Set<string>()
    for (const el of document.querySelectorAll<HTMLElement>('.react-flow__node')) {
      const id = el.dataset.id
      if (!id || el.style.visibility === 'hidden' || el.classList.contains('is-proposed')) continue
      const r = el.getBoundingClientRect()
      if (r.width && r.left >= box.x1 && r.right <= box.x2 && r.top >= box.y1 && r.bottom <= box.y2) inNodes.add(id)
    }
    const inLinks = new Set<string>()
    for (const g of document.querySelectorAll<SVGGElement>('.react-flow__edge')) {
      const id = g.dataset.id ?? g.getAttribute('data-testid')?.replace(/^rf__edge-/, '')
      if (!id || !touches(g, box)) continue
      for (const l of edgeLinkIds.current.get(id) ?? [id]) inLinks.add(l)
    }
    const toggled = (base: string[], hit: Set<string>) => {
      const out = new Set(base)
      for (const id of hit) {
        if (out.has(id)) out.delete(id)
        else out.add(id)
      }
      return [...out]
    }
    const nodes = start.toggle ? toggled(start.nodes, inNodes) : [...inNodes]
    const links = (start.toggle ? toggled(start.links, inLinks) : [...inLinks]).filter((id) => useProject.getState().project.links[id])
    // Après les derniers changements « select » de React Flow pour ce cadre
    setTimeout(() => useUi.getState().select(nodes, links), 0)
  }, [])

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

  // Pincement sur pavé tactile, macOS (WebKit) : événements de geste propres à WebKit, sans molette.
  // Le zoom suit l'écart des doigts et reste centré sur le point situé sous le curseur.
  useEffect(() => {
    const el = document.querySelector<HTMLElement>('.canvas')
    if (!el) return
    let start = { zoom: 1, x: 0, y: 0, vx: 0, vy: 0 }
    type Gesture = Event & { scale: number; clientX: number; clientY: number }
    const onStart = (e: Event) => {
      e.preventDefault()
      const g = e as Gesture
      const v = rf.getViewport()
      const box = el.getBoundingClientRect()
      start = { zoom: v.zoom, x: g.clientX - box.left, y: g.clientY - box.top, vx: v.x, vy: v.y }
    }
    const onChange = (e: Event) => {
      e.preventDefault()
      const zoom = Math.min(3, Math.max(0.1, start.zoom * (e as Gesture).scale))
      const k = zoom / start.zoom
      void rf.setViewport({ zoom, x: start.x - (start.x - start.vx) * k, y: start.y - (start.y - start.vy) * k })
    }
    el.addEventListener('gesturestart', onStart)
    el.addEventListener('gesturechange', onChange)
    el.addEventListener('gestureend', (e) => e.preventDefault())
    return () => {
      el.removeEventListener('gesturestart', onStart)
      el.removeEventListener('gesturechange', onChange)
    }
  }, [rf])

  // Alignement demandé depuis la fenêtre Infos (double écran)
  useEffect(() => onCommand('arrange', (a) => arrangeSelection(rf, a as ArrangeAction)), [rf])

  // Recadrage à l'ouverture d'un autre projet ou d'une autre feuille
  useEffect(() => {
    const timer = setTimeout(() => rf.fitView({ padding: 0.15, duration: 250, maxZoom: 1 }), 80)
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

  // Nouvelle proposition : on recadre pour que les ajouts soient visibles
  const proposedCount = preview?.addedEquipment.length ?? 0
  useEffect(() => {
    if (!proposedCount) return
    const id = setTimeout(() => rf.fitView({ duration: 300, padding: 0.15, maxZoom: 1 }), 60)
    return () => clearTimeout(id)
  }, [proposedCount, rf])

  return (
    <div className="canvas" onPointerDownCapture={onPointerDownCapture} onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' }} onDrop={onDrop}>
      <ReactFlow<CanvasNode, SignalFlowEdge>
        nodes={shownNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onNodeDragStart={beginGesture}
        onNodeDragStop={() => useProject.getState().settleZones()}
        onNodeDoubleClick={(_e, n) => isGroupNodeId(n.id) && useUi.getState().setSheet(sheetIdOfGroupNode(n.id))}
        nodesDraggable={!presenting}
        nodesConnectable={!presenting}
        elementsSelectable={!presenting}
        deleteKeyCode={presenting ? null : ['Delete', 'Backspace']}
        onConnect={onConnect}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        onEdgesChange={onEdgesChange}
        onNodeContextMenu={(e, n) => openMenu(e, { kind: 'node', id: n.id })}
        onEdgeContextMenu={(e, x) => openMenu(e, { kind: 'edge', id: x.id, linkIds: x.data?.linkIds })}
        onSelectionContextMenu={(e) => openMenu(e)}
        onPaneContextMenu={(e) => openMenu(e)}
        // Glisser dans le vide : cadre de sélection (blocs entiers, liaisons touchées) ; vue déplacée à la
        // molette, au clic milieu ou Espace + glisser
        selectionOnDrag
        selectionMode={SelectionMode.Full}
        onSelectionStart={onSelectionStart}
        onSelectionEnd={onSelectionEnd}
        panOnDrag={[1]}
        onDelete={({ nodes: n, edges: e }) => {
          const nodeIds = n.map((x) => x.id)
          const linkIds = e.flatMap((x) => x.data?.linkIds ?? [x.id])
          remove(nodeIds, linkIds)
          // Ce qui vient d'être supprimé ne reste pas sélectionné (le clic suivant compterait un élément fantôme)
          const ui = useUi.getState()
          ui.select(ui.selectedEquipment.filter((id) => !nodeIds.includes(id)), ui.selectedLinks.filter((id) => !linkIds.includes(id)))
        }}
        connectionMode={ConnectionMode.Loose}
        multiSelectionKeyCode={['Shift', 'Meta', 'Control']}
        snapToGrid
        snapGrid={[10, 10]}
        fitView
        fitViewOptions={{ padding: 0.15, maxZoom: 1 }}
        // Molette : défilement vertical ; Maj + molette : horizontal ; Ctrl (Cmd) + molette : zoom
        panOnScroll
        zoomOnScroll={false}
        // Pincement sur pavé tactile : Windows (WebView2) le transmet comme Ctrl + molette
        zoomOnPinch
        minZoom={0.1}
        maxZoom={3}
        proOptions={{ hideAttribution: false }}
        defaultEdgeOptions={{ type: 'signal' }}
        connectionLineStyle={{ stroke: 'var(--accent)', strokeWidth: 2 }}
      >
        <EdgeRouter enabled={autoRoute} />
        <Background variant={BackgroundVariant.Dots} gap={20} size={1.4} color="var(--grid-dot)" />
        <PageGrid />
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
      {layer !== 'all' && !nodes.some((n) => n.type === 'equipment' && !n.hidden) && (
        <div className="layer-empty">
          {t('layers.empty', { layer: t(`library.domain.${layer}`) })}
          <button className="link-btn" onClick={() => useUi.getState().setPref('layer', 'all')}>{t('layers.showAll')}</button>
        </div>
      )}
      {connecting && <style>{connecting}</style>}
      <EmptyCanvasHint />
      {menu && <CanvasMenu at={menu} onClose={closeMenu} onSelectAll={selectAll} />}
      {preview && !presenting && (
        <ProposalBanner equipment={preview.addedEquipment.length} links={preview.addedLinks.length} sheetId={preview.sheetId} />
      )}
    </div>
  )
}

/** Le tracé d'une liaison (ou d'un multipaire) passe-t-il dans le rectangle, en coordonnées écran ? */
function touches(g: SVGGElement, box: { x1: number; x2: number; y1: number; y2: number }): boolean {
  for (const path of g.querySelectorAll<SVGPathElement>('path.react-flow__edge-path, path.bundle-fan')) {
    const m = path.getScreenCTM()
    if (!m) continue
    const len = path.getTotalLength()
    // Un point tous les 4 px environ à l'écran
    const steps = Math.max(8, Math.ceil((len * Math.abs(m.a)) / 4))
    for (let i = 0; i <= steps; i++) {
      const p = path.getPointAtLength((len * i) / steps)
      const x = p.x * m.a + p.y * m.c + m.e
      const y = p.x * m.b + p.y * m.d + m.f
      if (x >= box.x1 && x <= box.x2 && y >= box.y1 && y <= box.y2) return true
    }
  }
  return false
}

/** Couleur CSS d'une famille de signal (utilisée par les listes et les filtres). */
export const signalColor = (s: keyof typeof SIGNAL_STYLE) => SIGNAL_STYLE[s].color
