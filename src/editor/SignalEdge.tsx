// Liaison typée : couleur et style de trait selon le signal, étiquette = numéro de câble.
import { memo } from 'react'
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, Position, useReactFlow, type Edge, type EdgeProps } from '@xyflow/react'
import { useTranslation } from 'react-i18next'
import { useProject } from '../store/projectStore'
import { useUi } from '../store/uiStore'
import { labelPoint, toSvgPath, type Point } from '../model/routing'
import type { Severity } from '../model/rules'
import { BundleEdge } from './BundleEdge'
import { useRoutes } from './EdgeRouter'
import { SIGNAL_STYLE, type SignalFamily } from '../model/signals'
import { useEditing } from '../collab/useEditing'

export type SignalEdgeData = {
  signal: SignalFamily
  label: string
  severity?: Severity
  showLabel: boolean
  /** Trait de câble regroupant plusieurs liaisons (vue « Câbles ») */
  linkIds?: string[]
  /** Segment vertical déplacé à la main (px du schéma) */
  bendX?: number
  bendY?: number
  /** Multipaire : bloc et poignée de chaque paire, côté départ (a) et côté arrivée (b) du câble */
  ends?: { sourceNode: string; sourceHandle: string; targetNode: string; targetHandle: string }[]
}
export type SignalFlowEdge = Edge<SignalEdgeData, 'signal'>

function SignalEdgeView(props: EdgeProps<SignalFlowEdge>) {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, selected } = props
  // Tracé calculé par le routeur (contourne les blocs, voies écartées) ; sinon tracé simple
  const route = useRoutes((s) => s.routes.get(id))
  const labelAt = useRoutes((s) => s.labels.get(id))
  let [path, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, borderRadius: 8, offset: 18,
    ...(data?.bendX !== undefined ? { centerX: data.bendX } : {}),
    ...(data?.bendY !== undefined ? { centerY: data.bendY } : {}),
  })
  const project = useProject(s => s.project), edit = useEditing(), link = project.links[id]
  const a = link && project.equipment[link.source.equipmentId], b = link && project.equipment[link.target.equipmentId]
  const ap = a?.ports.find(p => p.id === link?.source.portId), bp = b?.ports.find(p => p.id === link?.target.portId)
  const allowed = !!(a && b && ap && bp && edit.link(ap, bp))
  const sideways = (p: Position) => p === Position.Left || p === Position.Right
  const horizontal = sideways(sourcePosition), axis = horizontal ? 'x' : 'y'
  const facing = (sourcePosition === Position.Right && targetPosition === Position.Left) || (sourcePosition === Position.Left && targetPosition === Position.Right) || (sourcePosition === Position.Top && targetPosition === Position.Bottom) || (sourcePosition === Position.Bottom && targetPosition === Position.Top)
  const bendable = selected && facing && allowed
  const grip = bendable ? gripOf(route, data?.bendX ?? (sourceX + targetX) / 2, data?.bendY ?? (sourceY + targetY) / 2, axis, horizontal ? data?.bendX : data?.bendY) : null
  if (route && route.length >= 2) {
    path = toSvgPath(route)
    ;({ x: labelX, y: labelY } = labelAt ?? labelPoint(route))
  }
  if (!data) return null
  const st = SIGNAL_STYLE[data.signal]
  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        interactionWidth={14}
        style={{
          stroke: data.linkIds ? 'var(--text-2)' : st.color,
          strokeWidth: (data.linkIds ? 5 : st.width) + (selected ? 1.5 : 0),
          strokeDasharray: data.linkIds ? undefined : st.dash || undefined,
          filter: selected ? 'drop-shadow(0 0 3px var(--accent))' : undefined,
        }}
      />
      {grip && <BendGrip id={id} at={grip} axis={axis} manual={horizontal ? data.bendX !== undefined : data.bendY !== undefined} />}
      {(data.showLabel || selected || data.severity) && (
        <EdgeLabelRenderer>
          <div
            className={`edge-label ${data.linkIds ? 'is-bundle' : ''} ${data.severity ? `sev-${data.severity}` : ''} ${selected ? 'is-selected' : ''}`}
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

/** Milieu du plus long segment vertical du tracé (sinon le point par défaut du tracé simple). */
function gripOf(route: Point[] | undefined, x: number, y: number, axis: 'x' | 'y', preferred?: number): Point | null {
  if (!route || route.length < 2) return { x, y }
  let best: Point | null = null
  let len = 0
  for (let i = 0; i < route.length - 1; i++) {
    const a = route[i]
    const b = route[i + 1]
    if (axis === 'x' ? a.x !== b.x : a.y !== b.y) continue
    const l = Math.abs(b.y - a.y) + Math.abs(b.x - a.x) + (preferred !== undefined && Math.abs(a[axis] - preferred) < .5 ? 1e9 : 0)
    if (l > len) { len = l; best = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } }
  }
  return best
}

/**
 * Poignée de la liaison sélectionnée : glisser déplace son segment vertical (un pas d'annulation),
 * double-clic rend le tracé automatique.
 */
function BendGrip({ id, at, manual, axis }: { id: string; at: Point; manual: boolean; axis: 'x' | 'y' }) {
  const { t } = useTranslation()
  const rf = useReactFlow()
  if (useUi.getState().presenting) return null
  const onPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation()
    e.preventDefault()
    const el = e.currentTarget as HTMLElement
    el.setPointerCapture(e.pointerId)
    useProject.getState().beginGesture()
    const move = (ev: PointerEvent) => {
      const value = Math.round(rf.screenToFlowPosition({ x: ev.clientX, y: ev.clientY })[axis] / 5) * 5
      useProject.getState().bendLink(id, value, axis)
    }
    const up = (ev: PointerEvent) => {
      if (ev.type === 'pointerup') move(ev)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
      el.removeEventListener('lostpointercapture', up)
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
    el.addEventListener('lostpointercapture', up)
  }
  return (
    <EdgeLabelRenderer>
      <div
        className={`bend-grip nodrag nopan ${manual ? 'is-manual' : ''}`}
        style={{ transform: `translate(-50%, -50%) translate(${at.x}px, ${at.y}px)`, cursor: axis === 'x' ? 'ew-resize' : 'ns-resize' }}
        role="slider" tabIndex={0} aria-label={t('canvasMenu.bendHint')} aria-valuenow={at[axis]} aria-orientation={axis === 'x' ? 'horizontal' : 'vertical'}
        title={t('canvasMenu.bendHint')}
        onPointerDown={onPointerDown}
        onKeyDown={e => { const keys = axis === 'x' ? ['ArrowLeft', 'ArrowRight'] : ['ArrowUp', 'ArrowDown']; if (!keys.includes(e.key)) return; e.preventDefault(); e.stopPropagation(); const v = at[axis] + (e.key === keys[0] ? -1 : 1) * (e.shiftKey ? 50 : 5); useProject.getState().updateLink(id, axis === 'x' ? { bendX: v, bendY: undefined } : { bendY: v, bendX: undefined }) }}
        onDoubleClick={(e) => { e.stopPropagation(); useProject.getState().updateLink(id, { bendX: undefined, bendY: undefined }) }}
      />
    </EdgeLabelRenderer>
  )
}

function SignalOrBundle(props: EdgeProps<SignalFlowEdge>) {
  return props.data?.ends ? <BundleEdge {...props} fallback={<SignalEdgeView {...props} />} /> : <SignalEdgeView {...props} />
}

export const SignalEdge = memo(SignalOrBundle)
