// Zoom et position propres au poste, mémorisés par projet et feuille sans modifier le .avd.
import type { Viewport } from '@xyflow/react'
const KEY = 'avd.canvasViewports'
const keyOf = (projectId: string, sheetId: string) => JSON.stringify([projectId, sheetId])
function read(): Record<string, Viewport> {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    return data && typeof data === 'object' && !Array.isArray(data) ? data as Record<string, Viewport> : {}
  } catch { return {} }
}
export function canvasViewport(projectId: string, sheetId: string): Viewport | undefined {
  const v = read()[keyOf(projectId, sheetId)]
  return v && Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.zoom) && v.zoom >= 0.1 && v.zoom <= 3 ? v : undefined
}
export function rememberCanvasViewport(projectId: string, sheetId: string, viewport: Viewport): void {
  if (![viewport.x, viewport.y, viewport.zoom].every(Number.isFinite) || viewport.zoom < 0.1 || viewport.zoom > 3) return
  const views = read(), key = keyOf(projectId, sheetId)
  delete views[key]
  views[key] = { x: viewport.x, y: viewport.y, zoom: viewport.zoom }
  try { localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(Object.entries(views).slice(-80)))) }
  catch { /* Un stockage de préférences indisponible ne bloque pas le dessin. */ }
}
