import DxfParser, { type IEntity, type IInsertEntity, type ILineEntity, type ILwpolylineEntity, type IPolylineEntity, type ICircleEntity, type IArcEntity, type IEllipseEntity, type ITextEntity, type IMtextEntity } from 'dxf-parser'
import { isCadDrawing } from '../model/floorPlan'
import type { CadDrawing } from '../model/types'
import type { PdfPage } from './pdfImport/extract'

type Point = { x: number; y: number }
type Matrix = [number, number, number, number, number, number]
export interface CadImport { drawing: CadDrawing; factor: number; declaredUnit: number; skipped: Record<string, number>; curves: number; inserts: { name: string; x: number; y: number; w: number; h: number }[]; hiddenLayers: string[] }
export const CAD_UNITS = [{ code: 4, name: 'mm', factor: 0.001 }, { code: 5, name: 'cm', factor: 0.01 }, { code: 6, name: 'm', factor: 1 }, { code: 1, name: 'in', factor: 0.0254 }, { code: 2, name: 'ft', factor: 0.3048 }] as const
const mul = (m: Matrix, n: Matrix): Matrix => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]]
const apply = (m: Matrix, p: Point): Point => ({ x: m[0] * p.x + m[2] * p.y + m[4], y: m[1] * p.x + m[3] * p.y + m[5] })
const identity: Matrix = [1, 0, 0, 1, 0, 0]
const decodeText = (s: string) => s.replace(/\\U\+([0-9a-f]{4})/gi, (_, n: string) => String.fromCharCode(parseInt(n, 16))).replace(/\\P/g, '\n').replace(/\\[A-Za-z][^;]*;/g, '').replace(/[{}]/g, '').replace(/%%d/gi, '°').replace(/%%p/gi, '±').slice(0, 2000)
function bounds(points: Point[]) {
  let x = Infinity, y = Infinity, right = -Infinity, bottom = -Infinity
  for (const p of points) { x = Math.min(x, p.x); y = Math.min(y, p.y); right = Math.max(right, p.x); bottom = Math.max(bottom, p.y) }
  return { x, y, w: right - x, h: bottom - y }
}

