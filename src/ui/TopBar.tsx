// Barre supérieure : menus complets, raccourcis personnalisables et accès à l'assistant.
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { startMerge } from './MergeDialog'
import { startPdfImport } from './PdfImportDialog'
import { startCadImport } from './CadImportDialog'
import { startDiagramImport } from './diagramImport'
import { ManualDialog } from './ManualDialog'
import { exportCad, type CadDiagramGeometry } from '../io/cadExport'
import { useReactFlow } from '@xyflow/react'
import { endOf, useRoutes } from '../editor/EdgeRouter'
import type { RouteEnd } from '../model/routing'
import { exportWorkbook } from '../io/xlsx'
import { startPatchImport } from './PatchImportDialog'
import { startCatalogueImport } from './CatalogueImportDialog'
import { useExportPdf } from './ExportPdfDialog'
import { closePanelsWindow, openPanelsWindow } from '../store/windowSync'
import { exportCableCsv, exportCanvasImage, notifyError } from '../io/files'
import { closeDocument, openDocument, saveCurrentProject } from '../io/documentLifecycle'
import { useCollab } from '../collab/session'
import { isReady, useAi } from '../store/aiStore'
import { useProject } from '../store/projectStore'
import { useUi, type ThemePref } from '../store/uiStore'
import { Icon } from './Icon'
import { MenuBar, type MenuCommand } from './MenuBar'
import { TOP_ACTIONS, type TopActionId } from './topBarActions'
import { groupSelected, ungroupSelected } from './groupActions'
import { isGroupNodeId } from '../model/groups'
import { fitToPage } from '../editor/PageGrid'

