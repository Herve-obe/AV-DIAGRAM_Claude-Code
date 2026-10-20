import { footprint, onPlan, planOf } from '../model/floorPlan'
import type { CadDrawing, Project } from '../model/types'
import { drawingDxf } from './cad'
import { saveContent, slug } from './files'
import { labelPoint, routeAll, type Point, type Rect, type RouteEnd } from '../model/routing'

export interface CadDiagramGeometry { boxes: Map<string, Rect & { ports: Map<string, RouteEnd> }>; routes: Map<string, Point[]> }

export function planDrawing(p: Project, sheetId: string): CadDrawing {
  const plan = planOf(p, sheetId), hidden = new Set(plan.hiddenLayers)
  const d: CadDrawing = { name: p.name, width: plan.width, height: plan.height, paths: (plan.background?.paths ?? []).filter(q => !hidden.has(q.layer)).map(q => ({ ...q })), texts: (plan.background?.texts ?? []).filter(q => !hidden.has(q.layer)).map(q => ({ ...q })) }
  d.paths.push({ layer: 'AVD_PLAN', closed: true, points: [{ x: 0, y: 0 }, { x: plan.width, y: 0 }, { x: plan.width, y: plan.height }, { x: 0, y: plan.height }] })
  for (const eq of onPlan(p, sheetId)) {
    let pts = footprint(eq)
    const unknown = pts.length === 1
    if (unknown) pts = Array.from({ length: 24 }, (_, i) => ({ x: eq.plan!.x + 0.2 * Math.cos(i * 2 * Math.PI / 24), y: eq.plan!.y + 0.2 * Math.sin(i * 2 * Math.PI / 24) }))
    d.paths.push({ layer: unknown ? 'AVD_SYMBOL_UNKNOWN_SIZE' : 'AVD_EQUIPMENT', points: pts, closed: true })
    d.texts.push({ layer: 'AVD_LABELS', x: eq.plan!.x, y: eq.plan!.y + (eq.plan!.depth ?? 0.4) / 2 + 0.25, text: `${eq.name} | ${eq.manufacturer ?? ''} ${eq.model}`, height: 0.2, angle: 0 })
  }
  d.texts.push({ layer: 'AVD_NOTES', x: 0, y: plan.height + 0.5, height: 0.2, angle: 0, text: 'AVD_SYMBOL_UNKNOWN_SIZE : dimensions non renseignées / unknown dimensions' })
  return d
}

/** Schéma de principe : géométrie logique distincte des dimensions physiques du plan. */
export function diagramDrawing(p: Project, sheetId: string, measured?: CadDiagramGeometry): CadDrawing {
  const d: CadDrawing = { name: p.name, width: 1, height: 1, paths: [], texts: [] }
  const boxes = new Map<string, Rect & { ports: Map<string, RouteEnd> }>()
  for (const eq of Object.values(p.equipment).filter(e => e.sheetId === sheetId)) {
    const actual = measured?.boxes.get(eq.id)
    if (measured && !actual) continue
    const x = (actual?.x ?? eq.position.x) / 100, y = (actual?.y ?? eq.position.y) / 100
    const ins = eq.ports.filter(q => q.direction === 'in'), outs = eq.ports.filter(q => q.direction !== 'in')
    const vertical = eq.rotation === 90 || eq.rotation === 270
    const w = actual ? actual.w / 100 : vertical ? Math.max(2.8,Math.max(ins.length,outs.length) * .9) : 2.8
    const h = actual ? actual.h / 100 : vertical ? 1.9 : 0.9 + Math.max(ins.length, outs.length) * 0.25
    const ports = new Map<string, RouteEnd>()
    d.paths.push({ layer: 'AVD_BLOCKS', closed: true, points: [{ x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h }] })
    d.texts.push({ layer: 'AVD_LABELS', x: x + 0.15, y: y + 0.25, height: 0.15, angle: 0, text: eq.name }, { layer: 'AVD_MODELS', x: x + 0.15, y: y + 0.5, height: 0.12, angle: 0, text: `${eq.manufacturer ?? ''} ${eq.model}`.trim() })
    for (const [side, list] of [ins, outs].entries()) for (const [i, q] of list.entries()) {
      const real = actual?.ports.get(q.id)
      if (actual && !real) continue
      const opposite = eq.rotation === 180 || eq.rotation === 270, end = opposite ? 1 - side : side
      const pos: RouteEnd = real ? { ...real,x:real.x / 100,y:real.y / 100 } : vertical ? { x:x + (i + .5) * w / Math.max(1,list.length),y:y + end * h,side:end ? 'bottom' : 'top' } : {x:x + end * w,y:y + .85 + i * .25,side:end ? 'right' : 'left'}
      ports.set(q.id, pos)
      d.texts.push({ layer: 'AVD_PORTS', x: pos.x + (pos.side === 'right' ? -w / 2 : .04), y: pos.y + (pos.side === 'top' ? .15 : -.03), height: 0.1, angle: 0, text: q.name })
    }
    boxes.set(eq.id, { x, y, w, h, ports }); d.width = Math.max(d.width, x + w); d.height = Math.max(d.height, y + h)
  }
  for (const link of Object.values(p.links)) {
    const a = boxes.get(link.source.equipmentId)?.ports.get(link.source.portId), b = boxes.get(link.target.equipmentId)?.ports.get(link.target.portId)
    if (!a || !b) continue
    const live = measured?.routes.get(link.id)
    const points = (live ?? routeAll([...boxes.values()].map(b => ({x:b.x * 100,y:b.y * 100,w:b.w * 100,h:b.h * 100})),[{id:link.id,source:{...a,x:a.x * 100,y:a.y * 100},target:{...b,x:b.x * 100,y:b.y * 100},bendX:link.bendX,bendY:link.bendY}]).get(link.id)!).map(pt => ({x:pt.x / 100,y:pt.y / 100}))
    d.paths.push({ layer: 'AVD_LINKS', points })
    const label = labelPoint(points)
    d.texts.push({ layer: 'AVD_CABLE_LABELS', x:label.x, y:label.y - 0.1, height: 0.1, angle: 0, text: link.label })
  }
  d.texts.push({ layer: 'AVD_NOTES', x: 0, y: d.height + 0.5, height: 0.18, angle: 0, text: 'Schéma de principe, sans échelle physique / schematic, not a physical scale drawing' })
  return d
}
export async function exportCad(p: Project, sheetId: string, plan: boolean, measured?: CadDiagramGeometry) {
  return saveContent(`${slug(p.name)}-${plan ? 'plan' : 'synoptique'}.dxf`, drawingDxf(plan ? planDrawing(p, sheetId) : diagramDrawing(p, sheetId,measured)), 'application/dxf')
}
