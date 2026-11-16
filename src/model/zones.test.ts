import { describe, expect, it } from 'vitest'
import { buildSampleProject } from '../library/sample'
import * as ops from './project'

describe('zones tracées et regroupement en multipaire', () => {
  it('un cadre lié donne sa zone aux équipements posés dedans et la reprend en sortant', async () => {
    const z = await import('./zones')
    let p = ops.normalizeProject(buildSampleProject())
    const eq = Object.values(p.equipment)[0]
    const sheetId = eq.sheetId ?? ops.DEFAULT_SHEET_ID
    const a = ops.addAnnotation(p, { kind: 'frame', sheetId, position: { x: eq.position.x - 10, y: eq.position.y - 10 }, size: { w: 300, h: 200 }, text: 'Scène' })
    const r = z.zoneFromFrame(a.project, a.id)
    p = r.project
    expect(p.zones.find((x) => x.id === r.id)?.code).toBe('SCE')
    expect(p.equipment[eq.id].zoneId).toBe(r.id)
    p = z.applyFrameZones(ops.moveEquipment(p, eq.id, { x: eq.position.x + 2000, y: eq.position.y }))
    expect(p.equipment[eq.id].zoneId).toBeUndefined()
    expect(z.applyFrameZones(p)).toBe(p)
  })
  it('zone posée depuis la barre : nommée, son code suit le nom, effacée avec son cadre', async () => {
    const z = await import('./zones')
    const p0 = ops.normalizeProject(buildSampleProject())
    const eq = Object.values(p0.equipment)[0]
    const r = z.addZoneFrame(p0, { sheetId: eq.sheetId ?? ops.DEFAULT_SHEET_ID, position: { x: eq.position.x - 10, y: eq.position.y - 10 }, size: { w: 300, h: 200 } })
    let p = r.project
    expect(p.zones.find((x) => x.id === r.zoneId)?.code).toMatch(/^Z\d+$/)
    expect(p.equipment[eq.id].zoneId).toBe(r.zoneId)
    p = z.updateFrame(p, r.frameId, { text: 'Régie son' })
    expect(p.zones.find((x) => x.id === r.zoneId)).toMatchObject({ name: 'Régie son', code: 'REG' })
    p = z.syncFrameNames(ops.updateZone(p, r.zoneId, { name: 'Régie FOH' }), r.zoneId)
    expect(p.annotations?.[r.frameId].text).toBe('Régie FOH')
    const after = z.removeOrphanZones(ops.removeAnnotations(p, [r.frameId]), p)
    expect(after.zones.some((x) => x.id === r.zoneId)).toBe(false)
    expect(after.equipment[eq.id].zoneId).toBeUndefined()
  })
  it('regroupe des liaisons sur les premières paires libres d\'un nouveau multipaire', () => {
    const p0 = buildSampleProject()
    const ids = Object.keys(p0.links).slice(0, 10)
    const r = ops.assignToMulticore(p0, ids, null)
    const mc = r.project.multicores![r.id!]
    expect(mc.pairs).toBe(12)
    expect(new Set(ids.map((id) => r.project.links[id].pair)).size).toBe(10)
    const r2 = ops.assignToMulticore(r.project, Object.keys(p0.links).slice(10), r.id)
    expect(r2.project.multicores![r.id!].pairs).toBeGreaterThanOrEqual(Object.keys(p0.links).length)
  })
})
