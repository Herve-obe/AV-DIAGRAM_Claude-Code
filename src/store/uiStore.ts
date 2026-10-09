// État de l'interface (hors projet, hors annulation) : sélection, filtres, mode, thème, langue.
// Les préférences sont mémorisées dans le navigateur (localStorage).
import { create } from 'zustand'
import { DEFAULT_SHEET_ID } from '../model/project'
import type { LayerView } from '../model/layers'
import type { SignalFamily } from '../model/signals'
import type { Project } from '../model/types'

export type UiMode = 'beginner' | 'expert'
export type ThemePref = 'system' | 'dark' | 'light'
export type DockTab = 'cables' | 'multicores' | 'bom' | 'issues'
/** Vue des liaisons : chaque flux, ou les câbles physiques (un trait par multipaire) */
export type LinkView = 'flows' | 'cables'
/** Vue principale : synoptique ou élévation des baies (lot 3, vues liées) */
export type MainView = 'diagram' | 'racks'

interface Prefs {
  mode: UiMode
  theme: ThemePref
  lang: 'fr' | 'en'
  dockOpen: boolean
  linkView: LinkView
  /** Tracé automatique des liaisons (contournement des blocs, voies écartées) */
  autoRoute: boolean
  /** Calque affiché : propre à chaque poste, il n'est pas enregistré dans le projet */
  layer: LayerView
}

const PREFS_KEY = 'avd.prefs'

function readPrefs(): Prefs {
  const fallback: Prefs = { mode: 'expert', theme: 'system', lang: 'fr', dockOpen: true, linkView: 'flows', autoRoute: true, layer: 'all' }
  try {
    return { ...fallback, ...JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}') }
  } catch {
    return fallback
  }
}

interface UiState extends Prefs {
  selectedEquipment: string[]
  selectedLinks: string[]
  view: MainView
  hiddenSignals: SignalFamily[]
  dockTab: DockTab
  paletteOpen: boolean
  settingsOpen: boolean
  newProjectOpen: boolean
  /** Fenêtre d'accueil (au lancement) */
  startOpen: boolean
  /** Liaison qui vient d'être tirée et pose problème : fenêtre de confirmation */
  linkCheck: string | null
  /** Autre version d'un projet, ouverte pour fusion (fenêtre de bilan) */
  mergeCandidate: Project | null
  /** Feuille affichée dans le canevas */
  currentSheetId: string
  /** Mode présentation : schéma seul, sans outils d'édition */
  presenting: boolean
  /** Élément à centrer dans le canevas (clic dans une liste) */
  focusRequest: { kind: 'equipment' | 'link'; id: string; at: number } | null

  select: (equipment: string[], links: string[]) => void
  toggleSignal: (s: SignalFamily) => void
  showOnly: (s: SignalFamily[] | null) => void
  setPref: <K extends keyof Prefs>(key: K, value: Prefs[K]) => void
  setDockTab: (t: DockTab) => void
  setPaletteOpen: (open: boolean) => void
  setSettingsOpen: (open: boolean) => void
  setNewProjectOpen: (open: boolean) => void
  setStartOpen: (open: boolean) => void
  setLinkCheck: (id: string | null) => void
  setMergeCandidate: (p: Project | null) => void
  setSheet: (id: string) => void
  setView: (view: MainView) => void
  setPresenting: (on: boolean) => void
  focus: (kind: 'equipment' | 'link', id: string) => void
}

export const useUi = create<UiState>((set, get) => ({
  ...readPrefs(),
  selectedEquipment: [],
  selectedLinks: [],
  view: 'diagram',
  mergeCandidate: null,
  hiddenSignals: [],
  dockTab: 'cables',
  paletteOpen: false,
  settingsOpen: false,
  newProjectOpen: false,
  startOpen: true,
  linkCheck: null,
  currentSheetId: DEFAULT_SHEET_ID,
  presenting: false,
  focusRequest: null,

  select: (equipment, links) => {
    const same = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i])
    const s = get()
    // Évite une boucle de rendu avec le canevas quand la sélection ne change pas
    if (same(s.selectedEquipment, equipment) && same(s.selectedLinks, links)) return
    set({ selectedEquipment: equipment, selectedLinks: links })
  },
  toggleSignal: (s) => {
    const h = get().hiddenSignals
    set({ hiddenSignals: h.includes(s) ? h.filter((x) => x !== s) : [...h, s] })
  },
  showOnly: (list) => {
    if (!list) return set({ hiddenSignals: [] })
    const all: SignalFamily[] = ['audioAnalog', 'audioDigital', 'audioIp', 'video', 'videoIp', 'sync', 'intercom', 'control', 'network', 'power']
    set({ hiddenSignals: all.filter((s) => !list.includes(s)) })
  },
  setPref: (key, value) => {
    set({ [key]: value } as Partial<UiState>)
    const { mode, theme, lang, dockOpen, linkView, autoRoute, layer } = get()
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ mode, theme, lang, dockOpen, linkView, autoRoute, layer }))
    } catch {
      // Stockage indisponible (navigation privée) : la préférence reste valable pour la session
    }
  },
  setDockTab: (t) => set({ dockTab: t, dockOpen: true }),
  setPaletteOpen: (open) => set({ paletteOpen: open }),
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  setMergeCandidate: (p) => set({ mergeCandidate: p }),
  setNewProjectOpen: (open) => set({ newProjectOpen: open }),
  setStartOpen: (open) => set({ startOpen: open }),
  setLinkCheck: (id) => set({ linkCheck: id }),
  setView: (view) => set({ view }),
  setSheet: (id) => set({ currentSheetId: id, selectedEquipment: [], selectedLinks: [] }),
  setPresenting: (on) => set({ presenting: on, paletteOpen: false }),
  focus: (kind, id) =>
    set({
      focusRequest: { kind, id, at: Date.now() },
      selectedEquipment: kind === 'equipment' ? [id] : [],
      selectedLinks: kind === 'link' ? [id] : [],
    }),
}))
