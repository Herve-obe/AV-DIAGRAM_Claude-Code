// Travail en double écran : une fenêtre « Schéma » (principale) et une fenêtre « Infos » (inspecteur,
// câblage, multipaires, nomenclature, alertes). Les deux fenêtres gardent le même projet et la même
// sélection : chaque modification est envoyée à l'autre. Dans l'application de bureau, le transport
// passe par les événements Tauri ; dans un navigateur (développement), par BroadcastChannel.
import { isTauri } from '@tauri-apps/api/core'
import type { Project } from '../model/types'
import { useCollab } from '../collab/session'
import { useProject, projectChangeAllowed } from './projectStore'
import { useUi } from './uiStore'
import { rememberWindowPlace, restoreWindowPlace, shouldRestorePanels } from './windowLayout'

export type WindowRole = 'main' | 'panels'
export const WINDOW_ROLE: WindowRole = new URLSearchParams(window.location.search).get('window') === 'panels' ? 'panels' : 'main'
export const PANELS_LABEL = 'panels'

const CHANNEL = 'avd-window-sync'
const me = Math.random().toString(36).slice(2)

/** État d'interface partagé entre les fenêtres */
const UI_KEYS = ['selectedEquipment', 'selectedLinks', 'currentSheetId', 'focusRequest', 'mode', 'layer', 'hiddenSignals', 'linkView', 'view'] as const
type SharedUi = Partial<Pick<ReturnType<typeof useUi.getState>, (typeof UI_KEYS)[number]>>

export type SyncMessage =
  | { kind: 'access'; access: Pick<ReturnType<typeof useCollab.getState>, 'status' | 'role' | 'claims' | 'participants' | 'userId'> }
  | { kind: 'saved'; project: Project; saved: boolean }
  | { kind: 'hello' }
  | { kind: 'state'; project: Project; ui: SharedUi }
  | { kind: 'project'; project: Project; base: Project }
  | { kind: 'ui'; ui: SharedUi }
  | { kind: 'bye' }
  | { kind: 'command'; name: 'arrange' | 'save' | 'open'; arg: string }
type Envelope = SyncMessage & { from: string }

let send: (m: SyncMessage) => void = () => {}
let flushPending = () => {}
const commandHandlers = new Map<string, (arg: string) => void>()

/** Action à exécuter dans la fenêtre principale (ex. alignement, qui a besoin des tailles des blocs) */
export function onCommand(name: string, run: (arg: string) => void) {
  commandHandlers.set(name, run)
}
export function sendCommand(name: 'arrange' | 'save' | 'open', arg: string) {
  flushPending()
  send({ kind: 'command', name, arg })
}

const pickUi = (): SharedUi => {
  const s = useUi.getState()
  return Object.fromEntries(UI_KEYS.map((k) => [k, s[k]])) as SharedUi
}

async function transport(onMessage: (m: Envelope) => void): Promise<(m: Envelope) => void> {
  if (isTauri()) {
    const { emit, listen } = await import('@tauri-apps/api/event')
    await listen<Envelope>(CHANNEL, (e) => onMessage(e.payload))
    return (m) => { void emit(CHANNEL, m) }
  }
  const bc = new BroadcastChannel(CHANNEL)
  bc.onmessage = (e) => onMessage(e.data as Envelope)
  return (m) => bc.postMessage(m)
}

