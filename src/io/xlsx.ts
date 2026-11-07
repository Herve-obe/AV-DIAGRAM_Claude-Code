import type { TFunction } from 'i18next'
import type { CellValue } from 'exceljs'
import { buildBom } from '../model/bom'
import { connectorLabel } from '../model/connectors'
import { getCable } from '../model/cables'
import { findPort } from '../model/rules'
import type { Project } from '../model/types'
import { saveContent, slug } from './files'
import { deploymentTables } from './deploymentExport'

export type TableCell = string | number | boolean | null | { kind: 'formula' | 'unsupported' }
export interface WorkbookTable { name: string; rows: TableCell[][] }
export interface WorkbookRead { sheets: WorkbookTable[] }
export const PATCH_KEYS = ['sourceEquipment', 'sourcePort', 'targetEquipment', 'targetPort', 'lengthM', 'channels', 'notes', 'sourceEquipmentId', 'sourcePortId', 'targetEquipmentId', 'targetPortId', 'linkId'] as const
export type PatchKey = typeof PATCH_KEYS[number]

/** Taille décompressée contrôlée avant de laisser ExcelJS lire une archive XLSX. */
export function checkXlsxArchive(bytes: Uint8Array): void {
  if (bytes.length > 10_000_000) throw new Error('large')
  if (bytes.length >= 2 && bytes[0] === 0xd0 && bytes[1] === 0xcf) throw new Error('encrypted')
  if (bytes.length < 22) throw new Error('invalid')
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  let end = -1
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) if (view.getUint32(i, true) === 0x06054b50 && i + 22 + view.getUint16(i + 20, true) === bytes.length) { end = i; break }
  if (end < 0 || view.getUint16(end + 4, true) || view.getUint16(end + 6, true)) throw new Error('invalid')
  const count = view.getUint16(end + 10, true), start = view.getUint32(end + 16, true), size = view.getUint32(end + 12, true)
  if (!count || count > 2000 || view.getUint16(end + 8, true) !== count || start + size !== end) throw new Error('large')
  let offset = start, expanded = 0
  for (let n = 0; n < count; n++) {
    if (offset + 46 > end || view.getUint32(offset, true) !== 0x02014b50) throw new Error('invalid')
    if (view.getUint16(offset + 8, true) & 1) throw new Error('encrypted')
    const unpacked = view.getUint32(offset + 24, true)
    expanded += unpacked
    if (unpacked === 0xffffffff || expanded > 50_000_000) throw new Error('large')
    offset += 46 + view.getUint16(offset + 28, true) + view.getUint16(offset + 30, true) + view.getUint16(offset + 32, true)
  }
  if (offset !== end) throw new Error('invalid')
}

function scalar(value: CellValue): TableCell {
  if (value === null || value === undefined) return null
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value
  if (value instanceof Date) return value.toISOString()
  if ('formula' in value || 'sharedFormula' in value) return { kind: 'formula' }
  if ('richText' in value) return value.richText.map(t => t.text).join('')
  if ('text' in value) return String(value.text)
  return { kind: 'unsupported' }
}
export async function readWorkbook(bytes: Uint8Array): Promise<WorkbookRead> {
  checkXlsxArchive(bytes)
  const ExcelJS = (await import('exceljs')).default
  const book = new ExcelJS.Workbook()
  await book.xlsx.load(bytes as unknown as Parameters<typeof book.xlsx.load>[0])
  const sheets: WorkbookTable[] = []
  let cells = 0
  for (const s of book.worksheets) {
    if (s.actualRowCount > 10_000 || s.columnCount > 100 || s.rowCount > 10_000) throw new Error('large')
    const rows: TableCell[][] = []
    s.eachRow({ includeEmpty: true }, row => {
      const values: TableCell[] = []
      row.eachCell({ includeEmpty: true }, cell => {
        if (++cells > 200_000) throw new Error('large')
        const val = scalar(cell.value)
        if (typeof val === 'string' && val.length > 10_000) throw new Error('large')
        values.push(val)
      })
      rows.push(values)
    })
    sheets.push({ name: s.name, rows })
  }
  return { sheets }
}