/** Parser isolé dans un worker par l'interface ; aucune référence externe n'est ouverte. */
export function parseCad(text: string, name: string, unitOverride?: number): CadImport {
  if (/^AC10\d\d|AutoCAD Binary DXF|\0/.test(text.slice(0, 80))) throw new Error('binary')
  if (text.length > 10_000_000) throw new Error('large')
  if (!/\bSECTION\b/.test(text) || !/\bEOF\s*$/.test(text)) throw new Error('invalid')
  const parsed = new DxfParser().parseSync(text)
  if (!parsed || !parsed.entities) throw new Error('invalid')
  const code = Number(parsed.header?.$INSUNITS ?? 0)
  const factor = CAD_UNITS.find(u => u.code === (unitOverride ?? code))?.factor
  if (factor === undefined) throw new Error('units')
  const paths: CadDrawing['paths'] = [], texts: CadDrawing['texts'] = [], inserts: CadImport['inserts'] = []
  const skipped: Record<string, number> = {}
  let count = 0, points = 0, curves = 0
  const skip = (type: string) => { skipped[type] = (skipped[type] ?? 0) + 1 }
  const add = (pts: Point[], layer: string, m: Matrix, closed = false) => {
    points += pts.length
    if (points > 200_000 || paths.length + texts.length >= 25_000) throw new Error('large')
    const list = pts.map(p => apply(m, p))
    if (list.length < 2 || list.some(p => !Number.isFinite(p.x) || !Number.isFinite(p.y))) throw new Error('invalid')
    paths.push({ layer, points: list, ...(closed ? { closed: true } : {}) })
  }
  const arc = (center: Point, radius: number, start: number, sweep: number, m: Matrix): Point[] => {
    if (!(radius > 0) || !Number.isFinite(start) || !Number.isFinite(sweep)) throw new Error('invalid')
    const metres = radius * factor * Math.max(Math.hypot(m[0], m[1]), Math.hypot(m[2], m[3]))
    const step = Math.max(0.0001, 2 * Math.acos(Math.max(-1, Math.min(1, 1 - 0.001 / metres))))
    const n = Math.max(8, Math.ceil(Math.abs(sweep) / step))
    if (n > 4096) throw new Error('large')
    return Array.from({ length: n + 1 }, (_, i) => ({ x: center.x + radius * Math.cos(start + sweep * i / n), y: center.y + radius * Math.sin(start + sweep * i / n) }))
  }
  const visit = (entities: IEntity[], parent: Matrix, ancestry: string[], inherited = '0') => {
    if (ancestry.length > 16) throw new Error('recursive')
    for (const e of entities) {
      if (++count > 25_000) throw new Error('large')
      const layer = e.layer === '0' || !e.layer ? inherited : e.layer
      const extrusion = e as IEntity & { extrusionDirection?: { x: number; y: number; z: number }; extrusionDirectionX?: number; extrusionDirectionY?: number; extrusionDirectionZ?: number }
      const normal = extrusion.extrusionDirection ?? { x: extrusion.extrusionDirectionX ?? 0, y: extrusion.extrusionDirectionY ?? 0, z: extrusion.extrusionDirectionZ ?? 1 }
      if (Math.abs(normal.x) > 1e-8 || Math.abs(normal.y) > 1e-8) { skip('3D'); continue }
      const m = ['CIRCLE', 'ARC', 'LWPOLYLINE', 'POLYLINE', 'INSERT'].includes(e.type) && normal.z < 0 ? mul(parent, [-1, 0, 0, 1, 0, 0]) : parent
      if (e.type === 'INSERT') {
        const q = e as IInsertEntity, block = parsed.blocks?.[q.name]
        if (!block?.entities?.length || block.xrefPath) { skip(block?.xrefPath ? 'XREF' : 'INSERT'); continue }
        if (ancestry.includes(q.name)) throw new Error('recursive')
        const ncols = Math.max(1, q.columnCount || 1), nrows = Math.max(1, q.rowCount || 1)
        if (!Number.isInteger(ncols) || !Number.isInteger(nrows) || ncols * nrows > 25_000) throw new Error('large')
        const a = (q.rotation ?? 0) * Math.PI / 180, c = Math.cos(a), s = Math.sin(a)
        const rotate = mul(m, [c, s, -s, c, q.position?.x ?? 0, q.position?.y ?? 0])
        for (let row = 0; row < nrows; row++) for (let col = 0; col < ncols; col++) {
          const sx = q.xScale ?? 1, sy = q.yScale ?? 1
          const transform = mul(rotate, [sx, 0, 0, sy, col * (q.columnSpacing || 0) - (block.position?.x ?? 0) * sx, row * (q.rowSpacing || 0) - (block.position?.y ?? 0) * sy])
          const first = paths.length
          visit(block.entities, transform, [...ancestry, q.name], layer)
          if (!ancestry.length && first < paths.length) { const box = bounds(paths.slice(first).flatMap(p => p.points)); if (box.w > 0 && box.h > 0) inserts.push({ name: q.name, ...box }) }
        }
      } else if (e.type === 'LINE') add((e as ILineEntity).vertices, layer, m)
      else if (e.type === 'LWPOLYLINE' || e.type === 'POLYLINE') {
        const q = e as ILwpolylineEntity & IPolylineEntity
        if (!q.vertices?.length) { skip(e.type); continue }
        if ('is3dPolyline' in q && q.is3dPolyline) { skip('3D'); continue }
        const pts: Point[] = [], closed = !!q.shape
        const vertices = q.vertices as (Point & { bulge?: number })[]
        for (let i = 0; i < vertices.length - (closed ? 0 : 1); i++) {
          const a = vertices[i], b = vertices[(i + 1) % vertices.length], bulge = a.bulge ?? 0
          if (!pts.length) pts.push(a)
          const dx = b.x - a.x, dy = b.y - a.y, chord = Math.hypot(dx, dy)
          if (bulge && chord > 0) {
            curves++
            const offset = chord * (1 - bulge * bulge) / (4 * bulge)
            const center = { x: (a.x + b.x) / 2 - dy / chord * offset, y: (a.y + b.y) / 2 + dx / chord * offset }
            pts.push(...arc(center, chord * (1 + bulge * bulge) / (4 * Math.abs(bulge)), Math.atan2(a.y - center.y, a.x - center.x), 4 * Math.atan(bulge), m).slice(1))
          } else pts.push(b)
        }
        if (pts.length >= 2) add(pts, layer, m, closed)
      } else if (e.type === 'CIRCLE' || e.type === 'ARC') {
        curves++
        const q = e as ICircleEntity & IArcEntity
        const start = e.type === 'CIRCLE' ? 0 : q.startAngle
        const sweep = e.type === 'CIRCLE' ? 2 * Math.PI : ((q.endAngle - q.startAngle + 2 * Math.PI) % (2 * Math.PI) || 2 * Math.PI)
        add(arc(q.center, q.radius, start, sweep, m), layer, m, e.type === 'CIRCLE')
      } else if (e.type === 'ELLIPSE') {
        curves++
        const q = e as IEllipseEntity, radius = Math.hypot(q.majorAxisEndPoint.x, q.majorAxisEndPoint.y)
        const angle = Math.atan2(q.majorAxisEndPoint.y, q.majorAxisEndPoint.x), c = Math.cos(angle), s = Math.sin(angle)
        const sweep = ((q.endAngle - q.startAngle + 2 * Math.PI) % (2 * Math.PI)) || 2 * Math.PI
        const pts = arc({ x: 0, y: 0 }, radius, q.startAngle || 0, sweep, m).map(p => ({ x: q.center.x + c * p.x - s * p.y * q.axisRatio, y: q.center.y + s * p.x + c * p.y * q.axisRatio }))
        add(pts, layer, m, Math.abs(sweep - 2 * Math.PI) < 1e-8)
      } else if (e.type === 'TEXT' || e.type === 'MTEXT') {
        const q = e as ITextEntity & IMtextEntity
        const pos = apply(m, e.type === 'TEXT' ? q.startPoint : q.position)
        const height = (e.type === 'TEXT' ? q.textHeight : q.height) * Math.hypot(m[0], m[1])
        if (!Number.isFinite(height) || height <= 0) { skip(e.type); continue }
        texts.push({ layer, ...pos, text: decodeText(q.text ?? ''), height, angle: (q.rotation || 0) + Math.atan2(m[1], m[0]) * 180 / Math.PI })
      } else skip(e.type)
    }
  }
  visit(parsed.entities, identity, [])
  if (!paths.length && !texts.length) throw new Error('empty')
  // Le parser ignore certains types ; les relever aussi dans les sections graphiques du fichier.
  const lines = text.split(/\r\n|\n|\r/)
  let section = '', nextSection = false
  const ignoredInFile: Record<string, number> = {}
  const rendered = new Set(['LINE', 'LWPOLYLINE', 'POLYLINE', 'VERTEX', 'SEQEND', 'INSERT', 'ARC', 'CIRCLE', 'ELLIPSE', 'TEXT', 'MTEXT', 'BLOCK', 'ENDBLK', 'ENDSEC'])
  for (let i = 0; i + 1 < lines.length; i += 2) {
    const group = lines[i].trim(), value = lines[i + 1].trim()
    if (group === '0' && value === 'SECTION') { nextSection = true; continue }
    if (nextSection && group === '2') { section = value; nextSection = false; continue }
    if (group === '0' && value === 'ENDSEC') { section = ''; continue }
    if (['ENTITIES', 'BLOCKS'].includes(section) && group === '0' && !rendered.has(value)) ignoredInFile[value] = (ignoredInFile[value] || 0) + 1
  }
  for (const [type, n] of Object.entries(ignoredInFile)) skipped[type] = Math.max(n, skipped[type] || 0)
  const b = bounds([...paths.flatMap(p => p.points), ...texts.map(p => ({ x: p.x, y: p.y + p.height }))])
  const convert = (p: Point) => ({ x: (p.x - b.x) * factor, y: (b.y + b.h - p.y) * factor })
  const drawing: CadDrawing = { name, width: Math.max(0.001, b.w * factor), height: Math.max(0.001, b.h * factor), paths: paths.map(p => ({ ...p, points: p.points.map(convert) })), texts: texts.map(p => ({ ...p, ...convert(p), height: p.height * factor, angle: -p.angle })) }
  if (!isCadDrawing(drawing)) throw new Error('large')
  return { drawing, factor, declaredUnit: code, skipped, curves, inserts: inserts.map(q => ({ name: q.name, x: (q.x - b.x) * factor, y: (b.y + b.h - q.y - q.h) * factor, w: q.w * factor, h: q.h * factor })), hiddenLayers: Object.values(parsed.tables?.layer?.layers ?? {}).filter(l => l.visible === false || l.frozen).map(l => l.name) }
}

