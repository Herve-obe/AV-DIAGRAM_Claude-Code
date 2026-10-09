// Multipaire en vue « Câbles » : chaque paire part de son port (éclaté), les paires se rejoignent en
// un point devant le bloc, puis un seul câble épais relie les deux têtes du multipaire.
import type { ReactElement } from 'react'
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, Position, useInternalNode, type EdgeProps } from '@xyflow/react'
import { endOf } from './EdgeRouter'
import type { SignalFlowEdge } from './SignalEdge'
import type { Point, RouteEnd } from '../model/routing'

/** Distance entre le bloc et la tête du multipaire, en px du schéma */
const FAN = 36

const POSITION: Record<RouteEnd['side'], Position> = { left: Position.Left, right: Position.Right, top: Position.Top, bottom: Position.Bottom }

/** Tête du multipaire : devant les ports, au milieu de leur étendue, du côté où ils sortent. */
function headOf(ends: RouteEnd[]): RouteEnd & Point {
  const side = ends[0].side
  const xs = ends.map((e) => e.x)
  const ys = ends.map((e) => e.y)
  const mid = (v: number[]) => (Math.min(...v) + Math.max(...v)) / 2
  switch (side) {
    case 'right': return { x: Math.max(...xs) + FAN, y: mid(ys), side }
    case 'left': return { x: Math.min(...xs) - FAN, y: mid(ys), side }
    case 'top': return { x: mid(xs), y: Math.min(...ys) - FAN, side }
    default: return { x: mid(xs), y: Math.max(...ys) + FAN, side }
  }
}

/** Éclaté : court départ perpendiculaire au bloc, puis droit vers la tête. */
function fanPath(ends: RouteEnd[], head: Point): string {
  const out = 10
  return ends.map((e) => {
    const s = e.side === 'right' ? { x: e.x + out, y: e.y } : e.side === 'left' ? { x: e.x - out, y: e.y } : e.side === 'top' ? { x: e.x, y: e.y - out } : { x: e.x, y: e.y + out }
    return `M ${e.x} ${e.y} L ${s.x} ${s.y} L ${head.x} ${head.y}`
  }).join(' ')
}

export function BundleEdge(props: EdgeProps<SignalFlowEdge> & { fallback: ReactElement }) {
  const { source, target, data, selected, fallback } = props
  const a = useInternalNode(source)
  const b = useInternalNode(target)
  const ends = (data?.ends ?? []).flatMap((e) => {
    const s = endOf(a, e.sourceHandle)
    const t = endOf(b, e.targetHandle)
    return s && t ? [{ s, t }] : []
  })
  // Géométrie pas encore mesurée : tracé simple en attendant
  if (!data || !ends.length) return fallback
  const ha = headOf(ends.map((e) => e.s))
  const hb = headOf(ends.map((e) => e.t))
  const [trunk, labelX, labelY] = getSmoothStepPath({
    sourceX: ha.x, sourceY: ha.y, sourcePosition: POSITION[ha.side],
    targetX: hb.x, targetY: hb.y, targetPosition: POSITION[hb.side],
    borderRadius: 8, offset: 12,
  })
  const fans = `${fanPath(ends.map((e) => e.s), ha)} ${fanPath(ends.map((e) => e.t), hb)}`
  const stroke = selected ? 'var(--accent)' : 'var(--text-2)'
  return (
    <>
      {/* Éclatés : fins, une ligne par paire ; zone de clic élargie comme pour le câble */}
      <path d={fans} fill="none" stroke={stroke} strokeWidth={1.5} strokeOpacity={0.85} className="bundle-fan" />
      <path d={fans} fill="none" stroke="transparent" strokeWidth={12} className="react-flow__edge-interaction" />
      <BaseEdge
        id={props.id}
        path={trunk}
        interactionWidth={14}
        style={{ stroke, strokeWidth: 5 + (selected ? 1.5 : 0), filter: selected ? 'drop-shadow(0 0 3px var(--accent))' : undefined }}
      />
      {[ha, hb].map((h, i) => <circle key={i} cx={h.x} cy={h.y} r={4.5} fill={stroke} stroke="var(--bg-0)" strokeWidth={1.5} />)}
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
