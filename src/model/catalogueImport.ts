import type { EquipmentFamily, EquipmentTemplate } from './types'
import type { TableCell, WorkbookTable } from '../io/xlsx'

const text = (v: TableCell | undefined) => typeof v === 'string' || typeof v === 'number' ? String(v).trim() : ''
const normal = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/ø/g, 'o').replace(/[^a-z0-9]+/g, ' ').trim()
export const catalogueIdentity = (t: Pick<EquipmentTemplate, 'manufacturer' | 'model'>) => normal((t.manufacturer ?? '') + ' ' + t.model)

/** CSV RFC 4180, séparateur virgule/point-virgule/tabulation détecté hors guillemets. */
export function catalogueCsv(input: string): WorkbookTable {
  input = input.replace(/^\uFEFF/, '')
  const counts = new Map([',', ';', '\t'].map(s => [s, 0]))
  let quoted = false
  for (let i = 0; i < input.length; i++) {
    const c = input[i]
    if (c === '"') { if (quoted && input[i + 1] === '"') i++; else quoted = !quoted }
    if (!quoted && (c === '\r' || c === '\n')) break
    if (!quoted && counts.has(c)) counts.set(c, counts.get(c)! + 1)
  }
  const delimiter = [...counts].sort((a, b) => b[1] - a[1])[0][0]
  const rows: string[][] = []; let row: string[] = [], cell = '', closed = false, cells = 0
  quoted = false
  const field = () => { if (cell.length > 10_000 || row.length >= 100 || ++cells > 200_000) throw new Error('large'); row.push(cell); cell = ''; closed = false }
  const line = () => { field(); if (row.some(v => v.trim())) rows.push(row); row = []; if (rows.length > 10_001) throw new Error('large') }
  for (let i = 0; i < input.length; i++) {
    const c = input[i]
    if (quoted) { if (c === '"') { if (input[i + 1] === '"') { cell += '"'; i++ } else { quoted = false; closed = true } } else cell += c }
    else if (c === delimiter) field()
    else if (c === '\r' || c === '\n') { line(); if (c === '\r' && input[i + 1] === '\n') i++ }
    else if (c === '"' && !cell && !closed) quoted = true
    else if (c === '"' || closed && c.trim()) throw new Error('invalid')
    else if (!closed) cell += c
    if (cell.length > 10_000) throw new Error('large')
  }
  if (quoted) throw new Error('invalid')
  if (cell || row.length || closed) line()
  return { name: 'CSV', rows }
}

export interface CatalogueColumns { model: number; manufacturer: number; quantity?: number }
export function catalogueColumns(header: TableCell[]): CatalogueColumns {
  const find = (pattern: RegExp) => header.findIndex(v => pattern.test(normal(text(v))))
  const model = find(/^(model|modele|name|nom|designation|product name|nom du produit|equipement)$/)
  return { model: model < 0 ? 0 : model, manufacturer: find(/^(manufacturer|fabricant|marque|brand)$/), quantity: find(/^(quantity|quantite|qty|stock total|quantite totale)$/) }
}
export interface CatalogueEntry { row: number; manufacturer: string; model: string; family: EquipmentFamily; template?: EquipmentTemplate; quantity?: number }
export function catalogueEntries(table: WorkbookTable, columns: CatalogueColumns, library: EquipmentTemplate[], family: EquipmentFamily) {
  const entries: CatalogueEntry[] = [], problems: number[] = [], seen = new Set<string>()
  const lookup = library.filter(t => t.status !== 'generic').map(t => ({ template: t, manufacturer: normal(t.manufacturer ?? ''), full: catalogueIdentity(t), short: normal(t.model), aliases: (t.aliases ?? []).map(normal) }))
  for (const [index, row] of table.rows.slice(1).entries()) {
    if (row.every(v => v === null || typeof v === 'string' && !v.trim())) continue
    const model = text(row[columns.model]), manufacturer = columns.manufacturer >= 0 ? text(row[columns.manufacturer]) : ''
    const brand = columns.manufacturer >= 0 ? row[columns.manufacturer] : null
    if (!model || model.length > 300 || manufacturer.length > 150 || typeof row[columns.model] === 'object' || brand != null && typeof brand !== 'string' && typeof brand !== 'number') { problems.push(index + 2); continue }
    const key = catalogueIdentity({ manufacturer, model })
    const quantityCell = columns.quantity !== undefined && columns.quantity >= 0 ? row[columns.quantity] : undefined
    if (quantityCell != null && typeof quantityCell !== 'number' && typeof quantityCell !== 'string') { problems.push(index + 2); continue }
    const value = text(quantityCell)
    const quantity = value ? Number(value) : undefined
    if (quantity !== undefined && (!/^\d+$/.test(value) || !Number.isInteger(quantity) || quantity > 1_000_000)) { problems.push(index + 2); continue }
    if (seen.has(key)) { if (quantity !== undefined) problems.push(index + 2); continue }
    seen.add(key)
    const wanted = normal(model)
    const manufacturerKey = normal(manufacturer)
    const matches = lookup.filter(t => t.full === key || !manufacturer && t.short === wanted || t.aliases.includes(key)
      || t.aliases.includes(wanted) && (!manufacturer || t.manufacturer === manufacturerKey)
      || !manufacturer && !!t.template.manufacturer && key.startsWith(t.full + ' '))
    // Une variante/génération ambiguë reste à documenter ; aucun rapprochement approximatif.
    const template = matches.length && matches.every(t => t.full === matches[0].full) ? matches[0].template : undefined
    entries.push({ row: index + 2, manufacturer: template?.manufacturer ?? manufacturer, model: template?.model ?? model, family: template?.family ?? family, template, quantity })
  }
  return { entries, problems }
}

export function catalogueTemplate(entry: CatalogueEntry): EquipmentTemplate {
  const template = entry.template
  return template ? { ...structuredClone(template), id: 'user-' + crypto.randomUUID(), status: 'user', companyQuantity: entry.quantity } : {
    id: 'user-' + crypto.randomUUID(), manufacturer: entry.manufacturer || undefined, model: entry.model, family: entry.family,
    pictogram: 'patch', status: 'user', portStatus: 'pending', ports: [], companyQuantity: entry.quantity,
  }
}
