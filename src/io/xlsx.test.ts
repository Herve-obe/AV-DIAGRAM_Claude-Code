import { expect, it } from 'vitest'
import i18n from '../i18n'
import { addEquipment, connect, createProject, updateEquipment } from '../model/project'
import type { EquipmentTemplate } from '../model/types'
import { buildPatch, patchRows } from '../model/patchImport'
import { buildBom } from '../model/bom'
import { checkXlsxArchive, readWorkbook, workbookBytes } from './xlsx'

const source: EquipmentTemplate = { id: 'test-source', model: 'Source', family: 'stagebox', pictogram: 'stagebox', status: 'generic', powerW: 20, weightKg: 2, ports: [1, 2].map(n => ({ id: `out${n}`, name: `OUT ${n}`, direction: 'out', signal: 'audioAnalog', connector: 'xlr3', level: 'line+4' })) }
const target: EquipmentTemplate = { ...source, id: 'test-target', model: 'Console', family: 'console', ports: [1, 2].map(n => ({ id: `in${n}`, name: `IN ${n}`, direction: 'in', signal: 'audioAnalog', connector: 'xlr3', level: 'line+4' })) }
function fixture() {
  const a = addEquipment(createProject('Excel test'), source, { x: 0, y: 0 }), b = addEquipment(a.project, target, { x: 500, y: 0 })
  const c = connect(b.project, { equipmentId: a.id, portId: 'out1' }, { equipmentId: b.id, portId: 'in1' })
  const d = connect(c.project, { equipmentId: a.id, portId: 'out2' }, { equipmentId: b.id, portId: 'in2' })
  return { p: d.project, a: a.id, b: b.id, links: [c.id!, d.id!] }
}
it('exporte et relit un vrai XLSX ; le patch reste idempotent et les identifiants sont conservés', async () => {
  const { p } = fixture(), before = JSON.stringify(p)
  const bytes = await workbookBytes(p, i18n.t)
  expect(() => checkXlsxArchive(bytes)).not.toThrow()
  const wb = await readWorkbook(bytes)
  expect(wb.sheets.slice(0, 3).map(s => s.name)).toEqual(['Câblage', 'Patch', 'Nomenclature'])
  expect(wb.sheets.map(s => s.name)).toContain('Interfaces réseau')
  const parsed = patchRows(wb.sheets.find(s => s.name === 'Patch')!)
  expect(parsed.problems).toEqual([])
  expect(parsed.rows).toHaveLength(2)
  const result = buildPatch(p, parsed.rows)
  expect(result.problems).toEqual([])
  expect(result.changed).toBe(0)
  expect(result.project).toBe(p)
  expect(JSON.stringify(p)).toBe(before)
})
it('applique un échange de destinations en une opération et refuse tout le lot si une ligne est fausse', () => {
  const { p, b, links } = fixture()
  const input = [0, 1].map(i => ({ row: 6 + i, values: { sourceEquipment: 'Source', sourcePort: `OUT ${i + 1}`, targetEquipment: 'Console', targetPort: `IN ${2 - i}`, linkId: links[i], lengthM: i ? '0' : '12,5' } }))
  const r = buildPatch(p, input)
  expect(r.problems).toEqual([])
  expect(r.project.links[links[0]].target).toEqual({ equipmentId: b, portId: 'in2' })
  expect(r.project.links[links[0]].lengthM).toBe(12.5)
  expect(r.project.links[links[1]].lengthM).toBe(0)
  expect(buildPatch(p, [...input, { row: 8, values: { sourceEquipment: 'Inconnu', sourcePort: 'OUT', targetEquipment: 'Console', targetPort: 'IN 1' } }]).project).toBe(p)
  expect(buildPatch(p, [{ row: 6, values: { ...input[0].values, lengthM: '0x10' } }]).problems[0].code).toBe('number')
})
it('refuse les formules du patch, les colonnes ambiguës et les archives démesurées', () => {
  const header = ['Équipement source', 'Port source', 'Équipement destination', 'Port destination']
  expect(patchRows({ name: 'Patch', rows: [header, ['Source', 'OUT 1', { kind: 'formula' }, 'IN 1']] }).problems[0].code).toBe('formula')
  expect(patchRows({ name: 'Patch', rows: [[...header, 'Source equipment']] }).problems[0].code).toBe('duplicateHeaders')
  expect(() => checkXlsxArchive(new Uint8Array(10_000_001))).toThrow('large')
  expect(() => checkXlsxArchive(new Uint8Array([1, 2, 3]))).toThrow('invalid')
  const zip = new Uint8Array(46 + 22), v = new DataView(zip.buffer)
  v.setUint32(0, 0x02014b50, true); v.setUint32(24, 100_000_000, true)
  v.setUint32(46, 0x06054b50, true); v.setUint16(54, 1, true); v.setUint16(56, 1, true); v.setUint32(58, 46, true)
  expect(() => checkXlsxArchive(zip)).toThrow('large')
})
it('ne donne pas une puissance ou un poids unitaire trompeur à des exemplaires différents', () => {
  const a = addEquipment(createProject('BOM'), source, { x: 0, y: 0 }), b = addEquipment(a.project, source, { x: 200, y: 0 })
  const p = updateEquipment(b.project, b.id, { powerW: 40, weightKg: undefined })
  expect(buildBom(p)).toEqual([{ key: '|Source', manufacturer: undefined, model: 'Source', quantity: 2, powerW: undefined, weightKg: undefined }])
})
