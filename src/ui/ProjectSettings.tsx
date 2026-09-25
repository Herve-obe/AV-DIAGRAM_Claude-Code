// Réglages du projet : informations du cartouche, zones, format de numérotation, tension secteur.
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SIGNAL_CODE, formatCableLabel } from '../model/numbering'
import { SIGNAL_FAMILIES } from '../model/signals'
import { useProject } from '../store/projectStore'
import { useUi } from '../store/uiStore'
import { Field, toNumber } from './Field'
import { Icon } from './Icon'

export function ProjectSettings() {
  const { t } = useTranslation()
  const open = useUi((s) => s.settingsOpen)
  const close = () => useUi.getState().setSettingsOpen(false)
  const project = useProject((s) => s.project)
  const store = useProject.getState()
  const [newZone, setNewZone] = useState({ name: '', code: '' })
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    dialogRef.current?.querySelector<HTMLElement>('input')?.focus()
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (!open) return null
  const info = project.info ?? {}
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
        <div className="dialog-body">
          <section>
            <h3 className="group-title">{t('settings.info')}</h3>
            <p className="dialog-hint">{t('settings.infoHint')}</p>
            <div className="field-grid">
              <Field id="set-name" label={t('settings.projectName')} value={project.name} onCommit={(v) => v.trim() && store.rename(v.trim())} />
              <Field id="set-client" label={t('settings.client')} value={info.client} onCommit={(v) => store.updateInfo({ client: v.trim() || undefined })} />
              <Field id="set-venue" label={t('settings.venue')} value={info.venue} onCommit={(v) => store.updateInfo({ venue: v.trim() || undefined })} />
              <Field id="set-author" label={t('settings.author')} value={info.author} onCommit={(v) => store.updateInfo({ author: v.trim() || undefined })} />
              <Field id="set-rev" label={t('settings.revision')} value={info.revision} onCommit={(v) => store.updateInfo({ revision: v.trim() || undefined })} />
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
        </div>
      </div>
    </div>
  )
}
