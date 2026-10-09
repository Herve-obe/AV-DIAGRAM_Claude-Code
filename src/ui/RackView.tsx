// Vue Baies (élévation de rack, V4) : baies 19" côte à côte, faces avant et arrière, équipements
// placés en U par glisser-déposer. Un équipement monté est la même instance que sur le synoptique :
// le sélectionner ici l'ouvre dans l'inspecteur, le modifier là le modifie partout.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { checkMount, heightOf, invalidMounts, mountedIn, RACK_HEIGHTS, rackUsage, unmountedRackable } from '../model/racks'
import type { Equipment, Rack, RackFace } from '../model/types'
import { useProject } from '../store/projectStore'
import { useUi } from '../store/uiStore'
import { Icon } from './Icon'

/** Hauteur d'une unité à l'écran, en px */
const ROW = 22
const DRAG_TYPE = 'application/x-avd-equipment'
/** Équipement en cours de glisser : dataTransfer n'est pas lisible pendant dragover. */
let dragging: string | null = null
const startDrag = (e: React.DragEvent, id: string) => { dragging = id; e.dataTransfer.setData(DRAG_TYPE, id) }

/** Unité basse visée par un dépôt : le haut de l'équipement s'aligne sur la ligne survolée. */
function dropU(e: React.DragEvent, rack: Rack, h: number): number {
  const box = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const row = Math.floor((e.clientY - box.top) / ROW)
  return rack.heightU - row - h + 1
}

function RackItem({ eq, rack }: { eq: Equipment; rack: Rack }) {
  const { t } = useTranslation()
  const selected = useUi((s) => s.selectedEquipment.includes(eq.id))
  const h = heightOf(eq)
  const top = (rack.heightU - (eq.mount!.u + h - 1)) * ROW
  return (
    <div
      className={`rack-item ${selected ? 'is-selected' : ''}`}
      style={{ top, height: h * ROW - 2 }}
      draggable
      onDragStart={(e) => startDrag(e, eq.id)}
      onDragEnd={() => { dragging = null }}
      onClick={() => useUi.getState().select([eq.id], [])}
      title={`${eq.name} · ${eq.manufacturer ?? ''} ${eq.model} · ${h} U`}
    >
      <span className="rack-item-name">{eq.name}</span>
      {h > 1 && <span className="rack-item-model">{eq.model}</span>}
      {eq.rackU == null && <span className="rack-item-warn" title={t('racks.noHeight')}>?</span>}
      <button
        className="rack-item-remove"
        onClick={(e) => { e.stopPropagation(); useProject.getState().unmountEquipment(eq.id) }}
        title={t('racks.unmount')}
        aria-label={t('racks.unmount')}
      >
        ×
      </button>
    </div>
  )
}

function RackFaceColumn({ rack, face, onError }: { rack: Rack; face: RackFace; onError: (msg: string) => void }) {
  const { t } = useTranslation()
  const project = useProject((s) => s.project)
  const [hover, setHover] = useState<{ u: number; h: number; ok: boolean } | null>(null)
  const items = mountedIn(project, rack.id, face)

  const target = (e: React.DragEvent) => {
    const id = e.dataTransfer.getData(DRAG_TYPE) || dragging
    const eq = id ? project.equipment[id] : undefined
    return eq ? { eq, u: dropU(e, rack, heightOf(eq)) } : null
  }
  return (
    <div className="rack-face">
      <div className="rack-face-title">{t(`racks.face.${face}`)}</div>
      <div className="rack-frame">
        <div className="rack-numbers" aria-hidden="true">
          {Array.from({ length: rack.heightU }, (_, i) => <span key={i} style={{ height: ROW }}>{rack.heightU - i}</span>)}
        </div>
        <div
          className="rack-slots"
          style={{ height: rack.heightU * ROW }}
          onDragOver={(e) => {
            e.preventDefault()
            const tg = target(e)
            if (tg) setHover({ u: tg.u, h: heightOf(tg.eq), ok: !checkMount(project, tg.eq.id, rack.id, tg.u, face) })
          }}
          onDragLeave={() => setHover(null)}
          onDrop={(e) => {
            e.preventDefault()
            setHover(null)
            const tg = target(e)
            if (!tg) return
            const err = useProject.getState().mountEquipment(tg.eq.id, rack.id, tg.u, face)
            if (err) onError(t(`racks.error.${err}`, { name: tg.eq.name }))
            else useUi.getState().select([tg.eq.id], [])
          }}
        >
          {hover && (
            <div
              className={`rack-ghost ${hover.ok ? '' : 'is-bad'}`}
              style={{ top: (rack.heightU - (hover.u + hover.h - 1)) * ROW, height: hover.h * ROW - 2 }}
            />
          )}
          {items.map((eq) => <RackItem key={eq.id} eq={eq} rack={rack} />)}
        </div>
      </div>
    </div>
  )
}