export async function workbookBytes(project: Project, t: TFunction): Promise<Uint8Array> {
  const ExcelJS = (await import('exceljs')).default
  const book = new ExcelJS.Workbook()
  book.creator = 'AV Diagram'; book.created = new Date(); book.title = project.name
  const make = (name: string, headers: string[], rows: (string | number | null)[][], widths: number[], hint: string) => {
    const base = name.replace(/[\\/*?:[\]]/g, '-').slice(0, 31)
    let unique = base, suffix = 2
    while (book.worksheets.some(s => s.name.toLowerCase() === unique.toLowerCase())) unique = `${base.slice(0, 27)} ${suffix++}`
    const sheet = book.addWorksheet(unique, { views: [{ state: 'frozen', ySplit: 5, xSplit: 2, showGridLines: false }] })
    sheet.getCell('A1').value = project.name; sheet.getCell('A1').font = { name: 'Arial', size: 14, bold: true }
    sheet.getCell('A2').value = name; sheet.getCell('A3').value = hint
    sheet.getCell('A4').value = new Date(); sheet.getCell('A4').numFmt = 'dd/mm/yyyy hh:mm'
    sheet.getRow(5).values = headers
    for (const data of rows) sheet.addRow(data)
    sheet.autoFilter = { from: { row: 5, column: 1 }, to: { row: Math.max(5, 5 + rows.length), column: headers.length } }
    widths.forEach((w, i) => { sheet.getColumn(i + 1).width = w })
    sheet.eachRow((r, n) => { r.height = n === 5 ? 32 : 28; r.eachCell({ includeEmpty: true }, cell => { cell.font = n === 5 ? { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } } : { name: 'Arial', size: 10 }; cell.alignment = { vertical: 'middle', wrapText: true }; if (n === 5) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF24364B' } } }) })
    return sheet
  }
  const links = Object.values(project.links).sort((a, b) => a.label.localeCompare(b.label))
  const cableRows = links.map(l => {
    const a = project.equipment[l.source.equipmentId], b = project.equipment[l.target.equipmentId], ap = findPort(project, l.source), bp = findPort(project, l.target)
    return [l.label, ap ? t(`signal.${ap.signal}`) : '', a?.name ?? '', ap?.name ?? '', b?.name ?? '', bp?.name ?? '', ap ? connectorLabel(ap.connector) : '', bp ? connectorLabel(bp.connector) : '', l.lengthM ?? null, l.channels ?? null, getCable(l.cableTypeId)?.label ?? '', l.notes ?? '', l.id]
  })
  make(t('xlsx.cables'), ['label', 'signal', 'sourceEquipment', 'sourcePort', 'targetEquipment', 'targetPort', 'sourceConnector', 'targetConnector', 'lengthM', 'channels', 'cable', 'notes', 'linkId'].map(k => t(`xlsx.columns.${k}`)), cableRows, [20, 20, 30, 28, 30, 28, 24, 24, 16, 14, 28, 45, 28], t('xlsx.snapshot'))
  const patchRows: (string | number | null)[][] = []
  for (const eq of Object.values(project.equipment).sort((a, b) => a.name.localeCompare(b.name))) for (const port of eq.ports) {
    const outgoing = links.filter(l => l.source.equipmentId === eq.id && l.source.portId === port.id)
    for (const l of outgoing.length ? outgoing : [undefined]) {
      const row: Record<PatchKey, string | number | null> = { sourceEquipment: eq.name, sourcePort: port.name, targetEquipment: l ? project.equipment[l.target.equipmentId]?.name ?? '' : '', targetPort: l ? findPort(project, l.target)?.name ?? '' : '', lengthM: l?.lengthM ?? null, channels: l?.channels ?? null, notes: l?.notes ?? '', sourceEquipmentId: eq.id, sourcePortId: port.id, targetEquipmentId: l?.target.equipmentId ?? '', targetPortId: l?.target.portId ?? '', linkId: l?.id ?? '' }
      patchRows.push(PATCH_KEYS.map(k => row[k]))
    }
  }
  const patch = make(t('xlsx.patch'), PATCH_KEYS.map(k => t(`xlsx.columns.${k}`)), patchRows, [30, 30, 30, 30, 16, 12, 45, 28, 28, 28, 28, 28], t('xlsx.patchHint'))
  for (let i = 8; i <= 12; i++) patch.getColumn(i).hidden = true
  make(t('xlsx.bom'), ['manufacturer', 'model', 'quantity', 'powerW', 'weightKg', 'totalPowerW', 'totalWeightKg'].map(k => t(`xlsx.columns.${k}`)), buildBom(project).map(l => [l.manufacturer ?? '', l.model, l.quantity, l.powerW ?? null, l.weightKg ?? null, l.powerW === undefined ? null : l.powerW * l.quantity, l.weightKg === undefined ? null : l.weightKg * l.quantity]), [28, 42, 14, 22, 22, 22, 22], t('xlsx.unknown'))
  for (const table of deploymentTables(project, t).lists) make(table.name, table.keys, table.rows, table.keys.map((_, i) => i < 2 ? 30 : 24), t('xlsx.snapshot'))
  const bytes = await book.xlsx.writeBuffer()
  return new Uint8Array(bytes)
}
export async function exportWorkbook(p: Project, t: TFunction) { return saveContent(`${slug(p.name)}-listes.xlsx`, await workbookBytes(p, t), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') }
