// Barre supérieure : identité, projet, fichier, annulation, recherche, mode, thème, langue.
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useReactFlow } from '@xyflow/react'
import { exportPdfWithLabels } from '../io/exportPdfUi'
import { exportCableCsv, exportCanvasImage, notifyError, openProjectFile, saveProjectFile } from '../io/files'
import { useProject } from '../store/projectStore'
import { useUi, type ThemePref } from '../store/uiStore'
import { Icon, type IconName } from './Icon'

const THEME_NEXT: Record<ThemePref, ThemePref> = { system: 'dark', dark: 'light', light: 'system' }
const THEME_ICON: Record<ThemePref, IconName> = { system: 'monitor', dark: 'moon', light: 'sun' }

export function csvHeaders(t: (k: string) => string) {
  return ['number', 'signal', 'from', 'to', 'connectors', 'cable', 'length'].map((k) => t(`dock.${k}`))
}

export function TopBar() {
  const { t } = useTranslation()
  const project = useProject((s) => s.project)
  const canUndo = useProject((s) => s.past.length > 0)
  const canRedo = useProject((s) => s.future.length > 0)
  const { undo, redo, rename, load } = useProject.getState()
  const { mode, theme, lang, setPref, setPaletteOpen } = useUi()
  const [exportOpen, setExportOpen] = useState(false)
  const [name, setName] = useState(project.name)
  const exportRef = useRef<HTMLDivElement>(null)
  const rf = useReactFlow()

  useEffect(() => setName(project.name), [project.name])
  useEffect(() => {
    if (!exportOpen) return
    const close = (e: MouseEvent) => !exportRef.current?.contains(e.target as Node) && setExportOpen(false)
    window.addEventListener('mousedown', close)
    return () => window.removeEventListener('mousedown', close)
  }, [exportOpen])

  const open = async () => {
    try {
      const p = await openProjectFile()
      if (p) load(p)
    } catch {
      notifyError(t('menu.openError'))
    }
  }

  return (
    <header className="topbar">
      <div className="brand" title={t('app.tagline')}>
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="2" y="5" width="7" height="14" rx="1.5" fill="none" stroke="var(--accent)" strokeWidth="2" />
          <rect x="15" y="5" width="7" height="14" rx="1.5" fill="none" stroke="var(--text)" strokeWidth="2" />
          <path d="M9 9h3v6h3" fill="none" stroke="var(--accent)" strokeWidth="2" />
        </svg>
        <span>AV Diagram</span>
      </div>

      <input
        id="project-name"
        className="project-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => name.trim() && name !== project.name && rename(name.trim())}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        aria-label="Nom du projet"
      />

      <nav className="toolbar" aria-label="Fichier">
        <button className="icon-btn" onClick={() => useUi.getState().setNewProjectOpen(true)} title={t('menu.new')} aria-label={t('menu.new')}><Icon name="file" /></button>
        <button className="icon-btn" onClick={open} title={`${t('menu.open')} (Ctrl+O)`} aria-label={t('menu.open')}><Icon name="folder" /></button>
        <button className="icon-btn" onClick={() => saveProjectFile(project)} title={`${t('menu.save')} (Ctrl+S)`} aria-label={t('menu.save')}><Icon name="save" /></button>
        <div className="menu" ref={exportRef}>
          <button className="icon-btn" onClick={() => setExportOpen((o) => !o)} aria-expanded={exportOpen} title={t('menu.export')} aria-label={t('menu.export')}><Icon name="download" /></button>
          {exportOpen && (
            <div className="menu-pop" role="menu">
              <button role="menuitem" onClick={() => { setExportOpen(false); exportPdfWithLabels(rf, t) }}>{t('menu.exportPdf')}</button>
              <button role="menuitem" onClick={() => { setExportOpen(false); exportCanvasImage(project, 'png') }}>{t('menu.exportPng')}</button>
              <button role="menuitem" onClick={() => { setExportOpen(false); exportCanvasImage(project, 'svg') }}>{t('menu.exportSvg')}</button>
              <button role="menuitem" onClick={() => { setExportOpen(false); exportCableCsv(project, csvHeaders(t)) }}>{t('menu.exportCsv')}</button>
            </div>
          )}
        </div>
        <button className="icon-btn" onClick={() => useUi.getState().setPresenting(true)} title={`${t('presentation.enter')} (F5)`} aria-label={t('presentation.enter')}><Icon name="present" /></button>
        <button className="icon-btn" onClick={() => useUi.getState().setSettingsOpen(true)} title={t('settings.title')} aria-label={t('settings.title')}><Icon name="settings" /></button>
        <span className="sep" />
        <button className="icon-btn" onClick={undo} disabled={!canUndo} title={`${t('menu.undo')} (Ctrl+Z)`} aria-label={t('menu.undo')}><Icon name="undo" /></button>
        <button className="icon-btn" onClick={redo} disabled={!canRedo} title={`${t('menu.redo')} (Ctrl+Maj+Z)`} aria-label={t('menu.redo')}><Icon name="redo" /></button>
      </nav>

      <span className="spacer" />

      <button className="cmd-btn" onClick={() => setPaletteOpen(true)}>
        <Icon name="search" size={14} />
        <span className="cmd-label">{t('menu.search')}</span>
        <kbd>Ctrl K</kbd>
      </button>

      <div className="segmented" role="group" aria-label="Mode">
        <button aria-pressed={mode === 'beginner'} onClick={() => setPref('mode', 'beginner')}>{t('mode.beginner')}</button>
        <button aria-pressed={mode === 'expert'} onClick={() => setPref('mode', 'expert')}>{t('mode.expert')}</button>
      </div>
      <button className="icon-btn" onClick={() => setPref('lang', lang === 'fr' ? 'en' : 'fr')} title={lang === 'fr' ? 'English' : 'Français'} aria-label="Langue">
        <span className="lang-code">{lang.toUpperCase()}</span>
      </button>
      <button className="icon-btn" onClick={() => setPref('theme', THEME_NEXT[theme])} title={t(`theme.${theme}`)} aria-label={t(`theme.${theme}`)}>
        <Icon name={THEME_ICON[theme]} />
      </button>
    </header>
  )
}
