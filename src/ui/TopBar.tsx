// Barre supérieure : identité, projet, fichier, annulation, recherche, mode, thème, langue.
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { startMerge } from './MergeDialog'
import { startPdfImport } from './PdfImportDialog'
import { startCadImport } from './CadImportDialog'
import { exportCad, type CadDiagramGeometry } from '../io/cadExport'
import { useReactFlow } from '@xyflow/react'
import { endOf, useRoutes } from '../editor/EdgeRouter'
import type { RouteEnd } from '../model/routing'
import { exportWorkbook } from '../io/xlsx'
import { startPatchImport } from './PatchImportDialog'
import { useExportPdf } from './ExportPdfDialog'
import { closePanelsWindow, openPanelsWindow } from '../store/windowSync'
import { exportCableCsv, exportCanvasImage, notifyError } from '../io/files'
import { openDocument, saveCurrentProject } from '../io/documentLifecycle'
import { useCollab } from '../collab/session'
import { useAi } from '../store/aiStore'
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
  const rf = useReactFlow()
  const project = useProject((s) => s.project)
  const drawing = useUi(s => ['diagram', 'plan'].includes(s.view))
  const detached = useUi((s) => s.panelsDetached)
  const collabUndo = useCollab((s) => s.canUndo)
  const collabRedo = useCollab((s) => s.canRedo)
  const collabStatus = useCollab((s) => s.status)
  const collabCount = useCollab((s) => s.participants.length)
  const chatOpen = useCollab((s) => s.chatOpen)
  const unread = useCollab((s) => s.unread)
  const canUndo = useProject((s) => s.past.length > 0) || collabUndo
  const canRedo = useProject((s) => s.future.length > 0) || collabRedo
  const { undo, redo, rename } = useProject.getState()
  const { mode, theme, lang, setPref, setPaletteOpen } = useUi()
  const [exportOpen, setExportOpen] = useState(false)
  const [name, setName] = useState(project.name)
  const exportRef = useRef<HTMLDivElement>(null)
  const aiOpen = useAi((s) => s.panelOpen)

  useEffect(() => setName(project.name), [project.name])
  useEffect(() => {
    if (!exportOpen) return
    const close = (e: MouseEvent) => !exportRef.current?.contains(e.target as Node) && setExportOpen(false)
    window.addEventListener('mousedown', close)
    return () => window.removeEventListener('mousedown', close)
  }, [exportOpen])

  const open = () => void openDocument()
  const dxf = async () => {
    const geometry: CadDiagramGeometry = { boxes: new Map(), routes: useRoutes.getState().routes }
    for (const e of Object.values(project.equipment)) {
      const node = rf.getInternalNode(e.id)
      if (!node || node.hidden || !node.measured?.width || !node.measured.height) continue
      const ports = new Map<string, RouteEnd>()
      for (const port of e.ports) { const end = endOf(node,port.id); if (end) ports.set(port.id,end) }
      geometry.boxes.set(e.id,{x:node.internals.positionAbsolute.x,y:node.internals.positionAbsolute.y,w:node.measured.width,h:node.measured.height,ports})
    }
    return exportCad(project,useUi.getState().currentSheetId,useUi.getState().view === 'plan',geometry)
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
        <button className="icon-btn" onClick={() => startMerge(t)} title={t('merge.menu')} aria-label={t('merge.menu')}><Icon name="copy" /></button>
        <button className="icon-btn" onClick={() => startPdfImport(t)} title={t('pdfImport.menu')} aria-label={t('pdfImport.menu')}><Icon name="pdf" /></button>
        <button className="icon-btn" onClick={() => startCadImport(t)} title={t('cad.menu')} aria-label={t('cad.menu')}><Icon name="plan" /></button>
        <button className="icon-btn" onClick={() => startPatchImport(t)} title={t('xlsx.importMenu')} aria-label={t('xlsx.importMenu')}><Icon name="lists" /></button>
        <button className="icon-btn" onClick={() => saveCurrentProject()} title={`${t('menu.save')} (Ctrl+S)`} aria-label={t('menu.save')}><Icon name="save" /></button>
        <div className="menu" ref={exportRef}>
          <button className="icon-btn" onClick={() => setExportOpen((o) => !o)} aria-expanded={exportOpen} title={t('menu.export')} aria-label={t('menu.export')}><Icon name="download" /></button>
          {exportOpen && (
            <div className="menu-pop" role="menu">
              <button role="menuitem" onClick={() => { setExportOpen(false); useExportPdf.getState().setOpen(true) }}>{t('menu.exportPdf')}</button>
              <button role="menuitem" disabled={!drawing} onClick={() => { setExportOpen(false); exportCanvasImage(project, 'png') }}>{t('menu.exportPng')}</button>
              <button role="menuitem" disabled={!drawing} onClick={() => { setExportOpen(false); exportCanvasImage(project, 'svg') }}>{t('menu.exportSvg')}</button>
              <button role="menuitem" onClick={() => { setExportOpen(false); exportCableCsv(project, csvHeaders(t)) }}>{t('menu.exportCsv')}</button>
              <button role="menuitem" disabled={!drawing} onClick={() => { setExportOpen(false); void dxf().catch(() => notifyError(t('cad.exportError'))) }}>{t('cad.export')}</button>
              <button role="menuitem" onClick={() => { setExportOpen(false); void exportWorkbook(project, t).catch(() => notifyError(t('xlsx.exportError'))) }}>{t('xlsx.export')}</button>
            </div>
          )}
        </div>
        <button
          className={`icon-btn collab-btn collab-${collabStatus}`}
          onClick={() => useCollab.getState().setDialogOpen(true)}
          title={t(`collab.status.${collabStatus}`)}
          aria-label={t('collab.title')}
        >
          <Icon name="users" />
          {collabStatus !== 'off' && <span className="collab-count">{collabCount}</span>}
        </button>
        {collabStatus !== 'off' && (
          <button
            className="icon-btn collab-btn"
            aria-pressed={chatOpen}
            onClick={() => useCollab.getState().setChatOpen(!chatOpen)}
            title={t('collab.chat.title')}
            aria-label={t('collab.chat.title')}
          >
            <Icon name="chat" />
            {unread > 0 && <span className="collab-count chat-unread">{unread > 99 ? '99+' : unread}</span>}
          </button>
        )}
        <button
          className="icon-btn"
          aria-pressed={detached}
          onClick={() => void (detached ? closePanelsWindow() : openPanelsWindow())}
          title={t(detached ? 'dual.close' : 'dual.open')}
          aria-label={t(detached ? 'dual.close' : 'dual.open')}
        >
          <Icon name="screens" />
        </button>
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

      <button className="icon-btn" aria-pressed={aiOpen} onClick={() => useAi.getState().setPanelOpen(!aiOpen)} title={t('ai.title')} aria-label={t('ai.title')}><Icon name="assistant" /></button>
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

