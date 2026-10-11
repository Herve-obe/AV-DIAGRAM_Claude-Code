// Création d'un projet : nom, emplacement du fichier .avd (créé tout de suite), format de la feuille
// (dessinée sur le schéma pendant le travail) et point de départ (projet vide ou modèle).
import { isTauri } from '@tauri-apps/api/core'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DEFAULT_EXPORT, pageSize } from '../io/exportOptions'
import { createProjectFile, notifyError, pickSaveFolder, slug } from '../io/files'
import { buildTemplate, type TemplateId } from '../library/templates'
import { PAPER_SIZES, type ExportSettings, type PaperSize } from '../model/types'
import { useProject } from '../store/projectStore'
import { useSaveFolder } from '../store/saveFolderStore'
import { useUi } from '../store/uiStore'
import { Icon, type IconName } from './Icon'

const CHOICES: { id: TemplateId; icon: IconName }[] = [
  { id: 'blank', icon: 'file' },
  { id: 'concert', icon: 'synoptic' },
  { id: 'tvStudio', icon: 'present' },
  { id: 'conference', icon: 'network' },
]

export function NewProjectDialog() {
  const open = useUi((s) => s.newProjectOpen)
  if (!open) return null
  return <NewProjectForm />
}

function NewProjectForm() {
  const { t } = useTranslation()
  const close = () => useUi.getState().setNewProjectOpen(false)
  const desktop = isTauri()
  const [name, setName] = useState(t('menu.newProjectName'))
  const [folder, setFolder] = useState<string | null>(useSaveFolder.getState().dir)
  const [paper, setPaper] = useState<PaperSize>('A3')
  const [orientation, setOrientation] = useState<ExportSettings['orientation']>('landscape')
  const [showPage, setShowPage] = useState(true)
  const [template, setTemplate] = useState<TemplateId>('blank')
  const [busy, setBusy] = useState(false)
  const size = pageSize(paper, orientation)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const create = async () => {
    setBusy(true)
    try {
      const base = buildTemplate(template, name.trim() || t('menu.newProjectName'))
      const named = { ...base, name: name.trim() || base.name }
      // Feuille ajustée au schéma : pas d'échelle à choisir (100 % tant que le schéma tient)
      const exportSettings: ExportSettings = {
        ...DEFAULT_EXPORT, ...named.settings.export,
        paper, orientation, scaleMode: showPage ? 'page' : 'fit', printScale: 100,
      }
      const project = { ...named, settings: { ...named.settings, export: exportSettings } }
      useProject.getState().replaceProject(project)
      const ui = useUi.getState()
      ui.select([], [])
      ui.setSheet(useProject.getState().project.sheets?.[0]?.id ?? '')
      if (desktop && folder) {
        try {
          await createProjectFile(useProject.getState().project, folder)
        } catch (e) {
          notifyError(t('newProject.fileError', { error: e instanceof Error ? e.message : String(e) }))
        }
      }
      close()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="dialog new-project" role="dialog" aria-modal="true" aria-labelledby="new-title">
        <header className="dialog-head">
          <h2 id="new-title">{t('newProject.title')}</h2>
          <button className="icon-btn" onClick={close} aria-label={t('settings.close')}><Icon name="close" /></button>
        </header>
        <div className="dialog-body">
          <section className="np-section">
            <div className="field">
              <label htmlFor="np-name">{t('newProject.name')}</label>
              <input id="np-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && void create()} />
            </div>
            <div className="field">
              <label>{t('newProject.location')}</label>
              {desktop ? (
                <>
                  <div className="save-folder-row np-row">
                    <code className="save-folder-path">{folder ?? t('newProject.noFolder')}</code>
                    <button className="btn" onClick={async () => { const d = await pickSaveFolder(); if (d) setFolder(d) }}><Icon name="folder" size={14} />{t('storage.choose')}</button>
                  </div>
                  {folder && <span className="dim small">{t('newProject.filePreview', { file: `${slug(name || 'projet')}.avd` })}</span>}
                </>
              ) : (
                <span className="dim small">{t('newProject.browserSave')}</span>
              )}
            </div>
          </section>
          <section className="np-section">
            <h3 className="group-title">{t('newProject.format')}</h3>
            <div className="export-row np-row">
              <div className="segmented" role="radiogroup" aria-label={t('exportPdf.format')}>
                {PAPER_SIZES.map((p) => <button key={p} role="radio" aria-checked={paper === p} aria-pressed={paper === p} onClick={() => setPaper(p)}>{p}</button>)}
              </div>
              <div className="segmented" role="radiogroup" aria-label={t('exportPdf.orientation')}>
                {(['landscape', 'portrait'] as const).map((o) => (
                  <button key={o} role="radio" aria-checked={orientation === o} aria-pressed={orientation === o} onClick={() => setOrientation(o)}>{t(`exportPdf.${o}`)}</button>
                ))}
              </div>
              <span className="dim small">{t('exportPdf.size', { w: size.w, h: size.h })}</span>
            </div>
            <label className="check-line np-row">
              <input type="checkbox" checked={showPage} onChange={(e) => setShowPage(e.target.checked)} />
              {t('newProject.showPage')}
            </label>
          </section>
          <section className="np-section">
            <h3 className="group-title">{t('newProject.start')}</h3>
            <div className="template-grid">
              {CHOICES.map((c) => (
                <button key={c.id} className={`template-card ${template === c.id ? 'is-selected' : ''}`} aria-pressed={template === c.id} onClick={() => setTemplate(c.id)}>
                  <span className="template-icon"><Icon name={c.icon} size={22} /></span>
                  <span className="template-name">{t(`newProject.${c.id}.name`)}</span>
                  <span className="template-desc">{t(`newProject.${c.id}.desc`)}</span>
                </button>
              ))}
            </div>
            <p className="dialog-hint">{t('newProject.hint')}</p>
          </section>
        </div>
        <footer className="dialog-foot">
          <button className="btn" onClick={close}>{t('series.cancel')}</button>
          <button className="btn btn-primary" onClick={() => void create()} disabled={busy}>{t('newProject.create')}</button>
        </footer>
      </div>
    </div>
  )
}
