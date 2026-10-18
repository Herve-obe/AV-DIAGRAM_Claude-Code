import { describe, expect, it } from 'vitest'
import * as Y from 'yjs'
import { LIBRARY_BY_ID } from '../library/generic'
import { createUndoManager, readProject, writeProject } from '../collab/ydoc'
import { checkGuestChange } from '../collab/access'
import { useProject, setProjectGuard } from '../store/projectStore'
import { buildBom, computeTotals } from './bom'
import { installModule, moduleLinks, removeModule } from './modules'
import * as ops from './project'
import { addRack, mountEquipment, rackUsage } from './racks'
import { validateTemplate } from './validateTemplate'

const chassis = LIBRARY_BY_ID.get('gen-modular-chassis')!
const audio = { ...LIBRARY_BY_ID.get('gen-module-audio')!, powerW: 10, weightKg: 0.5 }
const video = LIBRARY_BY_ID.get('gen-module-video')!
function setup() {
  const host = ops.addEquipment(ops.createProject('Cartes'), chassis, { x: 0, y: 0 })
  const p = ops.updateEquipment(host.project, host.id, { weightKg: 5, powerW: 20 })
  return { p, id: host.id }
}

describe('cartes et slots', () => {
  it('ajoute des ports stables à l’hôte et refuse un slot occupé ou incompatible', () => {
    const { p, id } = setup()
    const r = installModule(p, id, 'slot1', audio)
    expect(r.error).toBeNull()
    expect(r.project.equipment[id].ports).toHaveLength(audio.ports.length)
    expect(r.project.equipment[id].ports[0].name).toBe('Slot 1 · In 1')
    expect(installModule(r.project, id, 'slot1', audio).error).toBe('occupied')
    expect(installModule(p, id, 'missing', audio).error).toBe('noSlot')
    expect(installModule(p, id, 'slot1', { ...audio, moduleType: 'another-type' }).error).toBe('incompatible')
    expect(installModule(p, id, 'slot1', { ...audio, weightKg: NaN }).error).toBe('invalidTemplate')
    const second = installModule(r.project, id, 'slot2', audio).project.equipment[id]
    expect(new Set(second.ports.map(p => p.id)).size).toBe(second.ports.length)
  })
  it('retirer une carte câblée exige une confirmation et ne supprime que ses liaisons', () => {
    const { p, id } = setup()
    const a = installModule(p, id, 'slot1', audio).project
    const b = installModule(a, id, 'slot2', audio).project
    const m1 = b.equipment[id].modules![0], m2 = b.equipment[id].modules![1]
    const output1 = b.equipment[id].ports.find(p => m1.portIds.includes(p.id) && p.direction === 'out')!
    const input2 = b.equipment[id].ports.find(p => m2.portIds.includes(p.id) && p.direction === 'in')!
    const connected = ops.connect(b, { equipmentId: id, portId: output1.id }, { equipmentId: id, portId: input2.id })
    const unrelated = ops.connect(connected.project, { equipmentId: id, portId: m2.portIds[2] }, { equipmentId: id, portId: m2.portIds[1] })
    expect(moduleLinks(unrelated.project, id, m1.id)).toEqual([connected.id])
    expect(removeModule(unrelated.project, id, m1.id).project).toBe(unrelated.project)
    expect(removeModule(unrelated.project, id, m1.id).error).toBe('connected')
    expect(ops.removePort(unrelated.project, id, output1.id)).toBe(unrelated.project)
    const removed = removeModule(unrelated.project, id, m1.id, true).project
    expect(removed.equipment[id].ports.map(p => p.id)).toEqual(m2.portIds)
    expect(Object.keys(removed.links)).toEqual([unrelated.id])
    expect(ops.isProject(JSON.parse(JSON.stringify(removed)))).toBe(true)
  })
  it('conserve cartes, limites et ports lors de la sauvegarde et du partage', () => {
    const { p, id } = setup()
    const installed = installModule(p, id, 'slot1', audio).project
    const rack = addRack(installed, { depthMm: 600, maxWeightKg: 50 })
    const mounted = mountEquipment(rack.project, id, rack.id, 1).project
    const fromFile = JSON.parse(JSON.stringify(mounted))
    expect(ops.isProject(fromFile)).toBe(true)
    const doc = new Y.Doc()
    writeProject(doc, null, fromFile)
    const back = readProject(doc)
    expect(back.equipment).toEqual(fromFile.equipment)
    expect(back.racks).toEqual(fromFile.racks)
    expect(ops.isProject(back)).toBe(true)
    doc.destroy()
    const bad = structuredClone(fromFile)
    bad.equipment[id].modules[0].portIds = ['missing']
    expect(ops.isProject(bad)).toBe(false)
    bad.equipment[id].modules[0].portIds = null
    expect(ops.isProject(bad)).toBe(false)
  })
  it('compte chaque carte une fois dans la nomenclature et les bilans, sans ajouter de U', () => {
    const { p, id } = setup()
    const installed = installModule(p, id, 'slot1', audio).project
    const rack = addRack(installed)
    const mounted = mountEquipment(rack.project, id, rack.id, 1).project
    expect(rackUsage(mounted, rack.id)).toMatchObject({ powerW: 30, weightKg: 5.5, usedU: 2, missingPower: 0, missingWeight: 0 })
    expect(computeTotals(mounted)).toMatchObject({ equipmentCount: 2, powerW: 30, weightKg: 5.5, rackU: 2 })
    expect(buildBom(mounted).find(line => line.model === audio.model)?.quantity).toBe(1)
    const copied = ops.duplicateEquipment(mounted, [id])
    expect(copied.project.equipment[copied.ids[0]].mount).toBeUndefined()
    expect(buildBom(copied.project).find(line => line.model === audio.model)?.quantity).toBe(2)
    expect(ops.templateFromEquipment(mounted.equipment[id])).toMatchObject({ slots: chassis.slots, ports: [] })
    expect(validateTemplate(ops.templateFromEquipment(mounted.equipment[id]))).toEqual([])
  })
  it('respecte les calques et ne prétend pas réussir si le changement est refusé', () => {
    const { p, id } = setup()
    const changed = installModule(p, id, 'slot1', video).project
    expect(checkGuestChange(p, changed, new Set(['sound']), 'sound')).toBe(false)
    useProject.setState({ project: p, past: [], future: [] })
    setProjectGuard(() => false)
    try {
      expect(useProject.getState().installModule(id, 'slot1', audio)).toBe('denied')
      expect(useProject.getState().project).toBe(p)
    } finally { setProjectGuard(() => true) }
  })
  it('conserve deux cartes insérées simultanément dans des slots différents et annule seulement sa carte', () => {
    const { p, id } = setup()
    const a = new Y.Doc(), b = new Y.Doc()
    writeProject(a, null, p)
    Y.applyUpdate(b, Y.encodeStateAsUpdate(a))
    const undo = createUndoManager(a, 'local')
    writeProject(a, p, installModule(p, id, 'slot1', audio).project, 'local')
    writeProject(b, p, installModule(p, id, 'slot2', audio).project, 'other')
    Y.applyUpdate(a, Y.encodeStateAsUpdate(b), 'net')
    Y.applyUpdate(b, Y.encodeStateAsUpdate(a), 'net')
    expect(readProject(a).equipment[id].modules).toHaveLength(2)
    expect(readProject(b).equipment[id].modules).toHaveLength(2)
    undo.undo()
    const after = readProject(a)
    expect(after.equipment[id].modules!.map(m => m.slotId)).toEqual(['slot2'])
    expect(after.equipment[id].ports).toHaveLength(audio.ports.length)
    expect(ops.isProject(after)).toBe(true)
    undo.destroy(); a.destroy(); b.destroy()
  })
})
