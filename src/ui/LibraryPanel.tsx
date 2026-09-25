// Bibliothèque : recherche, "Mes modèles", menus dépliables (Audio, Image, Lumière, Réseau, Distribution, Divers)
// puis sous-menus par famille ; glisser-déposer vers le canevas (ou double-clic).
import { useMemo, useState, type DragEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useReactFlow } from '@xyflow/react'
import { DND_MIME } from '../editor/Canvas'
import { LIBRARY } from '../library'
import { groupByDomain } from '../library/domains'
import type { EquipmentTemplate } from '../model/types'
import { BLANK_TEMPLATE, useLibrary } from '../store/libraryStore'
import { useProject } from '../store/projectStore'
import { useUi } from '../store/uiStore'
import { Icon } from './Icon'
import { Pictogram } from './Pictogram'

const OPEN_KEY = 'avd.libraryOpen'

/** Menus et sous-menus ouverts, mémorisés sur cet ordinateur. */
function readOpen(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(OPEN_KEY) ?? '["sound"]')
    return Array.isArray(v) ? v : ['sound']
  } catch {
    return ['sound']
  }
}

export function LibraryPanel() {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const mode = useUi((s) => s.mode)
  const userTemplates = useLibrary((s) => s.userTemplates)
  const rf = useReactFlow()

  const [open, setOpen] = useState<string[]>(readOpen)
  const toggle = (key: string) =>
    setOpen((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
      try {
        localStorage.setItem(OPEN_KEY, JSON.stringify(next))
      } catch {
        // stockage indisponible : l'état reste pour la session
      }
      return next
    })

  const q = query.trim().toLowerCase()
  const { mine, domains, total } = useMemo(() => {
    const match = (tpl: EquipmentTemplate) =>
      !q || `${tpl.model} ${tpl.manufacturer ?? ''} ${t(`family.${tpl.family}`)}`.toLowerCase().includes(q)
    const found = LIBRARY.filter(match)
    return { mine: userTemplates.filter(match), domains: groupByDomain(found), total: found.length }
  }, [q, t, userTemplates])
  // Pendant une recherche, tout ce qui correspond est déplié
  const isOpen = (key: string) => !!q || open.includes(key)

  const onDragStart = (e: DragEvent, tpl: EquipmentTemplate) => {
    e.dataTransfer.setData(DND_MIME, tpl.id)
    e.dataTransfer.effectAllowed = 'copy'
  }

  const addAtCenter = (tpl: EquipmentTemplate) => {
    const el = document.querySelector('.react-flow')?.getBoundingClientRect()
    const pos = el ? rf.screenToFlowPosition({ x: el.left + el.width / 2, y: el.top + el.height / 2 }) : { x: 0, y: 0 }
    const id = useProject.getState().addEquipment(tpl, { x: Math.round(pos.x / 10) * 10, y: Math.round(pos.y / 10) * 10 }, useUi.getState().currentSheetId)
    useUi.getState().select([id], [])
  }

  /** Nouveau bloc vide : passe en mode Expert pour afficher l'éditeur de ports. */
  const newBlock = () => {
    if (useUi.getState().mode !== 'expert') useUi.getState().setPref('mode', 'expert')
    addAtCenter({ ...BLANK_TEMPLATE, model: t('library.blankName') })
  }

  const renderItem = (tpl: EquipmentTemplate) => {
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
          <span className="lib-name">{tpl.manufacturer ? `${tpl.manufacturer} ${tpl.model}` : tpl.model}</span>
          <span className="lib-meta">{ins} in · {outs} out</span>
        </span>
        {tpl.status === 'user' ? (
          <button
            className="icon-btn small"
            onClick={(e) => { e.stopPropagation(); useLibrary.getState().removeUserTemplate(tpl.id) }}
            title={t('library.removeMine')}
            aria-label={t('library.removeMine')}
          >
            <Icon name="trash" size={13} />
          </button>
        ) : (
          mode === 'expert' && <span className={`tag tag-${tpl.status}`}>{t(`library.status.${tpl.status}`)}</span>
        )}
      </div>
    )
  }

  return (
    <aside className="panel library" aria-label={t('library.title')}>
      <div className="panel-title">
        {t('library.title')}
        <span className="count-chip">{LIBRARY.length + userTemplates.length}</span>
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
        {total + mine.length === 0 && <p className="empty">{t('library.empty')}</p>}
        {mine.length > 0 && (
          <section>
            <h3 className="group-title">{t('library.mine')}</h3>
            {mine.map(renderItem)}
          </section>
        )}
        {domains.map(({ domain, families }) => {
          const count = families.reduce((n, f) => n + f.items.length, 0)
          if (q && count === 0) return null
          return (
            <section key={domain} className="lib-domain">
              <button className="lib-domain-head" aria-expanded={isOpen(domain)} onClick={() => toggle(domain)}>
                <Icon name={isOpen(domain) ? 'chevronDown' : 'chevronRight'} size={14} />
                <span>{t(`library.domain.${domain}`)}</span>
                <span className="count-chip">{count}</span>
              </button>
              {isOpen(domain) && (
                <div className="lib-domain-body">
                  {families.length === 0 && <p className="empty">{t('library.domainEmpty')}</p>}
                  {families.map(({ family, items }) => {
                    const key = `${domain}:${family}`
                    return (
                      <div key={key} className="lib-family">
                        <button className="lib-family-head" aria-expanded={isOpen(key)} onClick={() => toggle(key)}>
                          <Icon name={isOpen(key) ? 'chevronDown' : 'chevronRight'} size={12} />
                          <span>{t(`family.${family}`)}</span>
                          <span className="dim">{items.length}</span>
                        </button>
                        {isOpen(key) && items.map(renderItem)}
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          )
        })}
      </div>
      <div className="library-foot">
        <button className="btn" onClick={newBlock}><Icon name="plus" size={14} />{t('library.newBlock')}</button>
      </div>
    </aside>
  )
}
