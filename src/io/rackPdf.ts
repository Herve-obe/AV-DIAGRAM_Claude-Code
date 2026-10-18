import type { TFunction } from 'i18next'
import { checkMount, heightOf, mountedIn, rackUsage, U_MM } from '../model/racks'
import type { ExportSettings, Project, ProjectInfo, RackFace } from '../model/types'
import { sheetLayout } from './exportOptions'
import type { SheetShot } from './pdf'

/** Une baie par planche ; les grandes baies sont découpées en plages de U lisibles. */
export function rackSheets(project: Project, opts: ExportSettings, info: ProjectInfo, t: TFunction): SheetShot[] {
  const { area } = sheetLayout(opts.paper, opts.orientation, 0, info.revisions?.length ?? 0)
  const capacity = Math.max(1, Math.floor((area.h - 36) / 5))
  const shots: SheetShot[] = []
  for (const rack of Object.values(project.racks ?? {}).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))) {
    const usage = rackUsage(project, rack.id)
    const items = mountedIn(project, rack.id)
    const invalid = items.filter(eq => checkMount(project, eq.id, rack.id, eq.mount!.u, eq.mount!.face))
    const row = Math.min(8, (area.h - 36) / Math.min(capacity, rack.heightU))
    for (let high = rack.heightU; high >= 1; high -= capacity) {
      const topU = high, lowU = Math.max(1, high - capacity + 1)
      shots.push({ name: `${rack.name} · U ${topU}–${lowU}`, dataUrl: '', width: area.w, height: area.h, draw: (doc, a) => {
        const text = (value: string, x: number, y: number, width: number, size = 8) => {
          doc.setFontSize(size)
          const lines = doc.splitTextToSize(value, width) as string[]
          doc.text(lines[0] ?? '', x, y)
        }
        doc.setTextColor(30)
        doc.setFont('helvetica', 'bold')
        text(`${rack.name} · ${rack.heightU} U`, a.x, a.y + 5, a.w, 12)
        doc.setFont('helvetica', 'normal')
        const depth = rack.depthMm == null ? t('racks.unspecified') : `${rack.depthMm} mm`
        const limit = rack.maxWeightKg == null ? t('racks.unspecified') : `${rack.maxWeightKg} kg`
        text(t('racks.pdf.limits', { depth, weight: limit }), a.x, a.y + 11, a.w)
        const columnW = (a.w - 12) / 2
        ;(['front', 'rear'] as RackFace[]).forEach((face, col) => {
          const x = a.x + col * (columnW + 12), y = a.y + 23
          const rackW = Math.min(columnW - 9, row * 482.6 / U_MM)
          const gridX = x + 9 + (columnW - 9 - rackW) / 2
          text(t(`racks.face.${face}`), gridX, y - 3, rackW, 10)
          doc.setLineWidth(0.2)
          doc.setDrawColor(160)
          for (let u = topU; u >= lowU; u--) {
            const yy = y + (topU - u) * row
            text(String(u), gridX - 8, yy + row * 0.65, 8, 7)
            doc.rect(gridX, yy, rackW, row)
          }
          for (const eq of items.filter(eq => eq.mount!.face === face)) {
            const hi = eq.mount!.u + heightOf(eq) - 1, lo = eq.mount!.u
            if (lo > topU || hi < lowU) continue
            const y1 = y + (topU - Math.min(hi, topU)) * row
            const h = (Math.min(hi, topU) - Math.max(lo, lowU) + 1) * row
            doc.setFillColor(238, 242, 247)
            doc.setDrawColor(invalid.includes(eq) ? '#c22525' : '#455a70')
            doc.rect(gridX, y1 + 0.2, rackW, h - 0.4, 'FD')
            text(`${lo < lowU || hi > topU ? '… ' : ''}${eq.name}`, gridX + 2, y1 + 3.6, rackW - 4, 8)
            if (h >= 10) text(`${eq.manufacturer ?? ''} ${eq.model}`, gridX + 2, y1 + 7.6, rackW - 4, 7)
          }
        })
        const y = a.y + a.h - 9
        text(`${t('racks.usage.used', { used: usage.usedU, free: usage.freeU })} · ${t('racks.usage.weight', { kg: usage.weightKg })} · ${t('racks.usage.power', { w: usage.powerW, btu: usage.btuH })}`, a.x, y, a.w)
        text(t('racks.pdf.unknown', { weight: usage.missingWeight, power: usage.missingPower, depth: usage.missingDepth, invalid: invalid.length }), a.x, y + 5, a.w, 7)
      } })
    }
    const modules = items.flatMap(eq => (eq.modules ?? []).map(m => `${eq.name} · ${eq.slots?.find(s => s.id === m.slotId)?.name ?? m.slotId} · ${m.manufacturer ?? ''} ${m.model} · ${m.portIds.length} ports`))
    const perPage = Math.max(1, Math.floor((area.h - 16) / 10))
    for (let i = 0; i < modules.length; i += perPage) {
      const rows = modules.slice(i, i + perPage)
      shots.push({ name: `${rack.name} · ${t('modules.title')}`, dataUrl: '', width: area.w, height: area.h, draw: (doc, a) => {
        doc.setTextColor(30)
        doc.setFont('helvetica', 'bold'); doc.setFontSize(12)
        doc.text(`${rack.name} · ${t('modules.title')}`, a.x, a.y + 5)
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8)
        rows.forEach((line, n) => doc.text((doc.splitTextToSize(line, a.w) as string[]).slice(0, 2), a.x, a.y + 15 + n * 10))
      } })
    }
  }
  return shots
}