export function rescaleCad(input: CadImport, factor: number): CadImport {
  if (!(factor > 0) || !Number.isFinite(factor)) throw new Error('invalid')
  const ratio = factor / input.factor
  const point = (p: Point) => ({ x: p.x * ratio, y: p.y * ratio })
  const d = input.drawing
  const drawing = { ...d, width: d.width * ratio, height: d.height * ratio, paths: d.paths.map(p => ({ ...p, points: p.points.map(point) })), texts: d.texts.map(t => ({ ...t, ...point(t), height: t.height * ratio })) }
  if (!isCadDrawing(drawing)) throw new Error('large')
  return { ...input, drawing, factor, inserts: input.inserts.map(q => ({ ...q, ...point(q), w: q.w * ratio, h: q.h * ratio })) }
}

/** Adapte le dessin au même moteur de reconnaissance et de vérification que l'import PDF. */
export function cadPage(input: CadImport): PdfPage {
  const d = input.drawing, k = 1000 / Math.max(d.width, d.height)
  const hidden = new Set(input.hiddenLayers)
  const page: PdfPage = { index: 1, width: d.width * k, height: d.height * k, rects: [], texts: [], segments: [], images: 0 }
  for (const p of d.paths.filter(p => !hidden.has(p.layer))) {
    const b = bounds(p.points)
    const rectangle = p.closed && p.points.length <= 6 && b.w > 0 && b.h > 0 && p.points.every(q => (Math.abs(q.x - b.x) < 1e-6 || Math.abs(q.x - b.x - b.w) < 1e-6) && (Math.abs(q.y - b.y) < 1e-6 || Math.abs(q.y - b.y - b.h) < 1e-6))
    if (rectangle) page.rects.push({ x: b.x * k, y: b.y * k, w: b.w * k, h: b.h * k, stroke: '#000000', fill: null })
    else { const pts = p.closed ? [...p.points, p.points[0]] : p.points; for (let i = 1; i < pts.length; i++) page.segments.push({ x1: pts[i - 1].x * k, y1: pts[i - 1].y * k, x2: pts[i].x * k, y2: pts[i].y * k, color: '#000000', width: 1 }) }
  }
  for (const t of d.texts.filter(t => !hidden.has(t.layer))) for (const [i, str] of t.text.split('\n').entries()) page.texts.push({ str, x: t.x * k, y: (t.y + (i - 1) * t.height) * k, w: Math.max(t.height, t.height * str.length * 0.55) * k, h: t.height * k })
  for (const q of input.inserts) {
    if (q.w * k < 5 || q.h * k < 5) continue
    const b = { x: q.x * k, y: q.y * k, w: q.w * k, h: q.h * k, stroke: '#000000', fill: null }
    if (!page.rects.some(r => Math.abs(r.x - b.x) < 2 && Math.abs(r.y - b.y) < 2 && Math.abs(r.w - b.w) < 2 && Math.abs(r.h - b.h) < 2)) page.rects.push(b)
    if (!page.texts.some(t => t.x >= b.x && t.x <= b.x + b.w && t.y >= b.y && t.y <= b.y + b.h)) page.texts.push({ str: q.name, x: b.x + b.w * 0.1, y: b.y + b.h * 0.4, w: b.w * 0.8, h: Math.min(14, b.h * 0.15) })
  }
  // Un DXF n'a pas de contour de page : une marge évite de prendre les plus grands blocs pour le cartouche.
  const margin = Math.max(page.width, page.height) * 0.1
  page.width += 2 * margin; page.height += 2 * margin
  page.rects = page.rects.map(r => ({ ...r, x: r.x + margin, y: r.y + margin }))
  page.texts = page.texts.map(t => ({ ...t, x: t.x + margin, y: t.y + margin }))
  page.segments = page.segments.map(s => ({ ...s, x1: s.x1 + margin, x2: s.x2 + margin, y1: s.y1 + margin, y2: s.y2 + margin }))
  return page
}

