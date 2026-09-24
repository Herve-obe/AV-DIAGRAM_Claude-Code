// Annotations libres : note de texte et cadre de zone (redimensionnable, derrière les équipements).
import { memo, useEffect, useRef, useState } from 'react'
import { NodeResizer, type Node, type NodeProps } from '@xyflow/react'
import type { Annotation } from '../model/types'
import { useProject } from '../store/projectStore'

export type AnnotationNodeData = { annotation: Annotation; readOnly: boolean }
export type AnnotationFlowNode = Node<AnnotationNodeData, 'annotation'>

function AnnotationNodeView({ data, selected }: NodeProps<AnnotationFlowNode>) {
  const a = data.annotation
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(a.text)
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => setDraft(a.text), [a.text])
  useEffect(() => {
    if (editing) ref.current?.focus()
  }, [editing])

  const commit = () => {
    setEditing(false)
    if (draft !== a.text) useProject.getState().updateAnnotation(a.id, { text: draft })
  }
  const color = a.color ?? 'var(--accent)'

  return (
    <div
      className={`annotation annotation-${a.kind} ${selected ? 'is-selected' : ''}`}
      style={{ width: a.size.w, height: a.size.h, ['--ann-color' as string]: color }}
      onDoubleClick={() => !data.readOnly && setEditing(true)}
    >
      {a.kind === 'frame' && !data.readOnly && (
        <NodeResizer
          isVisible={selected}
          minWidth={160}
          minHeight={100}
          lineClassName="resizer-line"
          handleClassName="resizer-handle"
          onResizeStart={() => useProject.getState().beginGesture()}
          onResize={(_, p) =>
            useProject.getState().moveAnnotation(a.id, { position: { x: p.x, y: p.y }, size: { w: p.width, h: p.height } })
          }
        />
      )}
      {editing ? (
        <textarea
          ref={ref}
          className="nodrag nowheel annotation-edit"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Escape') { setDraft(a.text); setEditing(false) }
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) commit()
            e.stopPropagation()
          }}
        />
      ) : (
        <div className="annotation-text">{a.text}</div>
      )}
    </div>
  )
}

export const AnnotationNode = memo(AnnotationNodeView)
