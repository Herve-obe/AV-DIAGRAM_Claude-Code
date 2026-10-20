import type { TFunction } from 'i18next'
import { footprint, onPlan, planBounds, planOf } from '../model/floorPlan'
import type { ExportSettings, Project, ProjectInfo } from '../model/types'
import { sheetLayout, tileRef } from './exportOptions'
import type { SheetShot } from './pdf'

const escapeXml = (v: string) => v.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]!)
export function planSvg(p: Project, sheetId: string, unknownLabel: string): string {
  const plan = planOf(p, sheetId), b = planBounds(p, sheetId)
  const x = b.x - 1, y = b.y - 1, w = b.w + 2, h = b.h + 3
  const px = Math.min(2400, Math.sqrt(12_000_000 * w / h))
  const hidden = new Set(plan.hiddenLayers)
  const paths = plan.background?.paths.filter(q => !hidden.has(q.layer)).map(q => `<path d="${q.points.map((pt, i) => `${i ? 'L' : 'M'}${pt.x},${pt.y}`).join(' ')}${q.closed ? 'Z' : ''}"/>`).join('') ?? ''
  const texts = plan.background?.texts.filter(q => !hidden.has(q.layer)).map(q => `<text x="${q.x}" y="${q.y}" font-size="${q.height}" transform="rotate(${q.angle},${q.x},${q.y})">${escapeXml(q.text)}</text>`).join('') ?? ''
  const eqs = onPlan(p, sheetId).map(eq => {
    const pts = footprint(eq), pl = eq.plan!
    const shape = pts.length === 1 ? `<circle cx="${pl.x}" cy="${pl.y}" r="0.2" stroke-dasharray="0.06 0.04"/>` : `<polygon points="${pts.map(pt => `${pt.x},${pt.y}`).join(' ')}"/>`
    return `<g fill="#fff" stroke="#24364b" stroke-width="0.03">${shape}</g><text x="${pl.x}" y="${pl.y + (pl.depth ?? 0.4) / 2 + 0.3}" text-anchor="middle" font-size="0.22">${escapeXml(eq.name)}</text>`
  }).join('')
  const body = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff"/><g fill="none" stroke="#89909a" stroke-width="0.02"><rect width="${plan.width}" height="${plan.height}"/>${paths}</g><g fill="#41464d" font-family="Arial">${texts}${eqs}<text x="${x + 0.3}" y="${y + h - 0.3}" font-size="0.22">${escapeXml(unknownLabel)}</text></g>`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(px)}" height="${Math.round(px * h / w)}" viewBox="0 0 ${px} ${px * h / w}"><g transform="scale(${px / w}) translate(${-x},${-y})">${body}</g></svg>`
}

export function planSheets(p: Project, opts: ExportSettings, info: ProjectInfo, t: TFunction): SheetShot[] {
  const { area } = sheetLayout(opts.paper, opts.orientation, 0, info.revisions?.length ?? 0)
  const sheets = (p.sheets ?? []).filter(s => s.plan?.background || onPlan(p, s.id).length)
  const out: SheetShot[] = []
  for (const sheet of sheets) {
    const plan = planOf(p, sheet.id), b = planBounds(p, sheet.id)
    const fixed = opts.scaleMode === 'tile'
    const k = fixed ? 1000 / plan.scale : Math.min(area.w / b.w, (area.h - 16) / b.h)
    const tw = area.w / k, th = (area.h - 16) / k
    const cols = fixed ? Math.max(1, Math.ceil(b.w / tw - 1e-9)) : 1
    const rows = fixed ? Math.max(1, Math.ceil(b.h / th - 1e-9)) : 1
    if (out.length + cols * rows > 200) throw new Error(t('plan.tooManyPages'))
    for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
      const ox = b.x + col * tw, oy = b.y + row * th
      out.push({ name: `${sheet.name} · ${t('plan.title')}`, dataUrl: '', width: area.w, height: area.h,
        tile: cols * rows > 1 ? tileRef(col, row) : undefined, draw: (doc, a) => {
          doc.setTextColor(30); doc.setFont('helvetica', 'normal'); doc.setFontSize(8)
          doc.text(t('plan.pdfScale', { scale: `${fixed ? '' : '~ '}1:${Number((1000 / k).toFixed(2))}` }), a.x, a.y + 4)
          doc.text(t('plan.unknownSize'), a.x, a.y + a.h - 1)
          doc.saveGraphicsState()
          doc.rect(a.x, a.y + 7, a.w, a.h - 16).clip().discardPath()
          const pt = (v: { x: number; y: number }) => ({ x: a.x + (v.x - ox) * k, y: a.y + 7 + (v.y - oy) * k })
          const path = (points: { x: number; y: number }[], closed = false) => {
            const list = closed ? [...points, points[0]] : points
            for (let i = 1; i < list.length; i++) { const a = pt(list[i - 1]), b = pt(list[i]); doc.line(a.x, a.y, b.x, b.y) }
          }
          doc.setDrawColor(160); doc.setLineWidth(0.15)
          path([{ x: 0, y: 0 }, { x: plan.width, y: 0 }, { x: plan.width, y: plan.height }, { x: 0, y: plan.height }], true)
          const hidden = new Set(plan.hiddenLayers)
          for (const q of plan.background?.paths ?? []) if (!hidden.has(q.layer)) path(q.points, q.closed)
          for (const q of plan.background?.texts ?? []) if (!hidden.has(q.layer)) {
            const pos = pt(q); doc.setFontSize(Math.min(120, Math.max(2, q.height * k * 72 / 25.4)))
            doc.text(q.text, pos.x, pos.y, { angle: -q.angle })
          }
          doc.setDrawColor(40); doc.setLineWidth(0.25); doc.setFontSize(7)
          for (const eq of onPlan(p, sheet.id)) {
            const points = footprint(eq), c = pt(eq.plan!)
            if (points.length > 1) path(points, true)
            else { doc.setLineDashPattern([1, 0.8], 0); doc.circle(c.x, c.y, 2); doc.setLineDashPattern([], 0) }
            doc.text(eq.name, c.x, c.y + ((eq.plan!.depth ?? 0) / 2 * k) + 3, { align: 'center' })
          }
          doc.restoreGraphicsState()
        } })
    }
  }
  return out
}