function RackCard({ rack, onError }: { rack: Rack; onError: (msg: string) => void }) {
  const { t } = useTranslation()
  const project = useProject((s) => s.project)
  const usage = rackUsage(project, rack.id)
  const store = useProject.getState()
  return (
    <section className="rack-card" aria-label={rack.name}>
      <header className="rack-head">
        <input
          className="rack-name"
          defaultValue={rack.name}
          key={rack.name}
          aria-label={t('racks.name')}
          onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== rack.name) store.updateRack(rack.id, { name: v }) }}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        />
        <select
          value={rack.heightU}
          aria-label={t('racks.height')}
          onChange={(e) => store.updateRack(rack.id, { heightU: Number(e.target.value) })}
        >
          {[...new Set([...RACK_HEIGHTS, rack.heightU])].sort((a, b) => a - b).map((h) => <option key={h} value={h}>{h} U</option>)}
        </select>
        <button className="icon-btn small" onClick={() => store.removeRack(rack.id)} title={t('racks.remove')} aria-label={t('racks.remove')}>
          <Icon name="trash" size={13} />
        </button>
      </header>
      <div className="rack-faces">
        <RackFaceColumn rack={rack} face="front" onError={onError} />
        <RackFaceColumn rack={rack} face="rear" onError={onError} />
      </div>
      <footer className="rack-usage">
        <span>{t('racks.usage.used', { used: usage.usedU, free: usage.freeU })}</span>
        <span>{t('racks.usage.weight', { kg: usage.weightKg })}{usage.missingWeight ? ` (${t('racks.usage.missing', { count: usage.missingWeight })})` : ''}</span>
        <span>{t('racks.usage.power', { w: usage.powerW, btu: usage.btuH })}{usage.missingPower ? ` (${t('racks.usage.missing', { count: usage.missingPower })})` : ''}</span>
        <span className="dim">{t('racks.usage.height', { mm: usage.heightMm })}</span>
      </footer>
    </section>
  )
}

export function RackView() {
  const { t } = useTranslation()
  const project = useProject((s) => s.project)
  const racks = Object.values(project.racks ?? {}).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
  const pending = unmountedRackable(project)
  const invalid = invalidMounts(project)
  const [message, setMessage] = useState<string | null>(null)
  const onError = (msg: string) => { setMessage(msg); window.setTimeout(() => setMessage(null), 4000) }

  return (
    <div className="rack-view">
      <aside className="rack-pending" aria-label={t('racks.pending')}>
        <div className="rack-pending-head">
          <h3>{t('racks.pending')}</h3>
          <span className="dim">{pending.length}</span>
        </div>
        <p className="dim small">{t('racks.pendingHint')}</p>
        <ul>
          {pending.map((eq) => (
            <li
              key={eq.id}
              draggable
              onDragStart={(e) => startDrag(e, eq.id)}
              onDragEnd={() => { dragging = null }}
              onClick={() => useUi.getState().select([eq.id], [])}
              title={`${eq.manufacturer ?? ''} ${eq.model}`}
            >
              <span>{eq.name}</span>
              <span className="mono dim">{heightOf(eq)} U</span>
            </li>
          ))}
        </ul>
        {invalid.length > 0 && (
          <div className="rack-invalid" role="alert">
            <strong>{t('racks.invalid')}</strong>
            <ul>{invalid.map((eq) => <li key={eq.id}>{eq.name}</li>)}</ul>
          </div>
        )}
      </aside>
      <div className="rack-board">
        <div className="rack-toolbar">
          <button className="btn" onClick={() => useProject.getState().addRack()}>
            <Icon name="plus" size={14} /> {t('racks.add')}
          </button>
          <span className="dim small">{t('racks.linkedHint')}</span>
          {message && <span className="rack-message" role="status">{message}</span>}
        </div>
        {racks.length === 0 ? (
          <div className="rack-empty">
            <p>{t('racks.empty')}</p>
            <button className="btn btn-primary" onClick={() => useProject.getState().addRack()}>{t('racks.add')}</button>
          </div>
        ) : (
          <div className="rack-row">
            {racks.map((r) => <RackCard key={r.id} rack={r} onError={onError} />)}
          </div>
        )}
      </div>
    </div>
  )
}
