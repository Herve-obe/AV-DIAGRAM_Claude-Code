// Mise en page principale de l'éditeur et raccourcis clavier globaux.
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ReactFlowProvider, useReactFlow } from '@xyflow/react'
import { Canvas } from './editor/Canvas'
import { fitToPage } from './editor/PageGrid'
import { useAi } from './store/aiStore'
import type { SignalFamily } from './model/signals'
import { onCommand, sendCommand, WINDOW_ROLE } from './store/windowSync'
import { openDocument, saveCurrentProject } from './io/documentLifecycle'
import { useProject } from './store/projectStore'
import { useUi } from './store/uiStore'
import { AiSetupDialog } from './ui/AiSetupDialog'
import { ChatPanel } from './ui/ChatPanel'
import { CollabBanner } from './ui/CollabBanner'
import { CollabSessionBar } from './ui/CollabSessionBar'
import { CollabDialog } from './ui/CollabDialog'
import { AssistantPanel } from './ui/AssistantPanel'
import { CommandPalette } from './ui/CommandPalette'
import { Dock } from './ui/Dock'
import { FilterBar } from './ui/FilterBar'
import { Inspector } from './ui/Inspector'
import { LibraryPanel } from './ui/LibraryPanel'
import { MergeDialog } from './ui/MergeDialog'
import { PdfImportDialog } from './ui/PdfImportDialog'
import { ExportPdfDialog } from './ui/ExportPdfDialog'
import { NewProjectDialog } from './ui/NewProjectDialog'
import { LinkCheckDialog } from './ui/LinkCheckDialog'
import { StartDialog } from './ui/StartDialog'
import { SeriesDialog } from './ui/SeriesDialog'
import { PageBar, ViewNavigation } from './ui/PageBar'
import { RackView } from './ui/RackView'
import { FloorPlanView } from './ui/FloorPlanView'
import { CadImportDialog } from './ui/CadImportDialog'
import { PatchImportDialog } from './ui/PatchImportDialog'
import { CatalogueImportDialog } from './ui/CatalogueImportDialog'
import { CommunicationsView, ListsView, NetworkView, PowerView } from './ui/DeploymentViews'
import { ProjectSettings } from './ui/ProjectSettings'
import { SheetTabs } from './ui/SheetTabs'
import { Splitter } from './ui/Splitter'
import { InputProbe } from './ui/InputProbe'
import { TopBar } from './ui/TopBar'
import { groupSelected, ungroupSelected } from './ui/groupActions'
import { placeOnPlan } from './model/floorPlan'

/** Alt+0..3 : filtres rapides d'affichage (null = tout afficher) */
const SIGNAL_SETS: Record<string, SignalFamily[] | null> = {
  '0': null,
  '1': ['audioAnalog', 'audioDigital', 'audioIp'],
  '2': ['video', 'videoIp'],
  '3': ['network', 'audioIp', 'videoIp', 'sync'],
}

/** Vrai si la frappe clavier vise un champ de saisie (on laisse alors le navigateur gérer). */
const isTyping = (e: KeyboardEvent) => {
  const el = e.target as HTMLElement
  return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)
}

