// Annotations libres : note de texte et cadre de zone (redimensionnable, derrière les équipements).
import { memo, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NodeResizer, type Node, type NodeProps } from '@xyflow/react'
import type { Annotation } from '../model/types'
import { useProject } from '../store/projectStore'

export type AnnotationNodeData = { annotation: Annotation; readOnly: boolean }
export type AnnotationFlowNode = Node<AnnotationNodeData, 'annotation'>

function AnnotationNodeView({ data, selected }: NodeProps<AnnotationFlowNode>) {
  const a = data.annotation
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(a.text)
  const ref = useRef<HTMLTextAreaElement | HTMLInputElement>(null)
  useEffect(() => setDraft(a.text), [a.text])
  useEffect(() => {
    if (editing) { ref.current?.focus(); ref.current?.select() }
  }, [editing])

  const commit = () => {
    setEditing(false)
    if (draft !== a.text) useProject.getState().updateAnnotation(a.id, { text: draft })
  }
  const color = a.color ?? 'var(--accent)'
  const zone = useProject((s) => (a.zoneId ? s.project.zones.find((z) => z.id === a.zoneId) : undefined))

  const editor = (multiline: boolean) => {
    const keys = (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') { setDraft(a.text); setEditing(false) }
      // Titre de cadre : Entrée valide ; note : Ctrl+Entrée (Entrée va à la ligne)
      if (e.key === 'Enter' && (!multiline || e.ctrlKey || e.metaKey)) { e.preventDefault(); commit() }
      e.stopPropagation()
    }
    return multiline ? (
      <textarea ref={ref as React.RefObject<HTMLTextAreaElement>} className="nodrag nowheel annotation-edit" value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={commit} onKeyDown={keys} />
    ) : (
      <input ref={ref as React.RefObject<HTMLInputElement>} className="nodrag nowheel annotation-edit-line" value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={commit} onKeyDown={keys} />
    )
  }

  if (a.kind === 'note') {
    return (
      <div
        className={`annotation annotation-note ${selected ? 'is-selected' : ''}`}
        style={{ width: a.size.w, height: a.size.h, ['--ann-color' as string]: color }}
        onDoubleClick={() => !data.readOnly && setEditing(true)}
      >
        {editing ? editor(true) : <div className="annotation-text">{a.text}</div>}
      </div>
    )
  }

  // Cadre (zone) : seul l'onglet du titre se saisit (déplacer, sélectionner, renommer) ; l'intérieur
  // laisse passer la souris, pour tracer un cadre de sélection ou cliquer les blocs posés dedans.
  return (
    <div
      className={`annotation annotation-frame ${selected ? 'is-selected' : ''}`}
      style={{ width: a.size.w, height: a.size.h, ['--ann-color' as string]: color }}
    >
      {!data.readOnly && (
        <NodeResizer
          isVisible={selected}
          minWidth={160}
          minHeight={100}
          lineClassName="resizer-line"
          handleClassName="resizer-handle"
          onResizeStart={() => useProject.getState().beginGesture()}
          onResizeEnd={() => useProject.getState().settleZones()}
          onResize={(_, p) =>
            useProject.getState().moveAnnotation(a.id, { position: { x: p.x, y: p.y }, size: { w: p.width, h: p.height } })
          }
        />
      )}
      <div className="annotation-head" onDoubleClick={() => !data.readOnly && setEditing(true)} title={data.readOnly ? undefined : t('annotations.headHint')}>
        {editing ? editor(false) : (
          <>
            <span className="annotation-text">{a.text.split('\n')[0] || '\u00a0'}</span>
            {zone && <span className="annotation-zone" title={zone.name}>{zone.code}</span>}
          </>
        )}
      </div>
    </div>
  )
}

export const AnnotationNode = memo(AnnotationNodeView)
