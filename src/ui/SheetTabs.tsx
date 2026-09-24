// Onglets des feuilles du projet (au-dessus du canevas) et outils d'annotation.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useReactFlow } from '@xyflow/react'
import type { Annotation } from '../model/types'
import { useProject } from '../store/projectStore'
import { useUi } from '../store/uiStore'
import { Icon } from './Icon'

export function SheetTabs() {
  const { t } = useTranslation()
  const sheets = useProject((s) => s.project.sheets ?? [])
  const { currentSheetId, setSheet, presenting } = useUi()
  const [renaming, setRenaming] = useState<string | null>(null)
  const rf = useReactFlow()

  const add = () => {
    const id = useProject.getState().addSheet(t('sheets.newName', { n: sheets.length + 1 }))
    setSheet(id)
    setRenaming(id)
  }

  /** Pose une note ou un cadre au centre de la vue. */
  const addAnnotation = (kind: Annotation['kind']) => {
    const el = document.querySelector('.react-flow')?.getBoundingClientRect()
    const c = el ? rf.screenToFlowPosition({ x: el.left + el.width / 2, y: el.top + el.height / 2 }) : { x: 0, y: 0 }
    const size = kind === 'frame' ? { w: 480, h: 320 } : { w: 220, h: 90 }
    const id = useProject.getState().addAnnotation({
      kind,
      sheetId: currentSheetId,
      position: { x: Math.round((c.x - size.w / 2) / 10) * 10, y: Math.round((c.y - size.h / 2) / 10) * 10 },
      size,
      text: kind === 'frame' ? t('annotations.frameText') : t('annotations.noteText'),
      color: kind === 'frame' ? 'var(--sig-audio-analog)' : undefined,
    })
    useUi.getState().select([id], [])
  }

  return (
    <div className="sheetbar">
      <div className="sheet-tabs" role="tablist" aria-label={t('sheets.label')}>
        {sheets.map((s) => (
          <div key={s.id} className={`sheet-tab ${s.id === currentSheetId ? 'is-active' : ''}`}>
            {renaming === s.id ? (
              <input
                autoFocus
                defaultValue={s.name}
                aria-label={t('sheets.rename')}
                onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== s.name) useProject.getState().renameSheet(s.id, v); setRenaming(null) }}
                onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setRenaming(null) }}
              />
            ) : (
              <button
                role="tab"
                aria-selected={s.id === currentSheetId}
                onClick={() => setSheet(s.id)}
                onDoubleClick={() => !presenting && setRenaming(s.id)}
                title={presenting ? undefined : t('sheets.renameHint')}
              >
                {s.name}
              </button>
            )}
            {!presenting && sheets.length > 1 && s.id === currentSheetId && renaming !== s.id && (
              <button
                className="sheet-close"
                onClick={() => {
                  const next = sheets.find((x) => x.id !== s.id)
                  useProject.getState().removeSheet(s.id)
                  if (next) setSheet(next.id)
                }}
                title={t('sheets.remove')}
                aria-label={t('sheets.remove')}
              >
                <Icon name="close" size={11} />
              </button>
            )}
          </div>
        ))}
        {!presenting && (
          <button className="icon-btn small" onClick={add} title={t('sheets.add')} aria-label={t('sheets.add')}>
            <Icon name="plus" size={14} />
          </button>
        )}
      </div>
      {!presenting && (
        <div className="annotation-tools">
          <button className="btn btn-ghost" onClick={() => addAnnotation('note')}><Icon name="note" size={14} />{t('annotations.note')}</button>
          <button className="btn btn-ghost" onClick={() => addAnnotation('frame')}><Icon name="frame" size={14} />{t('annotations.frame')}</button>
        </div>
      )}
    </div>
  )
}
