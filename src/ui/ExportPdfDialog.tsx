// Export PDF : l'utilisateur remplit d'abord le cartouche (pré-rempli par le projet et le modèle du
// poste), puis vérifie la mise en page, le filigrane et la protection. Les champs et réglages sont
// gardés dans le projet ; les mots de passe ne sont jamais enregistrés.
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useReactFlow } from '@xyflow/react'
import { isTauri } from '@tauri-apps/api/core'
import { create } from 'zustand'
import { exportPdfWithLabels } from '../io/exportPdfUi'
import { exportSettingsOf, watermarkText } from '../io/exportOptions'
import type { ExportSettings, ProjectInfo } from '../model/types'
import { useProject } from '../store/projectStore'
import { useTitleBlock } from '../store/titleBlockStore'
import { FormatPicker, ProtectionEditor, TitleBlockFields, WatermarkEditor, infoWithTemplate } from './ExportControls'
import { Icon } from './Icon'

export const useExportPdf = create<{ open: boolean; setOpen: (open: boolean) => void }>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}))

type Tab = 'titleBlock' | 'layout' | 'watermark' | 'protection'
const TABS: Tab[] = ['titleBlock', 'layout', 'watermark', 'protection']

export function ExportPdfDialog() {
  const { t } = useTranslation()
  const open = useExportPdf((s) => s.open)
  const project = useProject((s) => s.project)
  const template = useTitleBlock((s) => s.template)
  const rf = useReactFlow()
  const [tab, setTab] = useState<Tab>('titleBlock')
  const [opts, setOpts] = useState<ExportSettings>(() => exportSettingsOf(project))
  const [info, setInfo] = useState<ProjectInfo>({})
  const [passwords, setPasswords] = useState({ open: '', owner: '' })
  const [busy, setBusy] = useState(false)
  const close = () => useExportPdf.getState().setOpen(false)

  // À chaque ouverture : réglages et cartouche du projet, complétés par le modèle du poste
  useEffect(() => {
    if (!open) return
    const p = useProject.getState().project
    setOpts(exportSettingsOf(p))
    setInfo(infoWithTemplate(p.info, useTitleBlock.getState().template))
    setPasswords({ open: '', owner: '' })
    setTab('titleBlock')
  }, [open])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && useExportPdf.getState().setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (!open) return null
  const mark = watermarkText(opts.watermark.text, { ...project, info })
  const protectUnavailable = opts.protection.enabled && !isTauri()
  const passwordMismatch = !!passwords.open && passwords.open === passwords.owner

  const run = async () => {
    setBusy(true)
    const store = useProject.getState()
    if (JSON.stringify(store.project.settings.export) !== JSON.stringify(opts)) store.updateSettings({ export: opts })
    if (JSON.stringify(store.project.info ?? {}) !== JSON.stringify(info)) store.updateInfo(info)
    close()
    try {
      await exportPdfWithLabels(rf, t, info, opts.protection.enabled ? passwords : undefined)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="dialog export-dialog" role="dialog" aria-modal="true" aria-labelledby="export-title">
        <header className="dialog-head">
          <h2 id="export-title">{t('exportPdf.title')}</h2>
          <button className="icon-btn" onClick={close} aria-label={t('settings.close')}><Icon name="close" /></button>
        </header>
        <div className="segmented export-tabs" role="tablist">
          {TABS.map((k) => (
            <button key={k} role="tab" aria-selected={tab === k} aria-pressed={tab === k} onClick={() => setTab(k)}>{t(`exportPdf.tabs.${k}`)}</button>
          ))}
        </div>
        <div className="dialog-body">
          {tab === 'titleBlock' && (
            <section>
              <p className="dialog-hint">{t('exportPdf.titleBlockHint')}</p>
              {!template.owner && !template.logo && <p className="dialog-hint ev-default">{t('exportPdf.noTemplate')}</p>}
              <TitleBlockFields value={info} onChange={setInfo} />
            </section>
          )}
          {tab === 'layout' && <section><FormatPicker project={project} value={opts} onChange={setOpts} /></section>}
          {tab === 'watermark' && (
            <section><WatermarkEditor project={{ ...project, info }} value={opts.watermark} onChange={(watermark) => setOpts({ ...opts, watermark })} /></section>
          )}
          {tab === 'protection' && (
            <section>
              <ProtectionEditor
                value={opts.protection}
                onChange={(protection) => setOpts({ ...opts, protection })}
                passwords={passwords}
                onPasswords={setPasswords}
              />
              {protectUnavailable && <p className="collab-error">{t('exportPdf.protectDesktopOnly')}</p>}
              {passwordMismatch && <p className="collab-error">{t('exportPdf.samePasswords')}</p>}
            </section>
          )}
        </div>
        <footer className="dialog-foot export-foot">
          <span className="dialog-hint">
            {t('exportPdf.summary', {
              paper: opts.paper,
              orientation: t(`exportPdf.${opts.orientation}`),
              mode: t(`exportPdf.mode.${opts.scaleMode}`),
            })}
            {opts.watermark.enabled && mark ? ` · ${t('exportPdf.withWatermark')}` : ''}
            {opts.protection.enabled ? ` · ${t(passwords.open ? 'exportPdf.withPassword' : 'exportPdf.withRights')}` : ''}
          </span>
          <button className="btn btn-ghost" onClick={close}>{t('pdfImport.cancel')}</button>
          <button className="btn btn-primary" disabled={busy || (opts.watermark.enabled && !mark) || protectUnavailable || passwordMismatch} onClick={run}>
            <Icon name="download" size={14} />{t('exportPdf.export')}
          </button>
        </footer>
      </div>
    </div>
  )
}
