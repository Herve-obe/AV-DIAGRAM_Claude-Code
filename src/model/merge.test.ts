import { describe, expect, it } from 'vitest'
import { buildSampleProject } from '../library/sample'
import * as ops from './project'
import { tpl } from './testFixtures'

describe('fusion de deux versions', () => {
  it('ajoute, détecte les conflits et renumérote les doublons', async () => {
    const { mergeProjects } = await import('./merge')
    const base = ops.normalizeProject(buildSampleProject())
    // Notre version : on ajoute une liaison depuis un micro vers la console
    const eqs = Object.values(base.equipment)
    const moved = eqs[0]
    // Leur version : un bloc déplacé, un bloc ajouté et relié, une feuille ajoutée
    let theirs = ops.moveEquipment(base, moved.id, { x: moved.position.x + 100, y: moved.position.y })
    const added = ops.addEquipment(theirs, tpl('gen-mic-dyn'), { x: 0, y: 900 }, { zoneId: moved.zoneId })
    theirs = added.project
    const console_ = eqs.find((e) => e.ports.some((p) => p.direction === 'in' && p.signal === 'audioAnalog' && !Object.values(base.links).some((l) => l.target.equipmentId === e.id && l.target.portId === p.id)))!
    const freeIn = console_.ports.find((p) => p.direction === 'in' && p.signal === 'audioAnalog' && !Object.values(base.links).some((l) => l.target.equipmentId === console_.id && l.target.portId === p.id))!
    const c1 = ops.connect(theirs, { equipmentId: added.id, portId: 'p1' }, { equipmentId: console_.id, portId: freeIn.id })
    theirs = ops.addSheet(c1.project, 'Plateau').project
    // Notre version ajoute aussi une liaison dans la même série : même numéro de câble
    const ourMic = ops.addEquipment(base, tpl('gen-mic-dyn'), { x: 0, y: 1200 }, { zoneId: moved.zoneId })
    const c2 = ops.connect(ourMic.project, { equipmentId: ourMic.id, portId: 'p1' }, { equipmentId: console_.id, portId: freeIn.id })
    const ours = c2.project
    expect(ours.links[c2.id!].label).toBe(theirs.links[c1.id!].label)

    const r = mergeProjects(ours, theirs, 'ours')
    expect(r.report.added.equipment).toBe(1)
    expect(r.report.added.links).toBe(1)
    expect(r.report.added.sheets).toBe(1)
    expect(r.report.conflicts.map((c) => c.id)).toContain(moved.id)
    expect(r.report.renumbered).toBe(1)
    expect(r.project.equipment[moved.id].position).toEqual(moved.position)
    const labels = Object.values(r.project.links).map((l) => l.label)
    expect(new Set(labels).size).toBe(labels.length)

    const r2 = mergeProjects(ours, theirs, 'theirs')
    expect(r2.project.equipment[moved.id].position.x).toBe(moved.position.x + 100)
  })
})