const THEME_NEXT: Record<ThemePref, ThemePref> = { system: 'dark', dark: 'light', light: 'system' }

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
  const { mode, theme, lang, view, toolbar, selectedEquipment, setPref, setPaletteOpen } = useUi()
  const [readingDiagram, setReadingDiagram] = useState(false)
  const [manualOpen, setManualOpen] = useState(false)
  const closeManual = useCallback(() => setManualOpen(false), [])
  const [name, setName] = useState(project.name)
  const aiOpen = useAi((s) => s.panelOpen)
  const aiReady = useAi((s) => isReady(s.settings))

  useEffect(() => setName(project.name), [project.name])


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

  const runs: Record<TopActionId, () => unknown> = {
    new: () => useUi.getState().setNewProjectOpen(true), open,
    save: () => saveCurrentProject(), saveAs: () => saveCurrentProject(true), close: () => closeDocument(),
    merge: () => startMerge(t), importPdf: () => startPdfImport(t), importCad: () => startCadImport(t), importPatch: () => startPatchImport(t),
    importCatalogue: () => startCatalogueImport(t),
    importDiagram: async () => { setReadingDiagram(true); try { await startDiagramImport(t) } finally { setReadingDiagram(false) } },
    exportPdf: () => useExportPdf.getState().setOpen(true),
    exportPng: () => exportCanvasImage(project, 'png'), exportSvg: () => exportCanvasImage(project, 'svg'),
    exportCsv: () => exportCableCsv(project, csvHeaders(t)),
    exportCad: () => dxf().catch(() => notifyError(t('cad.exportError'))),
    exportXlsx: () => exportWorkbook(project, t).catch(() => notifyError(t('xlsx.exportError'))),
    exportDiagram: () => import('../io/diagramExchange').then(async ({ drawioXml }) => {
      const { saveContent, slug } = await import('../io/files')
      await saveContent(slug(project.name) + '.drawio', drawioXml(project), 'application/xml')
    }).catch(() => notifyError(t('diagramExchange.exportError'))),
    undo, redo, group: groupSelected, ungroup: ungroupSelected,
    fit: () => { if (view === 'plan') document.querySelector<HTMLButtonElement>('[data-plan-fit]')?.click(); else if (!fitToPage(rf, project, 300)) void rf.fitView({ duration: 300, padding: 0.15, maxZoom: 1 }) },
    dual: () => detached ? closePanelsWindow() : openPanelsWindow(), present: () => useUi.getState().setPresenting(true),
    mode: () => setPref('mode', mode === 'expert' ? 'beginner' : 'expert'), theme: () => setPref('theme', THEME_NEXT[theme]), lang: () => setPref('lang', lang === 'fr' ? 'en' : 'fr'),
    collab: () => useCollab.getState().setDialogOpen(true), chat: () => useCollab.getState().setChatOpen(!chatOpen),
    aiSetup: () => useAi.getState().setSetupOpen(true), settings: () => useUi.getState().setSettingsOpen(true, 'project'),
    toolbar: () => useUi.getState().setSettingsOpen(true, 'interface'), manual: () => setManualOpen(true),
  }
  const disabled: Partial<Record<TopActionId, boolean>> = {
    undo: !canUndo, redo: !canRedo, importDiagram: readingDiagram, exportPng: !drawing, exportSvg: !drawing, exportCad: !drawing,
    exportDiagram: view !== 'diagram', fit: !drawing, group: view !== 'diagram' || !selectedEquipment.length,
    ungroup: view !== 'diagram' || !selectedEquipment.some(isGroupNodeId), chat: collabStatus === 'off',
  }
  const commands: MenuCommand[] = TOP_ACTIONS.map(a => ({ ...a,
    label: a.id === 'dual' ? t(detached ? 'dual.close' : 'dual.open') : a.id === 'mode' ? t(a.label) + ' · ' + t('mode.' + mode) : a.id === 'theme' ? t('theme.' + theme) : (a.id.startsWith('export') ? t('menu.export') + ' · ' : '') + t(a.label),
    disabled: disabled[a.id], run: () => { if (!disabled[a.id]) void runs[a.id]() },
  }))
  const menus = (['file', 'edit', 'view', 'tools', 'help'] as const).map(id => ({ id, label: t('toolbar.menus.' + id), commands: commands.filter(c => TOP_ACTIONS.find(a => a.id === c.id)?.menu === id) }))
  const shortcut = (id: TopActionId) => {
    const action = TOP_ACTIONS.find(a => a.id === id)!, command = commands.find(c => c.id === id)!
    return <button key={id} className={'icon-btn ' + (id === 'collab' || id === 'chat' ? 'collab-btn' : '')}
      onClick={command.run} disabled={command.disabled} aria-label={command.label} title={command.label + (command.hint ? ' (' + command.hint + ')' : '')}
      aria-pressed={id === 'dual' ? detached : id === 'chat' ? chatOpen : undefined}>
      <Icon name={action.icon} />
      {id === 'collab' && collabStatus !== 'off' && <span className="collab-count">{collabCount}</span>}
      {id === 'chat' && unread > 0 && <span className="collab-count chat-unread">{unread > 99 ? '99+' : unread}</span>}
    </button>
  }

  return (
    <header className="topbar">
      <div className="topbar-start">
        <div className="brand" title={t('app.tagline')}>
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="2" y="5" width="7" height="14" rx="1.5" fill="none" stroke="var(--accent)" strokeWidth="2" />
            <rect x="15" y="5" width="7" height="14" rx="1.5" fill="none" stroke="var(--text)" strokeWidth="2" />
            <path d="M9 9h3v6h3" fill="none" stroke="var(--accent)" strokeWidth="2" />
          </svg>
          <span>AV Diagram</span>
        </div>
        <MenuBar label={t('toolbar.menubar')} menus={menus} />
      </div>

      <input
        id="project-name"
        className="project-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => name.trim() && name !== project.name && rename(name.trim())}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        aria-label={t('settings.projectName')}
      />

      <div className="topbar-end">
        <nav className="toolbar quick-toolbar" aria-label={t('toolbar.title')}>
          {toolbar.map(shortcut)}
          {collabStatus !== 'off' && !toolbar.includes('chat') && shortcut('chat')}
        </nav>

        <button className="cmd-btn" onClick={() => setPaletteOpen(true)}>
          <Icon name="search" size={14} />
          <span className="cmd-label">{t('menu.search')}</span>
          <kbd>Ctrl K</kbd>
        </button>

        <button className="btn assistant-btn" disabled={!aiReady} aria-pressed={aiOpen} onClick={() => useAi.getState().setPanelOpen(!aiOpen)} title={t(aiReady ? 'ai.open' : 'ai.installHint')}><Icon name="assistant" size={16} />{t('ai.title')}</button>
      </div>
      {manualOpen && <ManualDialog onClose={closeManual} />}
    </header>
  )
}

