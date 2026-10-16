// Paramètres : projet (nom, zones, numérotation, tension secteur), cartouche du projet, mise en page et
// export (format, filigrane, protection), modèle de cartouche et dossier d'enregistrement du poste.
import { useEffect, useRef, useState } from 'react'
import { exportSettingsOf } from '../io/exportOptions'
import type { ExportSettings, ProjectInfo } from '../model/types'
import { useTitleBlock } from '../store/titleBlockStore'
import { FormatPicker, ProtectionEditor, TemplateEditor, TitleBlockFields, WatermarkEditor, infoWithTemplate } from './ExportControls'
import { useTranslation } from 'react-i18next'
import { SIGNAL_CODE, formatCableLabel } from '../model/numbering'
import { SIGNAL_FAMILIES } from '../model/signals'
import { useProject } from '../store/projectStore'
import { useUi } from '../store/uiStore'
import { Field, toNumber } from './Field'
import { Icon } from './Icon'
import { SaveFolderSettings } from './SaveFolderSettings'

export function ProjectSettings() {
  const { t } = useTranslation()
  const open = useUi((s) => s.settingsOpen)
  const project = useProject((s) => s.project)
  const store = useProject.getState()
  const [newZone, setNewZone] = useState({ name: '', code: '' })
  const [tab, setTab] = useState<'project' | 'titleBlock' | 'export' | 'template' | 'storage'>('project')
  // Brouillons du cartouche et des réglages d'export : enregistrés en un seul pas d'annulation
  // quand on change d'onglet ou qu'on ferme
  const [infoDraft, setInfoDraft] = useState<ProjectInfo | null>(null)
  const [exportDraft, setExportDraft] = useState<ExportSettings | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  // Références : la touche Échap (écouteur posé à l'ouverture) doit voir les derniers brouillons
  const drafts = useRef({ info: infoDraft, export: exportDraft })
  drafts.current = { info: infoDraft, export: exportDraft }
  const flush = () => {
    const s = useProject.getState()
    const { info: i, export: x } = drafts.current
    if (i && JSON.stringify(i) !== JSON.stringify(s.project.info ?? {})) s.updateInfo(i)
    if (x && JSON.stringify(x) !== JSON.stringify(s.project.settings.export)) s.updateSettings({ export: x })
    setInfoDraft(null)
    setExportDraft(null)
  }
  const close = () => {
    flush()
    useUi.getState().setSettingsOpen(false)
  }
  const goTo = (next: typeof tab) => {
    flush()
    setTab(next)
  }

  const closeRef = useRef(close)
  closeRef.current = close
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current()
    window.addEventListener('keydown', onKey)
    dialogRef.current?.querySelector<HTMLElement>('input')?.focus()
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (!open) return null
  const infoValue = infoDraft ?? infoWithTemplate(project.info, useTitleBlock.getState().template)
  const exportValue = exportDraft ?? exportSettingsOf(project)
  const preview = formatCableLabel(project.settings.cableFormat, { zone: project.zones[0]?.code ?? 'FOH', signal: 'audioAnalog', num: 12 }, project.settings.typeCodes)
  const addZone = () => {
    if (!newZone.name.trim() || !newZone.code.trim()) return
    store.addZone(newZone.name.trim(), newZone.code)
    setNewZone({ name: '', code: '' })
  }

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="settings-title" ref={dialogRef}>
        <header className="dialog-head">
          <h2 id="settings-title">{t('settings.title')}</h2>
          <button className="icon-btn" onClick={close} aria-label={t('settings.close')}><Icon name="close" /></button>
        </header>
        <div className="segmented export-tabs" role="tablist">
          {(['project', 'titleBlock', 'export', 'template', 'storage'] as const).map((k) => (
            <button key={k} role="tab" aria-selected={tab === k} aria-pressed={tab === k} onClick={() => goTo(k)}>{t(`settings.tabs.${k}`)}</button>
          ))}
        </div>
        {tab === 'titleBlock' && (
          <div className="dialog-body">
            <section>
              <p className="dialog-hint">{t('settings.titleBlockHint')}</p>
              <TitleBlockFields value={infoValue} onChange={setInfoDraft} />
            </section>
          </div>
        )}
        {tab === 'export' && (
          <div className="dialog-body">
            <section>
              <h3 className="group-title">{t('exportPdf.tabs.layout')}</h3>
              <FormatPicker project={project} value={exportValue} onChange={setExportDraft} />
            </section>
            <section>
              <h3 className="group-title">{t('exportPdf.tabs.watermark')}</h3>
              <WatermarkEditor project={project} value={exportValue.watermark} onChange={(watermark) => setExportDraft({ ...exportValue, watermark })} />
            </section>
            <section>
              <h3 className="group-title">{t('exportPdf.tabs.protection')}</h3>
              <ProtectionEditor value={exportValue.protection} onChange={(protection) => setExportDraft({ ...exportValue, protection })} />
            </section>
          </div>
        )}
        {tab === 'storage' && (
          <div className="dialog-body">
            <section><SaveFolderSettings /></section>
          </div>
        )}
        {tab === 'template' && (
          <div className="dialog-body">
            <section><TemplateEditor /></section>
          </div>
        )}
        {tab === 'project' && <div className="dialog-body">
          <section>
            <h3 className="group-title">{t('settings.info')}</h3>
            <div className="field-grid">
              <Field id="set-name" label={t('settings.projectName')} value={project.name} onCommit={(v) => v.trim() && store.rename(v.trim())} />
            </div>
          </section>

          <section>
            <h3 className="group-title">{t('settings.zones')}</h3>
            <p className="dialog-hint">{t('settings.zonesHint')}</p>
            <table className="zone-table">
              <thead>
                <tr><th>{t('settings.zoneName')}</th><th>{t('settings.zoneCode')}</th><th className="num">{t('settings.zoneCount')}</th><th /></tr>
              </thead>
              <tbody>
                {project.zones.map((z) => {
                  const count = Object.values(project.equipment).filter((e) => e.zoneId === z.id).length
                  return (
                    <tr key={z.id}>
                      <td><input key={`n-${z.name}`} aria-label={t('settings.zoneName')} defaultValue={z.name} onBlur={(e) => e.target.value.trim() && e.target.value !== z.name && store.updateZone(z.id, { name: e.target.value.trim() })} /></td>
                      <td><input key={`c-${z.code}`} aria-label={t('settings.zoneCode')} className="mono" defaultValue={z.code} maxLength={6} onBlur={(e) => e.target.value !== z.code && store.updateZone(z.id, { code: e.target.value })} /></td>
                      <td className="num mono">{count}</td>
                      <td className="num">
                        <button className="icon-btn small" onClick={() => store.removeZone(z.id)} title={t('settings.removeZone')} aria-label={t('settings.removeZone')}>
                          <Icon name="trash" size={13} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
                <tr>
                  <td><input id="new-zone-name" placeholder={t('settings.newZoneName')} value={newZone.name} onChange={(e) => setNewZone({ ...newZone, name: e.target.value })} /></td>
                  <td><input id="new-zone-code" className="mono" placeholder="PLT" maxLength={6} value={newZone.code} onChange={(e) => setNewZone({ ...newZone, code: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && addZone()} /></td>
                  <td />
                  <td className="num"><button className="btn" onClick={addZone}><Icon name="plus" size={13} />{t('settings.addZone')}</button></td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h3 className="group-title">{t('settings.numbering')}</h3>
            <div className="field-grid">
              <Field id="set-format" label={t('settings.cableFormat')} value={project.settings.cableFormat} onCommit={(v) => v.trim() && store.updateSettings({ cableFormat: v.trim() })} />
              <Field id="set-default-zone" label={t('settings.defaultZone')} value={project.settings.defaultZoneCode} onCommit={(v) => v.trim() && store.updateSettings({ defaultZoneCode: v.trim().toUpperCase() })} />
            </div>
            <p className="dialog-hint">{t('settings.formatHint')} <span className="mono">{preview}</span></p>
            <h4 className="subgroup-title">{t('settings.typeCodes')}</h4>
            <div className="field-grid code-grid">
              {SIGNAL_FAMILIES.map((f) => (
                <Field
                  key={f}
                  id={`set-code-${f}`}
                  label={t(`signal.${f}`)}
                  value={project.settings.typeCodes?.[f] ?? SIGNAL_CODE[f]}
                  onCommit={(v) => {
                    const code = v.trim().toUpperCase()
                    const typeCodes = { ...project.settings.typeCodes }
                    if (!code || code === SIGNAL_CODE[f]) delete typeCodes[f]
                    else typeCodes[f] = code
                    store.updateSettings({ typeCodes })
                  }}
                />
              ))}
            </div>
          </section>

          <section>
            <h3 className="group-title">{t('settings.power')}</h3>
            <div className="field-grid">
              <Field id="set-voltage" type="number" label={t('settings.voltage')} value={project.settings.mainsVoltage} onCommit={(v) => { const n = toNumber(v); if (n) store.updateSettings({ mainsVoltage: n }) }} />
            </div>
          </section>
        </div>}
      </div>
    </div>
  )
}
