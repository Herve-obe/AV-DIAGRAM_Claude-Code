// Inspecteur : propriétés de l'équipement ou de la liaison sélectionnés.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { connectorLabel } from '../model/connectors'
import { findPort } from '../model/rules'
import { SIGNAL_STYLE } from '../model/signals'
import { templateFromEquipment } from '../model/project'
import type { Equipment, EquipmentFamily, Link, PictogramId, PortDef } from '../model/types'
import { getTemplate, useLibrary } from '../store/libraryStore'
import { useProject } from '../store/projectStore'
import { useIssues } from '../store/useIssues'
import { useUi } from '../store/uiStore'
import { Field, toNumber } from './Field'
import { Icon } from './Icon'
import { Pictogram } from './Pictogram'
import { PortEditor } from './PortEditor'

function PortList({ title, ports }: { title: string; ports: PortDef[] }) {
  const { t } = useTranslation()
  if (!ports.length) return null
  return (
    <section className="insp-section">
      <h3 className="group-title">{title} <span className="count-chip">{ports.length}</span></h3>
      <ul className="port-list">
        {ports.map((p) => (
          <li key={p.id}>
            <i style={{ background: SIGNAL_STYLE[p.signal].color }} />
            <span className="pl-name">{p.name}</span>
            <span className="pl-meta">
              {connectorLabel(p.connector)}
              {p.level && p.level !== 'none' ? ` · ${t(`level.${p.level}`)}` : ''}
              {p.format ? ` · ${p.format}` : ''}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

const FAMILIES: EquipmentFamily[] = [
  'capture', 'console', 'stagebox', 'processing', 'amplification', 'speaker', 'wireless', 'recording', 'camera',
  'videoSwitcher', 'videoRouting', 'display', 'intercom', 'network', 'sync', 'control', 'power', 'passive',
]
const PICTOGRAMS: PictogramId[] = [
  'mic', 'di', 'console', 'stagebox', 'processor', 'amp', 'speaker', 'wireless', 'recorder', 'camera', 'switcher',
  'router', 'display', 'projector', 'intercom', 'switch', 'clock', 'control', 'power', 'patch',
]

/** Provenance des caractéristiques : fiche constructeur (avec ses sources), bloc générique ou modèle perso. */
function SourceNote({ templateId }: { templateId: string }) {
  const { t } = useTranslation()
  const tpl = getTemplate(templateId)
  if (tpl?.status === 'verified' || tpl?.status === 'community') {
    return (
      <div className="source-note">
        <span className={`tag tag-${tpl.status}`}>{t(`library.status.${tpl.status}`)}</span>
        <ul>
          {tpl.sources?.map((s, i) => (
            <li key={i}>{s.document ?? s.url} <span className="dim">({s.accessed})</span></li>
          ))}
        </ul>
      </div>
    )
  }
  return <p className="source-note">{t('inspector.source')} : {tpl?.status === 'user' ? t('inspector.userSource') : t('inspector.genericSource')}</p>
}

function EquipmentInspector({ eq }: { eq: Equipment }) {
  const { t } = useTranslation()
  const zones = useProject((s) => s.project.zones)
  const { updateEquipment, duplicate, remove } = useProject.getState()
  const expert = useUi((s) => s.mode) === 'expert'
  const [savedTpl, setSavedTpl] = useState(false)
  const set = (patch: Partial<Equipment>) => updateEquipment(eq.id, patch)
  const saveAsTemplate = () => {
    useLibrary.getState().addUserTemplate(templateFromEquipment(eq))
    setSavedTpl(true)
  }
  return (
    <>
      <div className="insp-head">
        <span className="insp-pict"><Pictogram id={eq.pictogram} size={20} /></span>
        <div>
          <div className="insp-kind">{t('inspector.equipment')}</div>
          <div className="insp-title">{eq.name}</div>
        </div>
      </div>
      <Field id="eq-name" label={t('inspector.name')} value={eq.name} onCommit={(v) => set({ name: v.trim() || eq.name })} />
      <div className="field">
        <label>{t('inspector.model')}</label>
        <div className="readonly">{eq.manufacturer ? `${eq.manufacturer} ${eq.model}` : eq.model}</div>
      </div>
      <div className="field">
        <label htmlFor="eq-zone">{t('inspector.zone')}</label>
        <select id="eq-zone" value={eq.zoneId ?? ''} onChange={(e) => set({ zoneId: e.target.value || undefined })}>
          <option value="">{t('inspector.noZone')}</option>
          {zones.map((z) => <option key={z.id} value={z.id}>{z.name} ({z.code})</option>)}
        </select>
      </div>
      {expert && (
        <div className="field-row">
          <div className="field">
            <label htmlFor="eq-family">{t('inspector.family')}</label>
            <select id="eq-family" value={eq.family} onChange={(e) => set({ family: e.target.value as EquipmentFamily })}>
              {FAMILIES.map((f) => <option key={f} value={f}>{t(`family.${f}`)}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="eq-pict">{t('inspector.pictogram')}</label>
            <select id="eq-pict" value={eq.pictogram} onChange={(e) => set({ pictogram: e.target.value as PictogramId })}>
              {PICTOGRAMS.map((p) => <option key={p} value={p}>{t(`pictogram.${p}`)}</option>)}
            </select>
          </div>
        </div>
      )}
      {expert && (
        <div className="field-row">
          <Field id="eq-power" type="number" label={t('inspector.power')} value={eq.powerW} onCommit={(v) => set({ powerW: toNumber(v) })} />
          <Field id="eq-weight" type="number" label={t('inspector.weight')} value={eq.weightKg} onCommit={(v) => set({ weightKg: toNumber(v) })} />
        </div>
      )}
      {expert && <Field id="eq-notes" label={t('inspector.notes')} value={eq.notes} multiline onCommit={(v) => set({ notes: v || undefined })} />}
      {expert ? (
        <PortEditor eq={eq} />
      ) : (
        <>
          <PortList title={t('inspector.inputs')} ports={eq.ports.filter((p) => p.direction === 'in')} />
          <PortList title={t('inspector.outputs')} ports={eq.ports.filter((p) => p.direction === 'out')} />
          <PortList title={t('inspector.bidir')} ports={eq.ports.filter((p) => p.direction === 'bidir')} />
        </>
      )}
      {expert && <SourceNote templateId={eq.templateId} />}
      <div className="insp-actions wrap">
        <button className="btn" onClick={() => useUi.getState().select(duplicate([eq.id]), [])}><Icon name="copy" size={14} />{t('inspector.duplicate')}</button>
        {expert && (
          <button className="btn" onClick={saveAsTemplate} disabled={savedTpl || eq.ports.length === 0} title={t('inspector.saveTemplateHint')}>
            <Icon name={savedTpl ? 'check' : 'bookmark'} size={14} />{savedTpl ? t('inspector.templateSaved') : t('inspector.saveTemplate')}
          </button>
        )}
        <button className="btn btn-danger" onClick={() => remove([eq.id], [])}><Icon name="trash" size={14} />{t('inspector.delete')}</button>
      </div>
    </>
  )
}

function LinkInspector({ link }: { link: Link }) {
  const { t } = useTranslation()
  const project = useProject((s) => s.project)
  const { updateLink, remove } = useProject.getState()
  const expert = useUi((s) => s.mode) === 'expert'
  const issues = useIssues().filter((i) => i.linkId === link.id)
  const sp = findPort(project, link.source)
  const tp = findPort(project, link.target)
  const se = project.equipment[link.source.equipmentId]
  const te = project.equipment[link.target.equipmentId]
  if (!sp || !tp || !se || !te) return null
  return (
    <>
      <div className="insp-head">
        <span className="insp-swatch" style={{ background: SIGNAL_STYLE[sp.signal].color }} />
        <div>
          <div className="insp-kind">{t('inspector.link')}</div>
          <div className="insp-title mono">{link.label}</div>
        </div>
      </div>
      <div className="field"><label>{t('inspector.signal')}</label><div className="readonly">{t(`signal.${sp.signal}`)}{sp.format ? ` · ${sp.format}` : ''}</div></div>
      <div className="field"><label>{t('inspector.from')}</label><div className="readonly">{se.name} / {sp.name}</div></div>
      <div className="field"><label>{t('inspector.to')}</label><div className="readonly">{te.name} / {tp.name}</div></div>
      <div className="field"><label>{t('inspector.connectors')}</label><div className="readonly mono">{connectorLabel(sp.connector)} → {connectorLabel(tp.connector)}</div></div>
      <Field id="lk-length" type="number" label={t('inspector.length')} value={link.lengthM} onCommit={(v) => updateLink(link.id, { lengthM: toNumber(v) })} />
      {expert && <Field id="lk-ref" label={t('inspector.cableRef')} value={link.cableRef} onCommit={(v) => updateLink(link.id, { cableRef: v || undefined })} />}
      {expert && <Field id="lk-notes" label={t('inspector.notes')} value={link.notes} multiline onCommit={(v) => updateLink(link.id, { notes: v || undefined })} />}
      <section className="insp-section">
        <h3 className="group-title">{t('inspector.checks')}</h3>
        {issues.length === 0 && <p className="check ok"><Icon name="check" size={14} />{t('inspector.compatible')}</p>}
        {issues.map((i) => (
          <div key={i.code} className={`check sev-${i.severity}`}>
            <div className="check-head">
              <span className="sev-pill">{t(`severity.${i.severity}`)}</span>
              {expert && (
                <button className="link-btn" onClick={() => updateLink(link.id, { ignoredRules: [...(link.ignoredRules ?? []), i.code] })}>
                  {t('inspector.ignore')}
                </button>
              )}
            </div>
            <p>{t(`rules.${i.code}.msg`, translateParams(i.params, t))}</p>
            <p className="check-fix">{t(`rules.${i.code}.fix`)}</p>
          </div>
        ))}
      </section>
      <div className="insp-actions">
        <button className="btn btn-danger" onClick={() => remove([], [link.id])}><Icon name="trash" size={14} />{t('inspector.delete')}</button>
      </div>
    </>
  )
}

/** Traduit les paramètres des messages : familles de signal et connecteurs. */
export function translateParams(params: Record<string, string>, t: (k: string) => string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(params)) {
    out[k] = v in SIGNAL_STYLE ? t(`signal.${v}`) : connectorLabel(v)
  }
  return out
}

export function Inspector() {
  const { t } = useTranslation()
  const { selectedEquipment, selectedLinks } = useUi()
  const project = useProject((s) => s.project)
  const count = selectedEquipment.length + selectedLinks.length
  const eq = selectedEquipment.length === 1 && selectedLinks.length === 0 ? project.equipment[selectedEquipment[0]] : undefined
  const link = selectedLinks.length === 1 && selectedEquipment.length === 0 ? project.links[selectedLinks[0]] : undefined

  return (
    <aside className="panel inspector" aria-label={t('inspector.title')}>
      <div className="panel-title">{t('inspector.title')}</div>
      <div className="insp-body">
        {eq && <EquipmentInspector key={eq.id} eq={eq} />}
        {link && <LinkInspector key={link.id} link={link} />}
        {!eq && !link && <p className="empty">{count > 1 ? t('inspector.multi', { count }) : t('inspector.empty')}</p>}
      </div>
    </aside>
  )
}
