// État de l'interface (hors projet, hors annulation) : sélection, filtres, mode, thème, langue.
// Les préférences sont mémorisées dans le navigateur (localStorage).
import { create } from 'zustand'
import type { SignalFamily } from '../model/signals'

export type UiMode = 'beginner' | 'expert'
export type ThemePref = 'system' | 'dark' | 'light'
export type DockTab = 'cables' | 'bom' | 'issues'

interface Prefs {
  mode: UiMode
  theme: ThemePref
  lang: 'fr' | 'en'
  dockOpen: boolean
}

const PREFS_KEY = 'avd.prefs'

function readPrefs(): Prefs {
  const fallback: Prefs = { mode: 'expert', theme: 'system', lang: 'fr', dockOpen: true }
  try {
    return { ...fallback, ...JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}') }
  } catch {
    return fallback
  }
}

interface UiState extends Prefs {
  selectedEquipment: string[]
  selectedLinks: string[]
  hiddenSignals: SignalFamily[]
  dockTab: DockTab
  paletteOpen: boolean
  /** Élément à centrer dans le canevas (clic dans une liste) */
  focusRequest: { kind: 'equipment' | 'link'; id: string; at: number } | null

  select: (equipment: string[], links: string[]) => void
  toggleSignal: (s: SignalFamily) => void
  showOnly: (s: SignalFamily[] | null) => void
  setPref: <K extends keyof Prefs>(key: K, value: Prefs[K]) => void
  setDockTab: (t: DockTab) => void
  setPaletteOpen: (open: boolean) => void
  focus: (kind: 'equipment' | 'link', id: string) => void
}

export const useUi = create<UiState>((set, get) => ({
  ...readPrefs(),
  selectedEquipment: [],
  selectedLinks: [],
  hiddenSignals: [],
  dockTab: 'cables',
  paletteOpen: false,
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
    const { mode, theme, lang, dockOpen } = get()
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ mode, theme, lang, dockOpen }))
    } catch {
      // Stockage indisponible (navigation privée) : la préférence reste valable pour la session
    }
  },
  setDockTab: (t) => set({ dockTab: t, dockOpen: true }),
  setPaletteOpen: (open) => set({ paletteOpen: open }),
  focus: (kind, id) =>
    set({
      focusRequest: { kind, id, at: Date.now() },
      selectedEquipment: kind === 'equipment' ? [id] : [],
      selectedLinks: kind === 'link' ? [id] : [],
    }),
}))
