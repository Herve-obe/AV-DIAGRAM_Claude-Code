// Bibliothèque : recherche, familles, glisser-déposer vers le canevas (ou double-clic).
import { useMemo, useState, type DragEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useReactFlow } from '@xyflow/react'
import { DND_MIME } from '../editor/Canvas'
import { LIBRARY } from '../library'
import type { EquipmentTemplate } from '../model/types'
import { useProject } from '../store/projectStore'
import { useUi } from '../store/uiStore'
import { Icon } from './Icon'
import { Pictogram } from './Pictogram'

export function LibraryPanel() {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const mode = useUi((s) => s.mode)
  const rf = useReactFlow()

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const map = new Map<string, EquipmentTemplate[]>()
    for (const tpl of LIBRARY) {
      const hay = `${tpl.model} ${tpl.manufacturer ?? ''} ${t(`family.${tpl.family}`)}`.toLowerCase()
      if (q && !hay.includes(q)) continue
      map.set(tpl.family, [...(map.get(tpl.family) ?? []), tpl])
    }
    return [...map.entries()]
  }, [query, t])

  const onDragStart = (e: DragEvent, tpl: EquipmentTemplate) => {
    e.dataTransfer.setData(DND_MIME, tpl.id)
    e.dataTransfer.effectAllowed = 'copy'
  }

  const addAtCenter = (tpl: EquipmentTemplate) => {
    const el = document.querySelector('.react-flow')?.getBoundingClientRect()
    const pos = el ? rf.screenToFlowPosition({ x: el.left + el.width / 2, y: el.top + el.height / 2 }) : { x: 0, y: 0 }
    const id = useProject.getState().addEquipment(tpl, { x: Math.round(pos.x / 10) * 10, y: Math.round(pos.y / 10) * 10 })
    useUi.getState().select([id], [])
  }

  return (
    <aside className="panel library" aria-label={t('library.title')}>
      <div className="panel-title">
        {t('library.title')}
        <span className="count-chip">{LIBRARY.length}</span>
      </div>
      <label className="search">
        <Icon name="search" size={14} />
        <input
          id="library-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('library.search')}
          aria-label={t('library.search')}
        />
      </label>
      {mode === 'beginner' && <p className="hint">{t('library.hint')}</p>}
      <div className="library-list">
        {groups.length === 0 && <p className="empty">{t('library.empty')}</p>}
        {groups.map(([family, items]) => (
          <section key={family}>
            <h3 className="group-title">{t(`family.${family}`)}</h3>
            {items.map((tpl) => {
              const ins = tpl.ports.filter((p) => p.direction === 'in').length
              const outs = tpl.ports.length - ins
              return (
                <div
                  key={tpl.id}
                  className="lib-item"
                  draggable
                  onDragStart={(e) => onDragStart(e, tpl)}
                  onDoubleClick={() => addAtCenter(tpl)}
                  onKeyDown={(e) => e.key === 'Enter' && addAtCenter(tpl)}
                  tabIndex={0}
                  role="button"
                  title={t('library.hint')}
                >
                  <span className="lib-pict"><Pictogram id={tpl.pictogram} /></span>
                  <span className="lib-text">
                    <span className="lib-name">{tpl.model}</span>
                    <span className="lib-meta">{ins} in · {outs} out</span>
                  </span>
                  {mode === 'expert' && <span className={`tag tag-${tpl.status}`}>{t(`library.status.${tpl.status}`)}</span>}
                </div>
              )
            })}
          </section>
        ))}
      </div>
    </aside>
  )
}
