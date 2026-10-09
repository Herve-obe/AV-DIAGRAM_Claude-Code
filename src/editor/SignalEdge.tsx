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

export type SignalEdgeData = {
  signal: SignalFamily
  label: string
  severity?: Severity
  showLabel: boolean
  /** Trait de câble regroupant plusieurs liaisons (vue « Câbles ») */
  linkIds?: string[]
  /** Segment vertical déplacé à la main (px du schéma) */
  bendX?: number
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
  })
  // Poignée du segment vertical : liaisons entre ports à gauche ou à droite seulement
  const sideways = (p: Position) => p === Position.Left || p === Position.Right
  const bendable = selected && sideways(sourcePosition) && sideways(targetPosition)
  const grip = bendable ? gripOf(route, data?.bendX ?? (sourceX + targetX) / 2, (sourceY + targetY) / 2) : null
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
      {grip && <BendGrip id={id} at={grip} manual={data.bendX !== undefined} />}
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
function gripOf(route: Point[] | undefined, x: number, y: number): Point | null {
  if (!route || route.length < 2) return { x, y }
  let best: Point | null = null
  let len = 0
  for (let i = 0; i < route.length - 1; i++) {
    const a = route[i]
    const b = route[i + 1]
    if (a.x !== b.x) continue
    const l = Math.abs(b.y - a.y)
    if (l > len) { len = l; best = { x: a.x, y: (a.y + b.y) / 2 } }
  }
  return best
}

/**
 * Poignée de la liaison sélectionnée : glisser déplace son segment vertical (un pas d'annulation),
 * double-clic rend le tracé automatique.
 */
function BendGrip({ id, at, manual }: { id: string; at: Point; manual: boolean }) {
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
      const x = Math.round(rf.screenToFlowPosition({ x: ev.clientX, y: ev.clientY }).x / 5) * 5
      useProject.getState().bendLink(id, x)
    }
    const up = () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
  }
  return (
    <EdgeLabelRenderer>
      <div
        className={`bend-grip nodrag nopan ${manual ? 'is-manual' : ''}`}
        style={{ transform: `translate(-50%, -50%) translate(${at.x}px, ${at.y}px)` }}
        title={t('canvasMenu.bendHint')}
        onPointerDown={onPointerDown}
        onDoubleClick={(e) => { e.stopPropagation(); useProject.getState().updateLink(id, { bendX: undefined }) }}
      />
    </EdgeLabelRenderer>
  )
}

function SignalOrBundle(props: EdgeProps<SignalFlowEdge>) {
  return props.data?.ends ? <BundleEdge {...props} fallback={<SignalEdgeView {...props} />} /> : <SignalEdgeView {...props} />
}

export const SignalEdge = memo(SignalOrBundle)
