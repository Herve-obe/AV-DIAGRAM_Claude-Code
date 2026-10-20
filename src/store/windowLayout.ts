// Disposition propre au poste : aucune de ces préférences n'appartient au projet partagé.
import { isTauri } from '@tauri-apps/api/core'
import { PhysicalPosition, PhysicalSize } from '@tauri-apps/api/dpi'
import { availableMonitors, getCurrentWindow, type Monitor, type Window } from '@tauri-apps/api/window'

interface Place { x: number; y: number; w: number; h: number; maximized: boolean; fullscreen: boolean; monitorX?: number; monitorY?: number }
type Screen = Pick<Monitor, 'position' | 'size' | 'workArea'>
const key = (label: string) => label === 'panels' ? 'avd.panelsPlace' : 'avd.mainPlace'
const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && Math.abs(n) <= 100_000
const pending = new Map<string, Promise<void>>()

function readPlace(label: string): Place | null {
  try {
    const p = JSON.parse(localStorage.getItem(key(label)) ?? 'null')
    return p && [p.x, p.y, p.w, p.h].every(finite) && p.w > 0 && p.h > 0 && typeof p.maximized === 'boolean'
      && (p.fullscreen === undefined || typeof p.fullscreen === 'boolean')
      && (p.monitorX === undefined || finite(p.monitorX)) && (p.monitorY === undefined || finite(p.monitorY))
      ? { ...p, fullscreen: p.fullscreen ?? false } : null
  } catch { return null }
}

const contains = (m: Screen, x: number, y: number) => x >= m.position.x && x < m.position.x + m.size.width && y >= m.position.y && y < m.position.y + m.size.height

/** Coordonnées physiques ; une fenêtre normale doit rester dans la zone de travail disponible. */
export function fitWindowPlace(p: Place, monitors: Screen[]): Place {
  const m = monitors.find(m => m.position.x === p.monitorX && m.position.y === p.monitorY)
    ?? monitors.find(m => contains(m, p.x + p.w / 2, p.y + p.h / 2)) ?? monitors[0]
  if (!m) return p
  const a = m.workArea, w = Math.min(p.w, Math.max(1, a.size.width - 32)), h = Math.min(p.h, Math.max(1, a.size.height - 64))
  return { ...p, w, h, x: Math.max(a.position.x, Math.min(p.x, a.position.x + a.size.width - w - 16)), y: Math.max(a.position.y, Math.min(p.y, a.position.y + a.size.height - h - 32)), monitorX: m.position.x, monitorY: m.position.y }
}

/** Les demandes sont sérialisées : une lecture ancienne ne doit pas écraser le dernier état. */
export function saveWindowPlace(w: Window): Promise<void> {
  const task = (pending.get(w.label) ?? Promise.resolve()).then(async () => {
    try {
      if (await w.isMinimized()) return
      const [pos, size, outer, maximized, fullscreen, monitors] = await Promise.all([w.outerPosition(), w.innerSize(), w.outerSize(), w.isMaximized(), w.isFullscreen(), availableMonitors()])
      const m = monitors.find(m => contains(m, pos.x + outer.width / 2, pos.y + outer.height / 2))
      const previous = readPlace(w.label)
      const bounds = (maximized || fullscreen) && previous ? previous : { x: pos.x, y: pos.y, w: size.width, h: size.height }
      const place = { ...bounds, maximized, fullscreen, monitorX: m?.position.x, monitorY: m?.position.y }
      localStorage.setItem(key(w.label), JSON.stringify(place))
    } catch { /* Une préférence indisponible ne doit jamais empêcher la fermeture du projet. */ }
  })
  pending.set(w.label, task)
  return task
}

export async function rememberWindowPlace() {
  if (!isTauri()) return
  const w = getCurrentWindow()
  let timer: ReturnType<typeof setTimeout> | undefined
  const save = () => { clearTimeout(timer); timer = setTimeout(() => void saveWindowPlace(w), 250) }
  await w.onMoved(save)
  await w.onResized(save)
  if (w.label === 'panels') await w.onCloseRequested(() => saveWindowPlace(w))
}

/** Appelée sur une fenêtre encore cachée pour éviter un saut de taille au lancement. */
export async function restoreWindowPlace(w: Window, fallbackMaximized = false): Promise<void> {
  const saved = readPlace(w.label)
  const [pos, size, monitors] = await Promise.all([w.outerPosition(), w.innerSize(), availableMonitors()])
  const place = fitWindowPlace(saved ?? { x: pos.x, y: pos.y, w: size.width, h: size.height, maximized: fallbackMaximized, fullscreen: false }, monitors)
  await w.setSize(new PhysicalSize(place.w, place.h))
  await w.setPosition(new PhysicalPosition(place.x, place.y))
  // Retenir la taille normale avant d'agrandir, y compris au tout premier lancement.
  try { localStorage.setItem(key(w.label), JSON.stringify(place)) } catch { /* Le lancement reste possible sans stockage de préférences. */ }
  if (place.maximized) await w.maximize()
  if (place.fullscreen) await w.setFullscreen(true)
}

export async function restoreMainWindow() {
  if (!isTauri()) return
  const w = getCurrentWindow()
  try {
    await restoreWindowPlace(w, true)
    await rememberWindowPlace()
  } finally { await w.show() }
}

export async function saveDesktopLayout(panels: Window | null) {
  if (!isTauri()) return
  try {
    await Promise.all([saveWindowPlace(getCurrentWindow()), ...(panels ? [saveWindowPlace(panels)] : [])])
    localStorage.setItem('avd.panelsOpen', JSON.stringify({ open: !!panels, screens: (await availableMonitors()).length }))
  } catch { /* Préférence facultative. */ }
}

export async function shouldRestorePanels(): Promise<boolean> {
  if (!isTauri()) return false
  try {
    const saved = JSON.parse(localStorage.getItem('avd.panelsOpen') ?? 'null')
    return saved?.open === true && (saved.screens === 1 || (await availableMonitors()).length > 1)
  } catch { return false }
}