export function Shortcuts() {
  const rf = useReactFlow()
  useEffect(() => {
    if (WINDOW_ROLE === 'main') {
      onCommand('save', arg => void saveCurrentProject(arg === 'as'))
      onCommand('open', () => void openDocument())
    }
    const onKey = async (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey
      const key = e.key.toLowerCase()
      const ui = useUi.getState()
      const store = useProject.getState()
      if (e.key === 'F5') { e.preventDefault(); ui.setPresenting(!ui.presenting); return }
      if (e.key === 'Escape' && ui.presenting && !ui.paletteOpen) { ui.setPresenting(false); return }
      if (mod && key === 'k') { e.preventDefault(); ui.setPaletteOpen(!ui.paletteOpen); return }
      // Ctrl+S : dans le fichier du projet ; Ctrl+Maj+S : enregistrer sous
      if (mod && key === 's') {
        e.preventDefault()
        if (WINDOW_ROLE === 'panels') sendCommand('save', e.shiftKey ? 'as' : '')
        else void saveCurrentProject(e.shiftKey)
        return
      }
      if (mod && key === 'o') {
        e.preventDefault()
        if (WINDOW_ROLE === 'panels') sendCommand('open', '')
        else await openDocument()
        return
      }
      if (isTyping(e)) return
      // Échap : désélectionne tout (sauf si une fenêtre ou un menu est ouvert, qui se ferme lui-même)
      if (e.key === 'Escape' && !ui.presenting && !ui.paletteOpen && !document.querySelector('.overlay, .canvas-menu')) {
        if (ui.selectedEquipment.length || ui.selectedLinks.length) ui.select([], [])
        return
      }
      if (mod && key === 'z' && !e.shiftKey) { e.preventDefault(); store.undo(); return }
      if (mod && (key === 'y' || (key === 'z' && e.shiftKey))) { e.preventDefault(); store.redo(); return }
      // Ctrl+A : tout sélectionner sur la feuille affichée (blocs, notes, cadres et liaisons visibles)
      if (mod && key === 'a' && ui.view === 'diagram' && !ui.presenting) {
        e.preventDefault()
        const nodes = rf.getNodes().filter((n) => !n.hidden).map((n) => n.id)
        const links = rf.getEdges().filter((x) => !x.hidden)
          .flatMap((x) => (x.data as { linkIds?: string[] } | undefined)?.linkIds ?? [x.id])
          .filter((id) => store.project.links[id])
        ui.select(nodes, [...new Set(links)])
        return
      }
      if (mod && key === 'd') {
        e.preventDefault()
        const ids = store.duplicate(ui.selectedEquipment)
        if (ids.length) ui.select(ids, [])
        return
      }
      if (mod && key === 'g') {
        e.preventDefault()
        if (ui.view !== 'diagram') return
        if (e.shiftKey) ungroupSelected()
        else groupSelected()
        return
      }
      if (!mod && key === 'f') {
        if (ui.view === 'plan') document.querySelector<HTMLButtonElement>('[data-plan-fit]')?.click()
        else if (ui.view === 'diagram' && !fitToPage(rf, store.project, 300)) rf.fitView({ duration: 300, padding: 0.15, maxZoom: 1 })
      }
      // R : quart de tour horaire des équipements sélectionnés ; Maj+R : sens inverse
      if (!mod && !e.altKey && key === 'r' && ui.selectedEquipment.length && !ui.presenting) {
        const ids = ui.selectedEquipment.filter((id) => store.project.equipment[id])
        if (ui.view === 'plan') {
          let next = store.project
          for (const id of ids) { const p = store.project.equipment[id].plan; if (p) next = placeOnPlan(next,id, { ...p, angle: (p.angle + (e.shiftKey ? -90 : 90) + 360) % 360 }) }
          if (next !== store.project) store.replaceProject(next)
        } else if (ids.length && ui.view === 'diagram') store.rotateEquipment(ids, e.shiftKey ? -1 : 1)
      }
      if (e.altKey && e.key in SIGNAL_SETS) ui.showOnly(SIGNAL_SETS[e.key])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [rf])
  return null
}

/** Applique le thème choisi sur <html> ("system" = pas d'attribut, suit l'appareil). */
function ThemeSync() {
  const theme = useUi((s) => s.theme)
  useEffect(() => {
    if (theme === 'system') delete document.documentElement.dataset.theme
    else document.documentElement.dataset.theme = theme
  }, [theme])
  return null
}

/** Si la feuille affichée n'existe plus (autre projet ouvert, feuille supprimée), revient à la première. */
function SheetSync() {
  const sheets = useProject((s) => s.project.sheets)
  const current = useUi((s) => s.currentSheetId)
  useEffect(() => {
    if (sheets?.length && !sheets.some((s) => s.id === current)) useUi.getState().setSheet(sheets[0].id)
  }, [sheets, current])
  return null
}

/** Bandeau du mode présentation : nom du projet et bouton de sortie. */
function PresentationBar() {
  const { t } = useTranslation()
  const name = useProject((s) => s.project.name)
  return (
    <header className="presentation-bar">
      <span className="brand-mini">AV Diagram</span>
      <span className="presentation-title">{name}</span>
      <button className="btn" onClick={() => useUi.getState().setPresenting(false)}>
        {t('presentation.exit')} <kbd>{t('presentation.escKey')}</kbd>
      </button>
    </header>
  )
}

export default function App() {
  const mode = useUi((s) => s.mode)
  const presenting = useUi((s) => s.presenting)
  const assistant = useAi((s) => s.panelOpen)
  const view = useUi((s) => s.view)
  const sheetId = useUi(s => s.currentSheetId)
  const panels = useUi((s) => s.panels)
  const detached = useUi((s) => s.panelsDetached)
  const sizes = { '--lib-w': `${panels.library}px`, '--insp-w': `${panels.inspector}px`, '--dock-h': `${panels.dock}px` } as React.CSSProperties
  return (
    <ReactFlowProvider>
      <div className={`app mode-${mode} ${presenting ? 'is-presenting' : ''} ${detached ? 'is-detached' : ''}`} style={sizes}>
        <div className="app-header">
          {presenting ? <PresentationBar /> : <TopBar />}
          {!presenting && <ViewNavigation />}
          <CollabSessionBar />
        </div>
        <div className="workspace">
          {!presenting && <LibraryPanel />}
          <main className="stage">
            {view === 'racks' && !presenting ? (
              <RackView />
            ) : view === 'network' ? <NetworkView /> : view === 'power' ? <PowerView /> : view === 'intercom' || view === 'sync' ? <CommunicationsView key={view} sync={view === 'sync'} /> : view === 'lists' ? <ListsView /> : (
              <>
                <SheetTabs />
                {!presenting && <FilterBar />}
                {view === 'plan' ? <FloorPlanView key={sheetId} /> : <Canvas />}
              </>
            )}
          </main>
          {!presenting && !detached && (assistant ? <AssistantPanel /> : <Inspector />)}
          {!presenting && <Splitter panel="library" />}
          {!presenting && !detached && <Splitter panel="inspector" />}
        </div>
        {/* Double écran : inspecteur et listes sont dans la fenêtre Infos */}
        {!presenting && !detached && <Dock />}
        {!presenting && <PageBar />}
      </div>
      <CommandPalette />
      <ProjectSettings />
      <NewProjectDialog />
      <LinkCheckDialog />
      <StartDialog />
      <SeriesDialog />
      <InputProbe />
      <MergeDialog />
      <PdfImportDialog />
      <CadImportDialog />
      <PatchImportDialog />
      <CatalogueImportDialog />
      <ExportPdfDialog />
      <AiSetupDialog />
      <CollabDialog />
      <CollabBanner />
      <ChatPanel />
      <Shortcuts />
      <ThemeSync />
      <SheetSync />
    </ReactFlowProvider>
  )
}
