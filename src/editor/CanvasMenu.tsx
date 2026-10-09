// Menu clic droit du synoptique : actions sur la sélection (liaisons dans un multipaire, dupliquer,
// pivoter, grouper, supprimer). Le menu agit toujours sur la sélection courante.
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { groupSelected } from '../ui/groupActions'
import { useProject } from '../store/projectStore'
import { useUi } from '../store/uiStore'

export interface MenuAt {
  x: number
  y: number
}

export function CanvasMenu({ at, onClose, onSelectAll }: { at: MenuAt; onClose: () => void; onSelectAll: () => void }) {
  const { t } = useTranslation()
  const ref = useRef<HTMLDivElement>(null)
  const project = useProject((s) => s.project)
  const { selectedEquipment, selectedLinks } = useUi()
  const store = useProject.getState()
  const links = selectedLinks.filter((id) => project.links[id])
  const equipment = selectedEquipment.filter((id) => project.equipment[id])
  const inMulticore = links.filter((id) => project.links[id].multicoreId)
  const multicores = Object.values(project.multicores ?? {}).sort((a, b) => a.label.localeCompare(b.label))

  useEffect(() => {
    const close = (e: Event) => { if (!ref.current?.contains(e.target as Node)) onClose() }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('pointerdown', close, true)
    window.addEventListener('wheel', onClose, true)
    window.addEventListener('keydown', onKey)
    ref.current?.querySelector<HTMLElement>('button')?.focus()
    return () => {
      window.removeEventListener('pointerdown', close, true)
      window.removeEventListener('wheel', onClose, true)
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  // Le menu reste dans la fenêtre
  const style = { left: Math.min(at.x, window.innerWidth - 250), top: Math.min(at.y, window.innerHeight - 320) }
  const run = (fn: () => void) => () => { fn(); onClose() }
  const toMulticore = (id: string | null) => run(() => {
    if (store.assignToMulticore(links, id)) useUi.getState().setPref('linkView', 'cables')
  })

  return (
    <div ref={ref} className="menu-pop canvas-menu" role="menu" style={style} onContextMenu={(e) => e.preventDefault()}>
      {links.length > 0 && (
        <>
          <div className="menu-label">{t('canvasMenu.multicore', { count: links.length })}</div>
          <button role="menuitem" onClick={toMulticore(null)}>+ {t('inspector.multicoreNew')}</button>
          {multicores.map((m) => (
            <button key={m.id} role="menuitem" onClick={toMulticore(m.id)}>{m.label} <span className="dim">({m.pairs})</span></button>
          ))}
          {inMulticore.length > 0 && (
            <button role="menuitem" onClick={run(() => { for (const id of inMulticore) store.updateLink(id, { multicoreId: undefined, pair: undefined }) })}>
              {t('canvasMenu.leaveMulticore', { count: inMulticore.length })}
            </button>
          )}
          <hr />
        </>
      )}
      {equipment.length > 0 && (
        <>
          <button role="menuitem" onClick={run(() => { const ids = store.duplicate(equipment); if (ids.length) useUi.getState().select(ids, []) })}>
            {t('canvasMenu.duplicate')} <kbd>Ctrl+D</kbd>
          </button>
          <button role="menuitem" onClick={run(() => store.rotateEquipment(equipment, 1))}>{t('canvasMenu.rotate')} <kbd>R</kbd></button>
          {selectedEquipment.length > 1 && <button role="menuitem" onClick={run(groupSelected)}>{t('groups.group')} <kbd>Ctrl+G</kbd></button>}
        </>
      )}
      <button role="menuitem" onClick={run(onSelectAll)}>{t('canvasMenu.selectAll')} <kbd>Ctrl+A</kbd></button>
      {(selectedEquipment.length > 0 || links.length > 0) && (
        <button role="menuitem" className="danger" onClick={run(() => { store.remove(selectedEquipment, links); useUi.getState().select([], []) })}>
          {t('canvasMenu.delete')} <kbd>Suppr</kbd>
        </button>
      )}
    </div>
  )
}
