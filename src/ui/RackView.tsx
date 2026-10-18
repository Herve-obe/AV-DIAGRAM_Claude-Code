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
import { Field, toNumber } from './Field'
import { useExportPdf } from './ExportPdfDialog'
import { useCollab } from '../collab/session'

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
      <button className="rack-item-name" onClick={() => useUi.getState().select([eq.id], [])}>{eq.name}</button>
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
  const readOnly = useCollab(s => s.role === 'guest')
  return (
    <section className="rack-card" aria-label={rack.name}>
      <header className="rack-head">
        <input
          className="rack-name"
          defaultValue={rack.name}
          key={rack.name}
          aria-label={t('racks.name')}
          disabled={readOnly}
          onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== rack.name) store.updateRack(rack.id, { name: v }) }}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        />
        <select
          value={rack.heightU}
          aria-label={t('racks.height')}
          disabled={readOnly}
          onChange={(e) => store.updateRack(rack.id, { heightU: Number(e.target.value) })}
        >
          {[...new Set([...RACK_HEIGHTS, rack.heightU])].sort((a, b) => a - b).map((h) => <option key={h} value={h}>{h} U</option>)}
        </select>
        <button className="icon-btn small" disabled={readOnly} onClick={() => store.removeRack(rack.id)} title={t('racks.remove')} aria-label={t('racks.remove')}>
          <Icon name="trash" size={13} />
        </button>
      </header>
      <fieldset className="rack-limits" disabled={readOnly}>
        <legend>{t('racks.limits')}</legend>
        <Field id={`rack-depth-${rack.id}`} type="number" label={t('racks.depth')} value={rack.depthMm} onCommit={v => store.updateRack(rack.id, { depthMm: toNumber(v) || undefined })} />
        <Field id={`rack-weight-${rack.id}`} type="number" label={t('racks.maxWeight')} value={rack.maxWeightKg} onCommit={v => store.updateRack(rack.id, { maxWeightKg: toNumber(v) || undefined })} />
      </fieldset>
      <div className="rack-faces">
        <RackFaceColumn rack={rack} face="front" onError={onError} />
        <RackFaceColumn rack={rack} face="rear" onError={onError} />
      </div>
      <footer className="rack-usage">
        <span>{t('racks.usage.used', { used: usage.usedU, free: usage.freeU })}</span>
        <span>{t('racks.usage.weight', { kg: usage.weightKg })}{usage.missingWeight ? ` (${t('racks.usage.missing', { count: usage.missingWeight })})` : ''}</span>
        <span>{t('racks.usage.power', { w: usage.powerW, btu: usage.btuH })}{usage.missingPower ? ` (${t('racks.usage.missing', { count: usage.missingPower })})` : ''}</span>
        <span className="dim">{t('racks.usage.height', { mm: usage.heightMm })}</span>
        {(usage.missingDepth > 0 || rack.depthMm == null || rack.maxWeightKg == null) && <span className="rack-warning">{t('racks.incomplete', { count: usage.missingDepth })}</span>}
      </footer>
      {mountedIn(project, rack.id).some(eq => eq.modules?.length) && <details className="rack-modules">
        <summary>{t('modules.title')}</summary>
        {mountedIn(project, rack.id).filter(eq => eq.modules?.length).map(eq => <div key={eq.id}>
          <button className="link-btn" onClick={() => useUi.getState().select([eq.id], [])}>{eq.name}</button>
          <ul>{eq.modules!.map(m => <li key={m.id}>{eq.slots?.find(s => s.id === m.slotId)?.name ?? m.slotId} : {m.manufacturer} {m.model}</li>)}</ul>
        </div>)}
      </details>}
    </section>
  )
}

