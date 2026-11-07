import { assignFreshNum, connect, relabelAll } from './project'
import { checkLink, type Issue } from './rules'
import type { Equipment, Link, PortDef, Project } from './types'
import type { PatchKey, TableCell, WorkbookTable } from '../io/xlsx'

export interface PatchProblem { row: number; code: string; value?: string; params?: Record<string, string> }
export interface PatchRow { row: number; values: Partial<Record<PatchKey, TableCell>> }
const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')
const names: Record<PatchKey, string[]> = {
  sourceEquipment: ['equipementsource', 'sourceequipment', 'fromequipment'], sourcePort: ['portsource', 'sourceport', 'fromport'], targetEquipment: ['equipementdestination', 'targetequipment', 'destinationequipment', 'toequipment'], targetPort: ['portdestination', 'targetport', 'destinationport', 'toport'],
  sourceEquipmentId: ['sourceequipmentid', 'idequipementsource'], sourcePortId: ['sourceportid', 'idportsource'], targetEquipmentId: ['targetequipmentid', 'idequipementdestination'], targetPortId: ['targetportid', 'idportdestination'],
  linkId: ['linkid', 'idliaison'], lengthM: ['lengthm', 'longueurm', 'longueur'], channels: ['channels', 'canaux'], notes: ['notes', 'observations'],
}
export function patchRows(table: WorkbookTable): { rows: PatchRow[]; problems: PatchProblem[] } {
  let header = -1, columns = new Map<number, PatchKey>()
  for (const [i, row] of table.rows.slice(0, 30).entries()) {
    const found = new Map<number, PatchKey>()
    row.forEach((v, n) => { if (typeof v === 'string') { const key = (Object.keys(names) as PatchKey[]).find(k => names[k].includes(norm(v))); if (key) found.set(n, key) } })
    const keys = new Set(found.values())
    if ((keys.has('sourceEquipment') || keys.has('sourceEquipmentId')) && (keys.has('sourcePort') || keys.has('sourcePortId')) && (keys.has('targetEquipment') || keys.has('targetEquipmentId')) && (keys.has('targetPort') || keys.has('targetPortId'))) { header = i; columns = found; break }
  }
  if (header < 0) return { rows: [], problems: [{ row: 0, code: 'headers' }] }
  if (new Set(columns.values()).size !== columns.size) return { rows: [], problems: [{ row: header + 1, code: 'duplicateHeaders' }] }
  const rows: PatchRow[] = [], problems: PatchProblem[] = []
  for (let i = header + 1; i < table.rows.length; i++) {
    const values: PatchRow['values'] = {}
    for (const [col, key] of columns) values[key] = table.rows[i][col] ?? null
    // Les entrées non affectées et les lignes de préparation vides ne créent aucune liaison.
    if (!['targetEquipment', 'targetEquipmentId', 'targetPort', 'targetPortId'].some(k => String(values[k as PatchKey] ?? '').trim())) continue
    if (Object.values(values).some(v => typeof v === 'object' && v !== null)) { problems.push({ row: i + 1, code: 'formula' }); continue }
    if (Object.values(values).some(v => typeof v === 'boolean')) { problems.push({ row: i + 1, code: 'value' }); continue }
    rows.push({ row: i + 1, values })
    if (rows.length > 2000) return { rows: [], problems: [{ row: i + 1, code: 'rows' }] }
  }
  return { rows, problems }
}

