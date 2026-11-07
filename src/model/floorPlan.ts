import type { CadDrawing, Equipment, FloorPlan, PlanPlacement, Project } from './types'

export const DEFAULT_PLAN: FloorPlan = { width: 20, height: 12, grid: 0.1, scale: 50 }
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= 1_000_000
const positive = (v: unknown): v is number => finite(v) && v > 0 && v <= 10_000
const point = (v: unknown) => object(v) && finite(v.x) && finite(v.y)

export function isPlanPlacement(v: unknown): v is PlanPlacement {
  return object(v) && point(v) && finite(v.angle)
    && (v.width === undefined || positive(v.width)) && (v.depth === undefined || positive(v.depth))
}
export function isCadDrawing(v: unknown): v is CadDrawing {
  if (!object(v) || typeof v.name !== 'string' || !positive(v.width) || !positive(v.height)
    || !Array.isArray(v.paths) || !Array.isArray(v.texts) || v.paths.length + v.texts.length > 25_000) return false
  let count = 0
  return v.paths.every(p => object(p) && typeof p.layer === 'string' && (p.closed === undefined || typeof p.closed === 'boolean')
    && Array.isArray(p.points) && p.points.length >= 2 && (count += p.points.length) <= 200_000 && p.points.every(point))
    && v.texts.every(t => object(t) && typeof t.layer === 'string' && typeof t.text === 'string' && t.text.length <= 2000
      && point(t) && positive(t.height) && finite(t.angle))
}
export function isFloorPlan(v: unknown): v is FloorPlan {
  return object(v) && positive(v.width) && positive(v.height) && finite(v.grid) && v.grid >= 0 && v.grid <= 100
    && positive(v.scale) && (v.background === undefined || isCadDrawing(v.background))
    && (v.hiddenLayers === undefined || (Array.isArray(v.hiddenLayers) && v.hiddenLayers.length <= 25_000 && v.hiddenLayers.every(s => typeof s === 'string')))
}
export const planOf = (p: Project, sheetId: string): FloorPlan => p.sheets?.find(s => s.id === sheetId)?.plan ?? DEFAULT_PLAN
export const onPlan = (p: Project, sheetId: string) => Object.values(p.equipment).filter(e => e.sheetId === sheetId && e.plan)
export const snapMetres = (v: number, grid: number) => grid > 0 ? Math.round(Math.round(v / grid) * grid * 1e6) / 1e6 : v
export const metresBetween = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(b.x - a.x, b.y - a.y)

export function updateFloorPlan(p: Project, sheetId: string, patch: Partial<FloorPlan>): Project {
  const plan = { ...planOf(p, sheetId), ...patch }
  if (!isFloorPlan(plan) || !p.sheets?.some(s => s.id === sheetId)) return p
  return { ...p, sheets: p.sheets.map(s => s.id === sheetId ? { ...s, plan } : s), updatedAt: new Date().toISOString() }
}
export function placeOnPlan(p: Project, id: string, plan: PlanPlacement | undefined): Project {
  const eq = p.equipment[id]
  if (!eq || (plan !== undefined && !isPlanPlacement(plan))) return p
  return { ...p, equipment: { ...p.equipment, [id]: { ...eq, plan } }, updatedAt: new Date().toISOString() }
}

/** Coins de l'empreinte réelle ; une dimension inconnue reste un symbole ponctuel. */
export function footprint(eq: Equipment): { x: number; y: number }[] {
  const p = eq.plan
  if (!p) return []
  if (!p.width || !p.depth) return [{ x: p.x, y: p.y }]
  const a = p.angle * Math.PI / 180, c = Math.cos(a), s = Math.sin(a)
  return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([x, y]) => ({ x: p.x + x * p.width! / 2 * c - y * p.depth! / 2 * s, y: p.y + x * p.width! / 2 * s + y * p.depth! / 2 * c }))
}
export function planBounds(p: Project, sheetId: string) {
  const plan = planOf(p, sheetId)
  let x = 0, y = 0, right = plan.width, bottom = plan.height
  for (const eq of onPlan(p, sheetId)) for (const pt of footprint(eq)) {
    x = Math.min(x, pt.x - 0.3); y = Math.min(y, pt.y - 0.3)
    right = Math.max(right, pt.x + 0.3); bottom = Math.max(bottom, pt.y + 0.3)
  }
  return { x, y, w: right - x, h: bottom - y }
}
