import { describe, expect, it } from 'vitest'
import { LIBRARY_BY_ID } from '../library/generic'
import * as ops from './project'
import { addRack, checkMount, RACK_HINT, rackHints, firstFreeU, invalidMounts, mountEquipment, rackUsage, removeRack, unmountedRackable, updateRack } from './racks'
import type { Project } from './types'

/** Projet avec une baie de 10 U et deux équipements rackables (2 U et 1 U). */
function setup() {
  let p: Project = ops.createProject('baies')
  const tpl = LIBRARY_BY_ID.get('gen-processor')!
  const a = ops.addEquipment(p, tpl, { x: 0, y: 0 })
  p = ops.updateEquipment(a.project, a.id, { rackU: 2, weightKg: 5, powerW: 100 })
  const b = ops.addEquipment(p, tpl, { x: 200, y: 0 })
  p = ops.updateEquipment(b.project, b.id, { rackU: 1, powerW: 50 })
  const r = addRack(p, { heightU: 10 })
  return { p: r.project, rack: r.id, a: a.id, b: b.id }
}

describe('baies (vue V4)', () => {
  it('monte un équipement et calcule le bilan de la baie', () => {
    const { p, rack, a } = setup()
    const m = mountEquipment(p, a, rack, 9)
    expect(m.error).toBeNull()
    const u = rackUsage(m.project, rack)
    expect(u.usedU).toBe(2)
    expect(u.freeU).toBe(8)
    expect(u.weightKg).toBe(5)
    expect(u.powerW).toBe(100)
    expect(u.btuH).toBe(341)
  })
  it('refuse un chevauchement sur la même face, accepte la face arrière', () => {
    const { p, rack, a, b } = setup()
    const p1 = mountEquipment(p, a, rack, 9).project
    expect(checkMount(p1, b, rack, 10, 'front')).toBe('overlap')
    expect(checkMount(p1, b, rack, 10, 'rear')).toBeNull()
    expect(checkMount(p1, b, rack, 11, 'front')).toBe('outOfRack')
  })
  it('trouve la première place libre depuis le haut', () => {
    const { p, rack, a, b } = setup()
    const p1 = mountEquipment(p, a, rack, 9).project
    expect(firstFreeU(p1, b, rack)).toBe(8)
  })
  it('liste les équipements rackables non montés et les montages devenus invalides', () => {
    const { p, rack, a, b } = setup()
    const p1 = mountEquipment(p, a, rack, 9).project
    expect(unmountedRackable(p1).map((e) => e.id)).toEqual([b])
    const shorter = updateRack(p1, rack, { heightU: 8 })
    expect(invalidMounts(shorter).map((e) => e.id)).toEqual([a])
  })
  it('supprimer la baie démonte ses équipements sans les supprimer', () => {
    const { p, rack, a } = setup()
    const p1 = removeRack(mountEquipment(p, a, rack, 9).project, rack)
    expect(p1.equipment[a]).toBeDefined()
    expect(p1.equipment[a].mount).toBeUndefined()
  })
  it('signale les rackables absents des baies, sauf rappel ignoré', () => {
    const { p, rack, a, b } = setup()
    const p1 = mountEquipment(p, a, rack, 9).project
    expect(rackHints(p1)).toEqual([{ equipmentId: b, kind: 'unmounted' }])
    const p2 = ops.setHintDismissed(p1, b, RACK_HINT, true)
    expect(rackHints(p2)).toEqual([])
  })
})