const text = (v: TableCell | undefined) => typeof v === 'string' || typeof v === 'number' ? String(v).trim() : ''
const eqName = (v: string) => v.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase()
function resolveEquipment(p: Project, name: string, id: string): Equipment | null {
  if (!name) return p.equipment[id] ?? null
  const matches = Object.values(p.equipment).filter(e => eqName(e.name) === eqName(name))
  return matches.length === 1 ? matches[0] : matches.find(e => e.id === id) ?? null
}
function resolvePort(e: Equipment, name: string, id: string): PortDef | null {
  if (!name) return e.ports.find(q => q.id === id) ?? null
  const found = e.ports.filter(q => eqName(q.name) === eqName(name))
  return found.length === 1 ? found[0] : found.find(q => q.id === id) ?? null
}
export function buildPatch(p: Project, input: PatchRow[]): { project: Project; problems: PatchProblem[]; warnings: Issue[]; changed: number; links: Link[] } {
  let next = p
  const problems: PatchProblem[] = [], modified = new Map<string, { link: Link; row: number }>()
  for (const r of input) {
    const v = r.values
    const a = resolveEquipment(p, text(v.sourceEquipment), text(v.sourceEquipmentId)), b = resolveEquipment(p, text(v.targetEquipment), text(v.targetEquipmentId))
    if (!a || !b) { problems.push({ row: r.row, code: 'equipment', value: `${text(v.sourceEquipment)} → ${text(v.targetEquipment)}` }); continue }
    const ap = resolvePort(a, text(v.sourcePort), text(v.sourcePortId)), bp = resolvePort(b, text(v.targetPort), text(v.targetPortId))
    if (!ap || !bp) { problems.push({ row: r.row, code: 'port', value: `${text(v.sourcePort)} → ${text(v.targetPort)}` }); continue }
    if (ap.direction === 'in' || bp.direction === 'out') { problems.push({ row: r.row, code: 'rule', value: 'direction' }); continue }
    if (a.id === b.id && ap.id === bp.id) { problems.push({ row: r.row, code: 'samePort' }); continue }
    const source = { equipmentId: a.id, portId: ap.id }, target = { equipmentId: b.id, portId: bp.id }
    const id = text(v.linkId)
    let link = id ? next.links[id] : Object.values(next.links).find(l => l.source.equipmentId === a.id && l.source.portId === ap.id && l.target.equipmentId === b.id && l.target.portId === bp.id)
    if (id && !link) { problems.push({ row: r.row, code: 'link', value: id }); continue }
    if (link && modified.has(link.id)) { problems.push({ row: r.row, code: 'duplicateRow' }); continue }
    const patch: Partial<Link> = {}
    let invalid = false
    for (const key of ['lengthM', 'channels'] as const) if (key in v) {
      const raw = text(v[key])
      if (!raw) patch[key] = undefined
      else {
        const n = Number(raw.replace(',', '.'))
        if (!/^[+]?\d+(?:[.,]\d+)?(?:e[+-]?\d+)?$/i.test(raw) || !Number.isFinite(n) || n < 0 || (key === 'channels' && (!Number.isInteger(n) || n < 1))) { problems.push({ row: r.row, code: 'number', value: key }); invalid = true }
        else patch[key] = n
      }
    }
    if (invalid) continue
    if ('notes' in v) patch.notes = text(v.notes) || undefined
    if (!link) { const made = connect(next, source, target); next = made.project; if (!made.id) continue; link = next.links[made.id] }
    const updated = { ...link, ...patch, source, target }
    if (JSON.stringify(updated) !== JSON.stringify(p.links[link.id])) modified.set(link.id, { link: updated, row: r.row })
    next = { ...next, links: { ...next.links, [link.id]: updated } }
  }
  next = relabelAll(next)
  const labels = new Set(Object.values(next.links).filter(l => !modified.has(l.id)).map(l => l.label))
  for (const id of modified.keys()) { if (labels.has(next.links[id].label)) next = assignFreshNum(next, id); labels.add(next.links[id].label) }
  const warnings: Issue[] = []
  for (const [id, m] of modified) {
    for (const issue of checkLink(next, next.links[id])) {
      if (issue.severity === 'error') problems.push({ row: m.row, code: 'rule', value: issue.code, params: issue.params })
      else if (issue.severity === 'warning') warnings.push(issue)
    }
  }
  return { project: problems.length || !modified.size ? p : { ...next, updatedAt: new Date().toISOString() }, problems, warnings, changed: modified.size, links: [...modified.keys()].map(id => next.links[id]) }
}