/** DXF 2007 UTF-8, en mètres. Les courbes du fond restent les polylignes affichées. */
export function drawingDxf(d: CadDrawing): string {
  if (!isCadDrawing(d)) throw new Error('invalid')
  const lines: (string | number)[] = []
  const tag = (code: number, value: string | number) => { lines.push(code, typeof value === 'string' ? value.replace(/[\r\n\0]/g, ' ') : Number(value.toFixed(9))) }
  const names = new Map<string, string>(), used = new Set<string>()
  for (const e of [...d.paths, ...d.texts]) if (!names.has(e.layer)) {
    const base = (e.layer.replace(/[<>/\\":;?*|=\r\n\0]/g, '_').slice(0, 220) || '0')
    let name = base, index = 1; while (used.has(name.toLowerCase())) name = `${base}_${index++}`
    names.set(e.layer, name); used.add(name.toLowerCase())
  }
  tag(0, 'SECTION'); tag(2, 'HEADER'); tag(9, '$ACADVER'); tag(1, 'AC1021'); tag(9, '$DWGCODEPAGE'); tag(3, 'UTF-8'); tag(9, '$INSUNITS'); tag(70, 6); tag(0, 'ENDSEC')
  tag(0, 'SECTION'); tag(2, 'TABLES'); tag(0, 'TABLE'); tag(2, 'LAYER'); tag(70, names.size)
  for (const name of names.values()) { tag(0, 'LAYER'); tag(2, name); tag(70, 0); tag(62, 7); tag(6, 'CONTINUOUS') }
  tag(0, 'ENDTAB'); tag(0, 'ENDSEC'); tag(0, 'SECTION'); tag(2, 'ENTITIES')
  for (const p of d.paths) {
    tag(0, 'LWPOLYLINE'); tag(100, 'AcDbEntity'); tag(8, names.get(p.layer)!); tag(100, 'AcDbPolyline'); tag(90, p.points.length); tag(70, p.closed ? 1 : 0)
    for (const pt of p.points) { tag(10, pt.x); tag(20, -pt.y) }
  }
  for (const t of d.texts) { tag(0, 'TEXT'); tag(100, 'AcDbEntity'); tag(8, names.get(t.layer)!); tag(100, 'AcDbText'); tag(10, t.x); tag(20, -t.y); tag(30, 0); tag(40, t.height); tag(1, t.text); tag(50, -t.angle) }
  tag(0, 'ENDSEC'); tag(0, 'EOF')
  return lines.join('\r\n') + '\r\n'
}