/** Alternative au glisser-déposer, utilisable au clavier. */
function MountForm({ onError }: { onError: (msg: string) => void }) {
  const { t } = useTranslation()
  const project = useProject(s => s.project)
  const selection = useUi(s => s.selectedEquipment[0])
  const mount = project.equipment[selection]?.mount
  const [rackId, setRack] = useState(mount?.rackId ?? '')
  const [face, setFace] = useState<RackFace>(mount?.face ?? 'front')
  const [u, setU] = useState(String(mount?.u ?? 1))
  const racks = Object.values(project.racks ?? {})
  const equipment = Object.values(project.equipment).filter(eq => (eq.rackU ?? 0) > 0)
  const eqId = equipment.some(eq => eq.id === selection) ? selection : equipment[0]?.id ?? ''
  const target = racks.some(r => r.id === rackId) ? rackId : racks[0]?.id ?? ''
  return <form className="rack-mount-form" onSubmit={e => {
    e.preventDefault()
    const err = useProject.getState().mountEquipment(eqId, target, Number(u), face)
    if (err) onError(t(`racks.error.${err}`, { name: project.equipment[eqId]?.name }))
    else useUi.getState().select([eqId], [])
  }}>
    <label htmlFor="mount-eq">{t('racks.equipment')}</label>
    <select id="mount-eq" value={eqId} onChange={e => useUi.getState().select([e.target.value], [])}>
      {!equipment.length && <option value="">—</option>}
      {equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
    </select>
    <label htmlFor="mount-rack">{t('racks.name')}</label>
    <select id="mount-rack" value={target} onChange={e => setRack(e.target.value)}>
      {!racks.length && <option value="">—</option>}
      {racks.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
    </select>
    <label htmlFor="mount-face">{t('racks.faceLabel')}</label>
    <select id="mount-face" value={face} onChange={e => setFace(e.target.value as RackFace)}>
      <option value="front">{t('racks.face.front')}</option><option value="rear">{t('racks.face.rear')}</option>
    </select>
    <label htmlFor="mount-u">{t('racks.unit')}</label>
    <input id="mount-u" type="number" min="1" max={project.racks?.[target]?.heightU ?? 100} step="1" value={u} onChange={e => setU(e.target.value)} required />
    <button className="btn" disabled={!eqId || !target}>{t('racks.mount')}</button>
  </form>
}

export function RackView() {
  const { t } = useTranslation()
  const project = useProject((s) => s.project)
  const racks = Object.values(project.racks ?? {}).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
  const pending = unmountedRackable(project)
  const invalid = invalidMounts(project)
  const [message, setMessage] = useState<string | null>(null)
  const readOnly = useCollab(s => s.role === 'guest')
  const selected = useUi(s => s.selectedEquipment[0])
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
              <button onClick={() => useUi.getState().select([eq.id], [])}>{eq.name}</button>
              <span className="mono dim">{heightOf(eq)} U</span>
            </li>
          ))}
        </ul>
        <MountForm key={selected} onError={onError} />
        {invalid.length > 0 && (
          <div className="rack-invalid" role="alert">
            <strong>{t('racks.invalid')}</strong>
            <ul>{invalid.map((eq) => <li key={eq.id}><button onClick={() => useUi.getState().select([eq.id], [])}>{eq.name}</button> : {t(`racks.error.${checkMount(project, eq.id, eq.mount!.rackId, eq.mount!.u, eq.mount!.face)}`, { name: eq.name })}</li>)}</ul>
          </div>
        )}
      </aside>
      <div className="rack-board">
        <div className="rack-toolbar">
          <button className="btn" disabled={readOnly} onClick={() => useProject.getState().addRack()}>
            <Icon name="plus" size={14} /> {t('racks.add')}
          </button>
          <button className="btn" disabled={!racks.length} onClick={() => useExportPdf.getState().setOpen(true)}><Icon name="pdf" size={14} /> {t('racks.export')}</button>
          <span className="dim small">{t('racks.linkedHint')}</span>
          {message && <span className="rack-message" role="status">{message}</span>}
        </div>
        {racks.length === 0 ? (
          <div className="rack-empty">
            <p>{t('racks.empty')}</p>
            <button className="btn btn-primary" disabled={readOnly} onClick={() => useProject.getState().addRack()}>{t('racks.add')}</button>
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
