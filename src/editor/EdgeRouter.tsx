// Calcule le tracé des liaisons visibles (src/model/routing.ts) à partir de la géométrie réelle des
// blocs et des ports, et le met à disposition des traits (SignalEdge). Recalcul à chaque changement
// de position ou de taille, au plus une fois par image.
import { useEffect, useRef } from 'react'
import { useStore, type Edge, type InternalNode, type Node } from '@xyflow/react'
import { create } from 'zustand'
import { placeLabels, routeAll, type Point, type Rect, type RouteEnd, type RouteRequest } from '../model/routing'

export const useRoutes = create<{ routes: Map<string, Point[]>; labels: Map<string, Point> }>(() => ({ routes: new Map(), labels: new Map() }))

/** Taille approximative d'une étiquette de câble (police à chasse fixe de 10 px, voir .edge-label). */
const labelSize = (text: string) => ({ w: text.length * 6 + 12, h: 16 })

/** Types de nœuds qui font obstacle (les notes et cadres ne gênent pas les câbles). */
const OBSTACLE_TYPES = new Set(['equipment', 'subsheet'])

function endOf(node: InternalNode<Node> | undefined, handleId: string | null | undefined): RouteEnd | null {
  const hb = node?.internals.handleBounds
  if (!node || !hb) return null
  const h = [...(hb.source ?? []), ...(hb.target ?? [])].find((x) => x.id === handleId)
  if (!h) return null
  const abs = node.internals.positionAbsolute
  const side = h.position === 'right' ? 'right' : 'left'
  return { x: abs.x + h.x + (side === 'right' ? h.width : 0), y: abs.y + h.y + h.height / 2, side }
}

/**
 * Tracés des liaisons. Pendant un glisser (moved non vide), seules les liaisons des blocs déplacés
 * sont recalculées ; les autres gardent leur tracé jusqu'au lâcher.
 */
export function computeRoutes(
  nodeLookup: Map<string, InternalNode<Node>>,
  edges: Edge[],
  moved?: Set<string>,
  previous?: Map<string, Point[]>,
): { routes: Map<string, Point[]>; obstacles: Rect[] } {
  const obstacles: Rect[] = []
  for (const n of nodeLookup.values()) {
    if (!OBSTACLE_TYPES.has(n.type ?? '') || n.hidden) continue
    const w = n.measured?.width
    const h = n.measured?.height
    if (!w || !h) continue
    obstacles.push({ x: n.internals.positionAbsolute.x, y: n.internals.positionAbsolute.y, w, h })
  }
  const requests: RouteRequest[] = []
  for (const e of edges) {
    if (e.hidden) continue
    if (moved?.size && !moved.has(e.source) && !moved.has(e.target)) continue
    const source = endOf(nodeLookup.get(e.source), e.sourceHandle)
    const target = endOf(nodeLookup.get(e.target), e.targetHandle)
    if (source && target) requests.push({ id: e.id, source, target })
  }
  const routes = routeAll(obstacles, requests)
  if (!moved?.size || !previous) return { routes, obstacles }
  const merged = new Map(previous)
  for (const [id, pts] of routes) merged.set(id, pts)
  return { routes: merged, obstacles }
}

function withLabels(result: { routes: Map<string, Point[]>; obstacles: Rect[] }, edges: Edge[]) {
  const sizes = new Map<string, { w: number; h: number }>()
  for (const e of edges) {
    const label = (e.data as { label?: string } | undefined)?.label
    if (label && result.routes.has(e.id)) sizes.set(e.id, labelSize(label))
  }
  return { routes: result.routes, labels: placeLabels(result.routes, sizes, result.obstacles) }
}

/** Empreinte de la géométrie : positions et tailles des blocs, extrémités et visibilité des liaisons. */
function geometryKey(nodes: Node[], edges: Edge[]): string {
  const n = nodes.map((x) => `${x.id}:${Math.round(x.position.x)},${Math.round(x.position.y)},${x.measured?.width},${x.measured?.height},${x.hidden ? 1 : 0}${x.dragging ? "d" : ""}`)
  const e = edges.map((x) => `${x.id}:${x.source}.${x.sourceHandle}>${x.target}.${x.targetHandle}${x.hidden ? 'h' : ''}:${(x.data as { label?: string } | undefined)?.label ?? ''}`)
  return `${n.join(';')}|${e.join(';')}`
}

export function EdgeRouter({ enabled }: { enabled: boolean }) {
  // nodes et edges changent d'identité à chaque déplacement ou mesure : c'est le signal de recalcul
  const nodes = useStore((s) => s.nodes)
  const edges = useStore((s) => s.edges)
  const nodeLookup = useStore((s) => s.nodeLookup)
  const frame = useRef(0)
  const lastKey = useRef('')
  useEffect(() => {
    if (!enabled) {
      lastKey.current = ''
      useRoutes.setState({ routes: new Map(), labels: new Map() })
      return
    }
    // Sélection, survol : rien ne bouge, pas de recalcul
    const key = geometryKey(nodes, edges)
    if (key === lastKey.current) return
    lastKey.current = key
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => {
      const moved = new Set(nodes.filter((n) => n.dragging).map((n) => n.id))
      useRoutes.setState(withLabels(computeRoutes(nodeLookup as Map<string, InternalNode<Node>>, edges, moved, useRoutes.getState().routes), edges))
    })
    return () => cancelAnimationFrame(frame.current)
  }, [nodes, edges, nodeLookup, enabled])
  return null
}
