// Multipaire en vue « Câbles », dessiné comme le câble réel : côté départ, chaque paire quitte son port
// et rejoint un peigne (barre de regroupement) ; un seul câble épais relie les deux peignes ; côté
// arrivée, les paires se séparent juste avant les entrées de l'appareil. Les paires peuvent venir de
// plusieurs blocs (ex. sept micros vers une console).
import type { ReactElement } from 'react'
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, Position, useStore, type EdgeProps, type InternalNode, type Node } from '@xyflow/react'
import { endOf } from './EdgeRouter'
import type { SignalFlowEdge } from './SignalEdge'
import type { RouteEnd } from '../model/routing'
import { SIGNAL_STYLE } from '../model/signals'

/** Distance entre le port le plus avancé et le peigne, en px du schéma */
const FAN = 34

const POSITION: Record<RouteEnd['side'], Position> = { left: Position.Left, right: Position.Right, top: Position.Top, bottom: Position.Bottom }

interface Comb {
  side: RouteEnd['side']
  /** Position du peigne sur l'axe perpendiculaire au bord (x pour gauche/droite, y pour haut/bas) */
  at: number
  /** Étendue du peigne le long du bord */
  lo: number
  hi: number
  ends: RouteEnd[]
}

const horizontal = (side: RouteEnd['side']) => side === 'left' || side === 'right'

function combOf(ends: RouteEnd[]): Comb {
  // Côté le plus représenté (blocs pivotés : haut ou bas)
  const count = new Map<RouteEnd['side'], number>()
  for (const e of ends) count.set(e.side, (count.get(e.side) ?? 0) + 1)
  const side = [...count.entries()].sort((a, b) => b[1] - a[1])[0][0]
  const h = horizontal(side)
  const across = ends.map((e) => (h ? e.x : e.y))
  const along = ends.map((e) => (h ? e.y : e.x))
  const at = side === 'right' || side === 'bottom' ? Math.max(...across) + FAN : Math.min(...across) - FAN
  return { side, at, lo: Math.min(...along), hi: Math.max(...along), ends }
}

/**
 * Point du peigne d'où part le câble : si les deux peignes se font face, au milieu de leur partie
 * commune (câble droit) ; sinon au bout du peigne le plus proche de l'autre.
 */
function exitPoint(c: Comb, other: Comb): { x: number; y: number } {
  const lo = Math.max(c.lo, other.lo)
  const hi = Math.min(c.hi, other.hi)
  const clamp = (v: number) => Math.max(c.lo, Math.min(c.hi, v))
  const v = lo <= hi ? (lo + hi) / 2 : clamp((other.lo + other.hi) / 2)
  return horizontal(c.side) ? { x: c.at, y: v } : { x: v, y: c.at }
}

/** Dents du peigne (port → barre, perpendiculaires au bloc) et barre elle-même. */
function combPath(c: Comb): string {
  const h = horizontal(c.side)
  const teeth = c.ends.map((e) => (h ? `M ${e.x} ${e.y} H ${c.at}` : `M ${e.x} ${e.y} V ${c.at}`))
  const bar = c.hi > c.lo ? (h ? `M ${c.at} ${c.lo} V ${c.hi}` : `M ${c.lo} ${c.at} H ${c.hi}`) : ''
  return `${teeth.join(' ')} ${bar}`
}

type Ends = NonNullable<NonNullable<SignalFlowEdge['data']>['ends']>

export function BundleEdge(props: EdgeProps<SignalFlowEdge> & { fallback: ReactElement }) {
  const { data, selected, fallback } = props
  const ends: Ends = data?.ends ?? []
  // Géométrie des ports de toutes les paires (sérialisée : le trait se redessine quand un bloc bouge)
  const geometry = useStore((s) => {
    const of = (node: string, handle: string) => endOf(s.nodeLookup.get(node) as InternalNode<Node> | undefined, handle)
    return JSON.stringify(ends.flatMap((e) => {
      const a = of(e.sourceNode, e.sourceHandle)
      const b = of(e.targetNode, e.targetHandle)
      return a && b ? [[a, b]] : []
    }))
  })
  const pairs = JSON.parse(geometry) as [RouteEnd, RouteEnd][]
  // Géométrie pas encore mesurée : tracé simple en attendant
  if (!data || !pairs.length) return fallback
  const ca = combOf(pairs.map((p) => p[0]))
  const cb = combOf(pairs.map((p) => p[1]))
  const pa = exitPoint(ca, cb)
  const pb = exitPoint(cb, ca)
  const [trunk, labelX, labelY] = getSmoothStepPath({
    sourceX: pa.x, sourceY: pa.y, sourcePosition: POSITION[ca.side],
    targetX: pb.x, targetY: pb.y, targetPosition: POSITION[cb.side],
    borderRadius: 10, offset: 14,
  })
  const combs = `${combPath(ca)} ${combPath(cb)}`
  const trunkColor = selected ? 'var(--accent)' : 'var(--text-2)'
  const pairColor = selected ? 'var(--accent)' : SIGNAL_STYLE[data.signal].color
  return (
    <>
      <path d={combs} fill="none" stroke={pairColor} strokeWidth={1.5} strokeLinejoin="round" className="bundle-fan" />
      <path d={combs} fill="none" stroke="transparent" strokeWidth={12} className="react-flow__edge-interaction" />
      <BaseEdge
        id={props.id}
        path={trunk}
        interactionWidth={14}
        style={{ stroke: trunkColor, strokeWidth: 6 + (selected ? 1 : 0), strokeLinecap: 'round', filter: selected ? 'drop-shadow(0 0 3px var(--accent))' : undefined }}
      />
      {[pa, pb].map((h, i) => <circle key={i} cx={h.x} cy={h.y} r={4} fill={trunkColor} stroke="var(--bg-0)" strokeWidth={1.5} />)}
      <EdgeLabelRenderer>
        <div
          className={`edge-label is-bundle ${selected ? 'is-selected' : ''}`}
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
        >
          {data.label}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
