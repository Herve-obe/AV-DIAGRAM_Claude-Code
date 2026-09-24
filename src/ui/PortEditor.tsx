// Éditeur de ports (mode Expert) : ajouter, modifier ou supprimer les entrées et sorties d'un équipement.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CONNECTORS, connectorLabel } from '../model/connectors'
import { SIGNAL_FAMILIES, SIGNAL_STYLE } from '../model/signals'
import type { Equipment, Level, PortDef, PortDirection } from '../model/types'
import { useProject } from '../store/projectStore'
import { Field } from './Field'
import { Icon } from './Icon'

const LEVELS: Level[] = ['mic', 'instrument', 'line+4', 'line-10', 'speaker', 'none']
const DIRECTIONS: PortDirection[] = ['in', 'out', 'bidir']
const AUDIO_ANALOG = 'audioAnalog'

function PortForm({ eq, port }: { eq: Equipment; port: PortDef }) {
  const { t } = useTranslation()
  const { updatePort, removePort } = useProject.getState()
  const set = (patch: Partial<Omit<PortDef, 'id'>>) => updatePort(eq.id, port.id, patch)
  const fid = `port-${eq.id}-${port.id}`
  return (
    <div className="port-form">
      <Field id={`${fid}-name`} label={t('ports.name')} value={port.name} onCommit={(v) => set({ name: v.trim() || port.name })} />
      <div className="field-row">
        <div className="field">
          <label htmlFor={`${fid}-dir`}>{t('ports.direction')}</label>
          <select id={`${fid}-dir`} value={port.direction} onChange={(e) => set({ direction: e.target.value as PortDirection })}>
            {DIRECTIONS.map((d) => <option key={d} value={d}>{t(`direction.${d}`)}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor={`${fid}-sig`}>{t('ports.signal')}</label>
          <select id={`${fid}-sig`} value={port.signal} onChange={(e) => set({ signal: e.target.value as PortDef['signal'] })}>
            {SIGNAL_FAMILIES.map((s) => <option key={s} value={s}>{t(`signal.${s}`)}</option>)}
          </select>
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor={`${fid}-con`}>{t('ports.connector')}</label>
          <select id={`${fid}-con`} value={port.connector} onChange={(e) => set({ connector: e.target.value })}>
            {CONNECTORS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
        {port.signal === AUDIO_ANALOG && (
          <div className="field">
            <label htmlFor={`${fid}-lvl`}>{t('ports.level')}</label>
            <select id={`${fid}-lvl`} value={port.level ?? 'none'} onChange={(e) => set({ level: e.target.value as Level })}>
              {LEVELS.map((l) => <option key={l} value={l}>{t(`level.${l}`)}</option>)}
            </select>
          </div>
        )}
      </div>
      {port.signal === AUDIO_ANALOG && (
        <div className="field">
          <label htmlFor={`${fid}-ph`}>{t('ports.phantom')}</label>
          <select
            id={`${fid}-ph`}
            value={port.phantom ?? ''}
            onChange={(e) => set({ phantom: (e.target.value || undefined) as PortDef['phantom'] })}
          >
            <option value="">{t('phantom.unknown')}</option>
            <option value="required">{t('phantom.required')}</option>
            <option value="supplied">{t('phantom.supplied')}</option>
            <option value="none">{t('phantom.none')}</option>
          </select>
        </div>
      )}
      <Field id={`${fid}-fmt`} label={t('ports.format')} value={port.format} onCommit={(v) => set({ format: v.trim() || undefined })} />
      <div className="port-form-actions">
        <button className="btn btn-danger" onClick={() => removePort(eq.id, port.id)}>
          <Icon name="trash" size={14} />{t('ports.remove')}
        </button>
      </div>
    </div>
  )
}

export function PortEditor({ eq }: { eq: Equipment }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState<string | null>(null)
  const groups: { key: string; title: string; ports: PortDef[] }[] = [
    { key: 'in', title: t('inspector.inputs'), ports: eq.ports.filter((p) => p.direction === 'in') },
    { key: 'out', title: t('inspector.outputs'), ports: eq.ports.filter((p) => p.direction === 'out') },
    { key: 'bidir', title: t('inspector.bidir'), ports: eq.ports.filter((p) => p.direction === 'bidir') },
  ]
  const add = () => {
    const id = useProject.getState().addPort(eq.id, {
      name: t('ports.newName'), direction: 'in', signal: 'audioAnalog', connector: 'xlr3', level: 'line+4',
    })
    setOpen(id)
  }
  return (
    <section className="insp-section">
      {groups.filter((g) => g.ports.length).map((g) => (
        <div key={g.key}>
          <h3 className="group-title">{g.title} <span className="count-chip">{g.ports.length}</span></h3>
          <ul className="port-list editable">
            {g.ports.map((p) => (
              <li key={p.id} className={open === p.id ? 'is-open' : ''}>
                <button className="port-row" onClick={() => setOpen(open === p.id ? null : p.id)} aria-expanded={open === p.id}>
                  <i style={{ background: SIGNAL_STYLE[p.signal].color }} />
                  <span className="pl-name">{p.name}</span>
                  <span className="pl-meta">{connectorLabel(p.connector)}</span>
                  <Icon name="pencil" size={12} />
                </button>
                {open === p.id && <PortForm eq={eq} port={p} />}
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div className="insp-actions">
        <button className="btn" onClick={add}><Icon name="plus" size={14} />{t('ports.add')}</button>
      </div>
    </section>
  )
}