/** Démarre la synchronisation (les deux fenêtres l'appellent au lancement). */
export async function startWindowSync() {
  let remote = false
  const apply = (fn: () => void) => {
    remote = true
    try { fn() } finally { remote = false }
  }
  const sendAccess = () => { const { status, role, claims, participants, userId } = useCollab.getState(); send({ kind: 'access', access: { status, role, claims, participants, userId } }) }
  let pending: Project | null = null
  let base: Project | null = null
  const post = await transport((m) => {
    if (m.from === me) return
    switch (m.kind) {
      case 'hello':
        // La fenêtre Infos vient de s'ouvrir : on lui donne l'état complet, et on se replie sur le schéma
        if (WINDOW_ROLE === 'main') {
          sendAccess()
          send({ kind: 'state', project: useProject.getState().project, ui: pickUi() })
          useUi.setState({ panelsDetached: true })
        }
        break
      case 'access':
        if (WINDOW_ROLE === 'panels') useCollab.setState(m.access)
        break
      case 'saved':
        if (WINDOW_ROLE === 'panels' && JSON.stringify(m.project) === JSON.stringify(useProject.getState().project)) useProject.setState({ saved: m.saved })
        break
      case 'state':
        if (WINDOW_ROLE !== 'panels') break
        pending = null; base = null
        apply(() => {
          useProject.setState({ project: m.project, past: [], future: [], saved: false })
          useUi.setState(m.ui)
        })
        break
      case 'project':
        if (WINDOW_ROLE === 'main' && (JSON.stringify(m.base) !== JSON.stringify(useProject.getState().project) || !projectChangeAllowed(useProject.getState().project, m.project))) {
          send({ kind: 'state', project: useProject.getState().project, ui: pickUi() })
          break
        }
        pending = null; base = null
        // Modification faite dans l'autre fenêtre : annulable ici aussi
        apply(() => {
          const s = useProject.getState()
          useProject.setState({ project: m.project, past: [...s.past, s.project].slice(-200), future: [], saved: false })
        })
        break
      case 'ui':
        apply(() => useUi.setState(m.ui))
        break
      case 'bye':
        if (WINDOW_ROLE === 'main') useUi.setState({ panelsDetached: false })
        break
      case 'command':
        commandHandlers.get(m.name)?.(m.arg)
        break
    }
  })
  send = (m) => post({ ...m, from: me })

  // Envoi des modifications locales, regroupées par image (un glisser change la position à chaque image)
  flushPending = () => {
    if (pending && base) send({ kind: 'project', project: pending, base })
    pending = null; base = null
  }
  window.addEventListener('blur', flushPending)
  useProject.subscribe((s, prev) => {
    if (WINDOW_ROLE === 'main' && s.saved !== prev.saved) send({ kind: 'saved', project: s.project, saved: s.saved })
    if (remote || s.project === prev.project) return
    if (!pending) { base = prev.project; requestAnimationFrame(flushPending) }
    pending = s.project
  })
  useUi.subscribe((s, prev) => {
    if (remote || !UI_KEYS.some((k) => s[k] !== prev[k])) return
    send({ kind: 'ui', ui: pickUi() })
  })

  if (WINDOW_ROLE === 'main') useCollab.subscribe(sendAccess)

  if (WINDOW_ROLE === 'panels') {
    void rememberWindowPlace()
    send({ kind: 'hello' })
    window.addEventListener('beforeunload', () => send({ kind: 'bye' }))
  }
  if (WINDOW_ROLE === 'main' && await shouldRestorePanels()) await openPanelsWindow()
}

/**
 * Ouvre la fenêtre Infos : à la place où on l'avait laissée si cet écran est toujours branché, sinon
 * agrandie sur un autre écran que celui de la fenêtre principale (sinon sur le même écran). La fenêtre
 * est créée cachée, placée en coordonnées physiques (sûres quel que soit le facteur d'échelle de
 * chaque écran), agrandie, puis affichée.
 */
export async function openPanelsWindow() {
  if (!isTauri()) {
    window.open(`${window.location.pathname}?window=panels`, 'avd-panels', 'width=1200,height=800')
    return
  }
  const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow')
  const existing = await WebviewWindow.getByLabel(PANELS_LABEL)
  if (existing) { await existing.setFocus(); return }
  const { availableMonitors, getCurrentWindow } = await import('@tauri-apps/api/window')
  const { PhysicalPosition, PhysicalSize } = await import('@tauri-apps/api/dpi')
  const monitors = await availableMonitors()
  const inside = (m: (typeof monitors)[number], x: number, y: number) =>
    x >= m.position.x && x < m.position.x + m.size.width && y >= m.position.y && y < m.position.y + m.size.height
  // Écran de la fenêtre principale : celui qui contient son centre
  const main = getCurrentWindow()
  const pos = await main.outerPosition()
  const size = await main.outerSize()
  const cx = pos.x + size.width / 2
  const cy = pos.y + size.height / 2
  const home = monitors.find((m) => inside(m, cx, cy))
  const other = monitors.find((m) => m !== home && !(home && m.position.x === home.position.x && m.position.y === home.position.y))
  const target = other ?? home ?? monitors[0]

  const w = new WebviewWindow(PANELS_LABEL, {
    url: 'index.html?window=panels',
    title: 'AV Diagram · Infos',
    dragDropEnabled: false,
    visible: false,
    width: 1200,
    height: 800,
  })
  // Fenêtre fermée (croix du système) : la fenêtre principale réaffiche ses panneaux
  void w.once('tauri://destroyed', () => useUi.setState({ panelsDetached: false }))
  void w.once('tauri://created', async () => {
    try {
      if (target) {
        const a = target.workArea
        await w.setPosition(new PhysicalPosition(a.position.x + 40, a.position.y + 40))
        await w.setSize(new PhysicalSize(Math.max(800, a.size.width - 80), Math.max(600, a.size.height - 80)))
      }
      await restoreWindowPlace(w, !!other)
    } finally {
      await w.show()
      await w.setFocus()
    }
  })
}

/** Ferme la fenêtre Infos (depuis l'une ou l'autre fenêtre). */
export async function closePanelsWindow() {
  send({ kind: 'bye' })
  useUi.setState({ panelsDetached: false })
  if (WINDOW_ROLE === 'panels') {
    window.close()
    return
  }
  if (isTauri()) {
    const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow')
    await (await WebviewWindow.getByLabel(PANELS_LABEL))?.close()
  }
}
