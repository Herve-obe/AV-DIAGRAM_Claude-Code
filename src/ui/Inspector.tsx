// Inspecteur : propriétés de l'équipement ou de la liaison sélectionnés.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CABLE_CATALOG, cablesFor, getCable, type CableType } from '../model/cables'
import { connectorLabel } from '../model/connectors'
import { findPort } from '../model/rules'
import { SIGNAL_STYLE } from '../model/signals'
import { groupInterface, isGroupNodeId, isInside, sheetIdOfGroupNode } from '../model/groups'
import { DEFAULT_SHEET_ID, firstFreePair, multicoreUsage, templateFromEquipment } from '../model/project'
import type { Annotation, Equipment, EquipmentFamily, Link, PictogramId, PortDef } from '../model/types'
import { getTemplate, useLibrary } from '../store/libraryStore'
import { useProject } from '../store/projectStore'
import { useIssues } from '../store/useIssues'
import { useUi } from '../store/uiStore'
import { Field, toNumber } from './Field'
import { groupSelected, ungroupSelected } from './groupActions'
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
  'luminaire', 'lightingControl', 'dmxDistribution',
]
const PICTOGRAMS: PictogramId[] = [
  'mic', 'di', 'console', 'stagebox', 'processor', 'amp', 'speaker', 'wireless', 'recorder', 'camera', 'switcher',
  'router', 'display', 'projector', 'intercom', 'switch', 'clock', 'control', 'power', 'patch', 'light',
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
  const sheets = useProject((s) => s.project.sheets ?? [])
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
      {sheets.length > 1 && (
        <div className="field">
          <label htmlFor="eq-sheet">{t('sheets.sheet')}</label>
          <select
            id="eq-sheet"
            value={eq.sheetId ?? sheets[0].id}
            onChange={(e) => { useProject.getState().moveToSheet([eq.id], e.target.value); useUi.getState().setSheet(e.target.value) }}
          >
            {sheets.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      )}
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
  const cable = getCable(link.cableTypeId)
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
      {((sp.channels ?? 1) > 1 || (tp.channels ?? 1) > 1) && (
        <>
          <Field id="lk-channels" type="number" label={t('inspector.channels')} value={link.channels} onCommit={(v) => updateLink(link.id, { channels: toNumber(v) ? Math.round(toNumber(v)!) : undefined })} />
          <p className="field-hint">{t('inspector.channelsHint', { max: Math.min(sp.channels ?? Infinity, tp.channels ?? Infinity) })}</p>
        </>
      )}
      <MulticorePicker link={link} />
      {!link.multicoreId && <CablePicker link={link} from={sp.connector} to={tp.connector} />}
      <Field id="lk-length" type="number" label={t('inspector.length')} value={link.lengthM} onCommit={(v) => updateLink(link.id, { lengthM: toNumber(v) })} />
      {cable?.lengthsM && (
        <div className="chips" role="group" aria-label={t('inspector.stockLengths')}>
          {cable.lengthsM.map((m) => (
            <button key={m} className="chip" aria-pressed={link.lengthM === m} onClick={() => updateLink(link.id, { lengthM: m })}>{m} m</button>
          ))}
        </div>
      )}
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

/** Affectation de la liaison à une paire d'un multipaire. */
function MulticorePicker({ link }: { link: Link }) {
  const { t } = useTranslation()
  const project = useProject((s) => s.project)
  const { updateLink, addMulticore } = useProject.getState()
  const multicores = Object.values(project.multicores ?? {}).sort((a, b) => a.label.localeCompare(b.label))
  const mc = link.multicoreId ? project.multicores?.[link.multicoreId] : undefined
  const usage = mc ? multicoreUsage(project, mc.id) : new Map<number, string[]>()
  const choose = (value: string) => {
    if (value === '__new') {
      const id = addMulticore()
      const p = useProject.getState().project
      updateLink(link.id, { multicoreId: id, pair: firstFreePair(p, id) })
    } else if (!value) updateLink(link.id, { multicoreId: undefined, pair: undefined })
    else updateLink(link.id, { multicoreId: value, pair: firstFreePair(project, value) })
  }
  return (
    <>
      <div className="field">
        <label htmlFor="lk-mc">{t('inspector.multicore')}</label>
        <select id="lk-mc" value={link.multicoreId ?? ''} onChange={(e) => choose(e.target.value)}>
          <option value="">{t('inspector.multicoreNone')}</option>
          {multicores.map((m) => <option key={m.id} value={m.id}>{m.label} ({m.pairs})</option>)}
          <option value="__new">+ {t('inspector.multicoreNew')}</option>
        </select>
      </div>
      {mc && (
        <div className="field">
          <label htmlFor="lk-pair">{t('inspector.pair')}</label>
          <select id="lk-pair" value={link.pair ?? ''} onChange={(e) => updateLink(link.id, { pair: e.target.value ? Number(e.target.value) : undefined })}>
            <option value="">-</option>
            {Array.from({ length: mc.pairs }, (_, i) => i + 1).map((n) => {
              const others = (usage.get(n) ?? []).filter((id) => id !== link.id)
              return <option key={n} value={n}>{n}{others.length ? ` (${t('inspector.pairUsed')} : ${project.links[others[0]]?.label})` : ''}</option>
            })}
          </select>
        </div>
      )}
    </>
  )
}

/** Choix du câble du catalogue : les câbles compatibles avec les deux connecteurs sont proposés en premier. */
function CablePicker({ link, from, to }: { link: Link; from: string; to: string }) {
  const { t } = useTranslation()
  const fitting = cablesFor(from, to)
  const others = CABLE_CATALOG.filter((c) => !fitting.includes(c))
  const label = (c: CableType) => (c.reference ? `${c.label} (${c.reference})` : c.label)
  return (
    <div className="field">
      <label htmlFor="lk-cable">{t('inspector.cable')}</label>
      <select id="lk-cable" value={link.cableTypeId ?? ''} onChange={(e) => useProject.getState().updateLink(link.id, { cableTypeId: e.target.value || undefined })}>
        <option value="">{t('inspector.cableNone')}</option>
        {fitting.length > 0 && <optgroup label={t('inspector.cableFitting')}>{fitting.map((c) => <option key={c.id} value={c.id}>{label(c)}</option>)}</optgroup>}
        <optgroup label={t('inspector.cableOthers')}>{others.map((c) => <option key={c.id} value={c.id}>{label(c)}</option>)}</optgroup>
      </select>
    </div>
  )
}

const ANNOTATION_COLORS = [
  'var(--sig-audio-analog)', 'var(--sig-audio-digital)', 'var(--sig-audio-ip)', 'var(--sig-video)',
  'var(--sig-sync)', 'var(--sig-intercom)', 'var(--sig-network)', 'var(--sig-power)', 'var(--text-3)',
]

function AnnotationInspector({ a }: { a: Annotation }) {
  const { t } = useTranslation()
  const { updateAnnotation, remove } = useProject.getState()
  return (
    <>
      <div className="insp-head">
        <span className="insp-pict"><Icon name={a.kind === 'frame' ? 'frame' : 'note'} size={20} /></span>
        <div>
          <div className="insp-kind">{t(`annotations.${a.kind}`)}</div>
          <div className="insp-title">{a.text.split('\n')[0] || '-'}</div>
        </div>
      </div>
      <Field id="an-text" label={t('annotations.text')} value={a.text} multiline onCommit={(v) => updateAnnotation(a.id, { text: v })} />
      <div className="field">
        <label>{t('annotations.color')}</label>
        <div className="swatches" role="radiogroup" aria-label={t('annotations.color')}>
          {ANNOTATION_COLORS.map((c) => (
            <button
              key={c}
              role="radio"
              aria-checked={(a.color ?? 'var(--accent)') === c}
              className="swatch-btn"
              style={{ background: c }}
              onClick={() => updateAnnotation(a.id, { color: c })}
              aria-label={c}
            />
          ))}
        </div>
      </div>
      <p className="source-note">{t('annotations.hint')}</p>
      <div className="insp-actions">
        <button className="btn btn-danger" onClick={() => remove([a.id], [])}><Icon name="trash" size={14} />{t('inspector.delete')}</button>
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

/** Sous-schéma replié : nom, contenu, ouverture et dissolution. */
function GroupInspector({ sheetId }: { sheetId: string }) {
  const { t } = useTranslation()
  const project = useProject((s) => s.project)
  const sheet = project.sheets?.find((sh) => sh.id === sheetId)
  if (!sheet) return null
  const count = Object.values(project.equipment).filter((e) => isInside(project, e.sheetId ?? DEFAULT_SHEET_ID, sheetId)).length
  const ports = groupInterface(project, sheetId)
  return (
    <>
      <div className="insp-head">
        <span className="insp-swatch" style={{ background: 'var(--accent)' }} />
        <div>
          <div className="insp-kind">{t('groups.kind')}</div>
          <div className="insp-title">{sheet.name}</div>
        </div>
      </div>
      <Field id="grp-name" label={t('groups.name')} value={sheet.name} onCommit={(v) => v.trim() && useProject.getState().renameSheet(sheetId, v.trim())} />
      <div className="field"><label>{t('groups.contents')}</label><div className="readonly">{t('groups.summary', { count })} · {t('groups.interface', { count: ports.length })}</div></div>
      <div className="insp-actions">
        <button className="btn" onClick={() => useUi.getState().setSheet(sheetId)}><Icon name="select" size={14} />{t('groups.open')}</button>
        <button className="btn" onClick={ungroupSelected} title="Ctrl+Maj+G"><Icon name="close" size={14} />{t('groups.ungroup')}</button>
      </div>
    </>
  )
}

export function Inspector() {
  const { t } = useTranslation()
  const { selectedEquipment, selectedLinks } = useUi()
  const project = useProject((s) => s.project)
  const count = selectedEquipment.length + selectedLinks.length
  const eq = selectedEquipment.length === 1 && selectedLinks.length === 0 ? project.equipment[selectedEquipment[0]] : undefined
  const link = selectedLinks.length === 1 && selectedEquipment.length === 0 ? project.links[selectedLinks[0]] : undefined
  const annotation = selectedEquipment.length === 1 && selectedLinks.length === 0 ? project.annotations?.[selectedEquipment[0]] : undefined
  const groupSheet = selectedEquipment.length === 1 && selectedLinks.length === 0 && isGroupNodeId(selectedEquipment[0])
    ? project.sheets?.find((sh) => sh.id === sheetIdOfGroupNode(selectedEquipment[0]))
    : undefined
  const canGroup = selectedEquipment.some((id) => project.equipment[id])

  return (
    <aside className="panel inspector" aria-label={t('inspector.title')}>
      <div className="panel-title">{t('inspector.title')}</div>
      <div className="insp-body">
        {eq && <EquipmentInspector key={eq.id} eq={eq} />}
        {link && <LinkInspector key={link.id} link={link} />}
        {annotation && <AnnotationInspector key={annotation.id} a={annotation} />}
        {groupSheet && <GroupInspector key={groupSheet.id} sheetId={groupSheet.id} />}
        {!eq && !link && !annotation && !groupSheet && <p className="empty">{count > 1 ? t('inspector.multi', { count }) : t('inspector.empty')}</p>}
        {count > 1 && canGroup && (
          <div className="insp-actions">
            <button className="btn" onClick={groupSelected} title="Ctrl+G"><Icon name="frame" size={14} />{t('groups.group')}</button>
          </div>
        )}
      </div>
    </aside>
  )
}
