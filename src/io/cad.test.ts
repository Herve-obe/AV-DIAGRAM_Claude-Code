import { expect, it } from 'vitest'
import { cadPage, drawingDxf, parseCad, rescaleCad } from './cad'
import { cadText } from './pickFile'
import { interpretPage } from './pdfImport/interpret'
import { GENERIC_LIBRARY } from '../library/generic'
import { addEquipment, createProject } from '../model/project'
import { placeOnPlan } from '../model/floorPlan'
import { planDrawing } from './cadExport'

const pairs = (...p: (string | number)[]) => p.join('\n') + '\n'
const fixture = (entities: string, unit = 6, blocks = '') => pairs(0, 'SECTION', 2, 'HEADER', 9, '$INSUNITS', 70, unit, 0, 'ENDSEC') + (blocks ? pairs(0, 'SECTION', 2, 'BLOCKS') + blocks + pairs(0, 'ENDSEC') : '') + pairs(0, 'SECTION', 2, 'ENTITIES') + entities + pairs(0, 'ENDSEC', 0, 'EOF')
it('lit les unités métriques et les blocs avec origine, rotation et échelle', () => {
  const block = pairs(0, 'BLOCK', 2, 'Device', 70, 0, 10, 10, 20, 10, 0, 'LWPOLYLINE', 8, '0', 90, 4, 70, 1, 10, 10, 20, 10, 10, 20, 20, 10, 10, 20, 20, 15, 10, 10, 20, 15, 0, 'ENDBLK')
  const source = fixture(pairs(0, 'INSERT', 8, 'Audio', 2, 'Device', 10, 100, 20, 200, 41, 2, 42, 3, 50, 90), 6, block)
  const r = parseCad(source, 'rack.dxf')
  expect(r.drawing.width).toBeCloseTo(15)
  expect(r.drawing.height).toBeCloseTo(20)
  expect(r.drawing.paths[0].layer).toBe('Audio')
  expect(r.inserts[0].name).toBe('Device')
  const mm = parseCad(fixture(pairs(0, 'LINE', 10, 0, 20, 0, 11, 1000, 21, 2000), 4), 'mm.dxf')
  expect(mm.drawing.width).toBe(1); expect(mm.drawing.height).toBe(2)
  expect(rescaleCad(mm, 0.01).drawing.width).toBe(10)
})
it('approche les arcs et bulges, signale les objets ignorés et refuse les fichiers invalides', () => {
  const r = parseCad(fixture(pairs(0, 'LWPOLYLINE', 90, 2, 70, 0, 10, 0, 20, 0, 42, 1, 10, 2, 20, 0, 0, '3DSOLID', 8, '3D')), 'arc.dxf')
  expect(r.curves).toBe(1)
  expect(r.drawing.paths[0].points.length).toBeGreaterThan(20)
  expect(r.skipped['3DSOLID']).toBeGreaterThan(0)
  expect(() => parseCad('AC1027xxxx', 'test.dwg')).toThrow('binary')
  expect(() => parseCad('0\nSECTION\n', 'broken.dxf')).toThrow('invalid')
  const noUnits = fixture(pairs(0, 'LINE', 10, 0, 20, 0, 11, 1000, 21, 2000), 0)
  expect(() => parseCad(noUnits, 'units.dxf')).toThrow('units')
  expect(parseCad(noUnits, 'units.dxf', 4).drawing.width).toBe(1)
  const recursive = pairs(0, 'BLOCK', 2, 'Self', 70, 0, 10, 0, 20, 0, 0, 'INSERT', 2, 'Self', 10, 0, 20, 0, 0, 'ENDBLK')
  expect(() => parseCad(fixture(pairs(0, 'INSERT', 2, 'Self', 10, 0, 20, 0), 6, recursive), 'recursive.dxf')).toThrow('recursive')
})
it('exporte un fond et des empreintes sans modifier les équipements puis les relit', () => {
  const r = addEquipment(createProject('Test'), GENERIC_LIBRARY[0], { x: 100, y: 200 })
  const p = placeOnPlan(r.project, r.id, { x: 3, y: 4, width: 2, depth: 1, angle: 90 })
  const before = JSON.stringify(p), d = planDrawing(p, 'sh-1')
  const read = parseCad(drawingDxf(d), 'export.dxf')
  expect(read.declaredUnit).toBe(6)
  expect(read.drawing.paths.some(q => q.layer === 'AVD_EQUIPMENT')).toBe(true)
  expect(read.drawing.texts.some(q => q.text.includes(p.equipment[r.id].name))).toBe(true)
  expect(JSON.stringify(p)).toBe(before)
  const legacy = new Uint8Array([...new TextEncoder().encode('Caf'), 0xe9])
  expect(cadText(legacy)).toBe('Café')
})
it('présente les cadres et liaisons DXF au moteur de reconnaissance existant', () => {
  const d = { name: 'synoptique', width: 180, height: 50, paths: [
    { layer: 'Cadres', closed: true, points: [{ x: 0, y: 0 }, { x: 60, y: 0 }, { x: 60, y: 30 }, { x: 0, y: 30 }] },
    { layer: 'Cadres', closed: true, points: [{ x: 100, y: 0 }, { x: 160, y: 0 }, { x: 160, y: 30 }, { x: 100, y: 30 }] },
    { layer: 'Cables', points: [{ x: 60, y: 18 }, { x: 100, y: 18 }] },
  ], texts: [
    { layer: 'Noms', x: 10, y: 8, height: 3, angle: 0, text: 'Camera' }, { layer: 'Noms', x: 110, y: 8, height: 3, angle: 0, text: 'Monitor' },
    { layer: 'Ports', x: 44, y: 19, height: 2, angle: 0, text: 'SDI OUT' }, { layer: 'Ports', x: 102, y: 19, height: 2, angle: 0, text: 'SDI IN' },
  ] }
  const parsed = parseCad(drawingDxf(d), 'schema.dxf')
  const r = interpretPage(cadPage(parsed), GENERIC_LIBRARY)
  expect(r.equipment).toHaveLength(2)
  expect(r.links).toHaveLength(1)
  expect(r.links[0].signal).toBe('video')
})
