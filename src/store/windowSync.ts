// Travail en double écran : une fenêtre « Schéma » (principale) et une fenêtre « Infos » (inspecteur,
// câblage, multipaires, nomenclature, alertes). Les deux fenêtres gardent le même projet et la même
// sélection : chaque modification est envoyée à l'autre. Dans l'application de bureau, le transport
// passe par les événements Tauri ; dans un navigateur (développement), par BroadcastChannel.
import { isTauri } from '@tauri-apps/api/core'
import type { Project } from '../model/types'
import { useProject } from './projectStore'
import { useUi } from './uiStore'

export type WindowRole = 'main' | 'panels'
export const WINDOW_ROLE: WindowRole = new URLSearchParams(window.location.search).get('window') === 'panels' ? 'panels' : 'main'
export const PANELS_LABEL = 'panels'

const CHANNEL = 'avd-window-sync'
const me = Math.random().toString(36).slice(2)

/** État d'interface partagé entre les fenêtres */
const UI_KEYS = ['selectedEquipment', 'selectedLinks', 'currentSheetId', 'focusRequest', 'mode', 'layer', 'hiddenSignals', 'linkView', 'view'] as const
type SharedUi = Partial<Pick<ReturnType<typeof useUi.getState>, (typeof UI_KEYS)[number]>>

export type SyncMessage =
  | { kind: 'hello' }
  | { kind: 'state'; project: Project; ui: SharedUi }
  | { kind: 'project'; project: Project }
  | { kind: 'ui'; ui: SharedUi }
  | { kind: 'bye' }
  | { kind: 'command'; name: 'arrange'; arg: string }
type Envelope = SyncMessage & { from: string }

let send: (m: SyncMessage) => void = () => {}
const commandHandlers = new Map<string, (arg: string) => void>()

/** Action à exécuter dans la fenêtre principale (ex. alignement, qui a besoin des tailles des blocs) */
export function onCommand(name: string, run: (arg: string) => void) {
  commandHandlers.set(name, run)
}
export function sendCommand(name: 'arrange', arg: string) {
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
  const post = await transport((m) => {
    if (m.from === me) return
    switch (m.kind) {
      case 'hello':
        // La fenêtre Infos vient de s'ouvrir : on lui donne l'état complet, et on se replie sur le schéma
        if (WINDOW_ROLE === 'main') {
          send({ kind: 'state', project: useProject.getState().project, ui: pickUi() })
          useUi.setState({ panelsDetached: true })
        }
        break
      case 'state':
        apply(() => {
          useProject.setState({ project: m.project, past: [], future: [], saved: true })
          useUi.setState(m.ui)
        })
        break
      case 'project':
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
  let pending: Project | null = null
  useProject.subscribe((s, prev) => {
    if (remote || s.project === prev.project) return
    if (!pending) requestAnimationFrame(() => {
      if (pending) send({ kind: 'project', project: pending })
      pending = null
    })
    pending = s.project
  })
  useUi.subscribe((s, prev) => {
    if (remote || !UI_KEYS.some((k) => s[k] !== prev[k])) return
    send({ kind: 'ui', ui: pickUi() })
  })

  if (WINDOW_ROLE === 'panels') {
    send({ kind: 'hello' })
    window.addEventListener('beforeunload', () => send({ kind: 'bye' }))
  }
}

/** Ouvre la fenêtre Infos, sur le deuxième écran s'il y en a un. */
export async function openPanelsWindow() {
  if (!isTauri()) {
    window.open(`${window.location.pathname}?window=panels`, 'avd-panels', 'width=1200,height=800')
    return
  }
  const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow')
  const existing = await WebviewWindow.getByLabel(PANELS_LABEL)
  if (existing) { await existing.setFocus(); return }
  const { availableMonitors, currentMonitor } = await import('@tauri-apps/api/window')
  const here = await currentMonitor()
  const other = (await availableMonitors()).find((m) => m.name !== here?.name || m.position.x !== here?.position.x || m.position.y !== here?.position.y)
  const target = other ?? here
  const scale = target?.scaleFactor ?? 1
  const area = target?.workArea
  const w = new WebviewWindow(PANELS_LABEL, {
    url: 'index.html?window=panels',
    title: 'AV Diagram · Infos',
    dragDropEnabled: false,
    ...(area ? { x: area.position.x / scale + 20, y: area.position.y / scale + 20, width: Math.min(1400, area.size.width / scale - 40), height: area.size.height / scale - 40 } : { width: 1200, height: 800 }),
  })
  // Fenêtre fermée (croix du système) : la fenêtre principale réaffiche ses panneaux
  void w.once('tauri://destroyed', () => useUi.setState({ panelsDetached: false }))
  if (other) void w.once('tauri://created', () => { void w.maximize() })
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
