// Export PDF : format (A4 à A0), orientation, filigrane et protection. Les réglages sont gardés avec le
// projet (fichier .avd) au moment de l'export, pour retrouver les mêmes à l'export suivant.
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useReactFlow } from '@xyflow/react'
import { create } from 'zustand'
import { exportPdfWithLabels } from '../io/exportPdfUi'
import { exportSettingsOf, pageSize, watermarkText } from '../io/exportOptions'
import { PAPER_SIZES, type ExportSettings } from '../model/types'
import { useProject } from '../store/projectStore'
import { Icon } from './Icon'

export const useExportPdf = create<{ open: boolean; setOpen: (open: boolean) => void }>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}))

export function ExportPdfDialog() {
  const { t } = useTranslation()
  const open = useExportPdf((s) => s.open)
  const project = useProject((s) => s.project)
  const rf = useReactFlow()
  const [opts, setOpts] = useState<ExportSettings>(() => exportSettingsOf(project))
  const [busy, setBusy] = useState(false)
  const close = () => useExportPdf.getState().setOpen(false)

  // Réglages du projet à chaque ouverture
  useEffect(() => {
    if (open) setOpts(exportSettingsOf(useProject.getState().project))
  }, [open])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && useExportPdf.getState().setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (!open) return null
  const size = pageSize(opts.paper, opts.orientation)
  const mark = watermarkText(opts.watermark.text, project)
  const setMark = (patch: Partial<ExportSettings['watermark']>) => setOpts((o) => ({ ...o, watermark: { ...o.watermark, ...patch } }))

  const run = async () => {
    setBusy(true)
    const p = useProject.getState().project
    if (JSON.stringify(p.settings.export) !== JSON.stringify(opts)) useProject.getState().updateSettings({ export: opts })
    close()
    try {
      await exportPdfWithLabels(rf, t)
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
        <div className="dialog-body">
          <section>
            <h3 className="group-title">{t('exportPdf.format')}</h3>
            <div className="export-row">
              <div className="segmented" role="radiogroup" aria-label={t('exportPdf.format')}>
                {PAPER_SIZES.map((p) => (
                  <button key={p} role="radio" aria-checked={opts.paper === p} aria-pressed={opts.paper === p} onClick={() => setOpts((o) => ({ ...o, paper: p }))}>{p}</button>
                ))}
              </div>
              <div className="segmented" role="radiogroup" aria-label={t('exportPdf.orientation')}>
                {(['landscape', 'portrait'] as const).map((o) => (
                  <button key={o} role="radio" aria-checked={opts.orientation === o} aria-pressed={opts.orientation === o} onClick={() => setOpts((x) => ({ ...x, orientation: o }))}>
                    {t(`exportPdf.${o}`)}
                  </button>
                ))}
              </div>
            </div>
            <p className="dialog-hint">{t('exportPdf.size', { w: size.w, h: size.h })}</p>
          </section>

          <section>
            <h3 className="group-title">{t('exportPdf.watermark')}</h3>
            <label className="collab-check">
              <input type="checkbox" checked={opts.watermark.enabled} onChange={(e) => setMark({ enabled: e.target.checked })} />
              <span>{t('exportPdf.watermarkEnable')}</span>
            </label>
            {opts.watermark.enabled && (
              <>
                <div className="field">
                  <label htmlFor="wm-text">{t('exportPdf.watermarkText')}</label>
                  <input id="wm-text" value={opts.watermark.text} maxLength={120} onChange={(e) => setMark({ text: e.target.value })} />
                </div>
                <p className="field-hint">{t('exportPdf.watermarkFields')}</p>
                <div className="field">
                  <label htmlFor="wm-opacity">{t('exportPdf.opacity', { value: Math.round(opts.watermark.opacity * 100) })}</label>
                  <input
                    id="wm-opacity" type="range" min={0.05} max={0.5} step={0.01} value={opts.watermark.opacity}
                    onChange={(e) => setMark({ opacity: Number(e.target.value) })}
                  />
                </div>
                <div className="wm-preview" aria-label={t('exportPdf.preview')}>
                  <span style={{ opacity: Math.min(1, opts.watermark.opacity * 3) }}>{mark || t('exportPdf.emptyMark')}</span>
                </div>
                <p className="dialog-hint">{t('exportPdf.watermarkHint')}</p>
              </>
            )}
          </section>

          <section>
            <h3 className="group-title">{t('exportPdf.protection')}</h3>
            <label className="collab-check">
              <input type="checkbox" checked={opts.protect} onChange={(e) => setOpts((o) => ({ ...o, protect: e.target.checked }))} />
              <span>{t('exportPdf.protect')}</span>
            </label>
            <p className="dialog-hint">{t('exportPdf.protectHint')}</p>
          </section>
          <div className="collab-row">
            <button className="btn btn-primary" disabled={busy || (opts.watermark.enabled && !mark)} onClick={run}>
              <Icon name="download" size={14} />{t('exportPdf.export')}
            </button>
            <button className="btn btn-ghost" onClick={close}>{t('pdfImport.cancel')}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
