// Liaison typée : couleur et style de trait selon le signal, étiquette = numéro de câble.
import { memo } from 'react'
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, type Edge, type EdgeProps } from '@xyflow/react'
import { labelPoint, toSvgPath } from '../model/routing'
import type { Severity } from '../model/rules'
import { useRoutes } from './EdgeRouter'
import { SIGNAL_STYLE, type SignalFamily } from '../model/signals'

export type SignalEdgeData = {
  signal: SignalFamily
  label: string
  severity?: Severity
  showLabel: boolean
  /** Trait de câble regroupant plusieurs liaisons (vue « Câbles ») */
  linkIds?: string[]
}
export type SignalFlowEdge = Edge<SignalEdgeData, 'signal'>

function SignalEdgeView(props: EdgeProps<SignalFlowEdge>) {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, selected } = props
  // Tracé calculé par le routeur (contourne les blocs, voies écartées) ; sinon tracé simple
  const route = useRoutes((s) => s.routes.get(id))
  const labelAt = useRoutes((s) => s.labels.get(id))
  let [path, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, borderRadius: 8, offset: 18,
  })
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

export const SignalEdge = memo(SignalEdgeView)
