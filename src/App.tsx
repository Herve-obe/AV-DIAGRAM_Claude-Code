// Mise en page principale de l'éditeur et raccourcis clavier globaux.
import { useEffect } from 'react'
import { ReactFlowProvider, useReactFlow } from '@xyflow/react'
import { Canvas } from './editor/Canvas'
import type { SignalFamily } from './model/signals'
import i18n from './i18n'
import { notifyError, openProjectFile, saveProjectFile } from './io/files'
import { useProject } from './store/projectStore'
import { useUi } from './store/uiStore'
import { CommandPalette } from './ui/CommandPalette'
import { Dock } from './ui/Dock'
import { FilterBar } from './ui/FilterBar'
import { Inspector } from './ui/Inspector'
import { LibraryPanel } from './ui/LibraryPanel'
import { PageBar } from './ui/PageBar'
import { ProjectSettings } from './ui/ProjectSettings'
import { TopBar } from './ui/TopBar'

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

function Shortcuts() {
  const rf = useReactFlow()
  useEffect(() => {
    const onKey = async (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey
      const key = e.key.toLowerCase()
      const ui = useUi.getState()
      const store = useProject.getState()
      if (mod && key === 'k') { e.preventDefault(); ui.setPaletteOpen(!ui.paletteOpen); return }
      if (mod && key === 's') { e.preventDefault(); saveProjectFile(store.project); return }
      if (mod && key === 'o') {
        e.preventDefault()
        try { const p = await openProjectFile(); if (p) store.load(p) } catch { notifyError(i18n.t('menu.openError')) }
        return
      }
      if (isTyping(e)) return
      if (mod && key === 'z' && !e.shiftKey) { e.preventDefault(); store.undo(); return }
      if (mod && (key === 'y' || (key === 'z' && e.shiftKey))) { e.preventDefault(); store.redo(); return }
      if (mod && key === 'd') {
        e.preventDefault()
        const ids = store.duplicate(ui.selectedEquipment)
        if (ids.length) ui.select(ids, [])
        return
      }
      if (!mod && key === 'f') rf.fitView({ duration: 300, padding: 0.15 })
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

export default function App() {
  const mode = useUi((s) => s.mode)
  return (
    <ReactFlowProvider>
      <div className={`app mode-${mode}`}>
        <TopBar />
        <div className="workspace">
          <LibraryPanel />
          <main className="stage">
            <FilterBar />
            <Canvas />
          </main>
          <Inspector />
        </div>
        <Dock />
        <PageBar />
      </div>
      <CommandPalette />
      <ProjectSettings />
      <Shortcuts />
      <ThemeSync />
    </ReactFlowProvider>
  )
}
