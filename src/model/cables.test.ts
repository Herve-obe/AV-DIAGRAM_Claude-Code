import { describe, expect, it } from 'vitest'
import { buildSampleProject } from '../library/sample'
import * as ops from './project'
import { checkLink } from './rules'
import { tpl } from './testFixtures'

describe('catalogue de câbles', () => {
  it('le CL 100 relie un jack 3,5 à une XLR, dans les deux sens', async () => {
    const { cableFits, getCable, cablesFor } = await import('./cables')
    const cl100 = getCable('cl100')!
    expect(cableFits(cl100, 'minijack', 'xlr3')).toBe(true)
    expect(cableFits(cl100, 'xlr3', 'minijack')).toBe(true)
    expect(cableFits(cl100, 'xlr3', 'xlr3')).toBe(false)
    expect(cablesFor('xlr3', 'xlr3').map((c) => c.id)).toContain('mod-xlr3')
  })
  it('un câble adaptateur choisi lève l’alerte, un câble inadapté en crée une autre', async () => {
    const { LIBRARY } = await import('../library')
    const ek = LIBRARY.find((t) => t.id === 'sennheiser-ek-100-g4')!
    let p = ops.createProject('test')
    const ra = ops.addEquipment(p, ek, { x: 0, y: 0 })
    const rb = ops.addEquipment(ra.project, tpl('gen-console'), { x: 300, y: 0 })
    const r = ops.connect(rb.project, { equipmentId: ra.id, portId: 'out' }, { equipmentId: rb.id, portId: 'p1' })
    p = r.project
    const codes = () => checkLink(p, p.links[r.id!]).map((i) => i.code)
    expect(codes()).toContain('adapter-needed')
    p = ops.updateLink(p, r.id!, { cableTypeId: 'cl100' })
    expect(codes()).not.toContain('adapter-needed')
    p = ops.updateLink(p, r.id!, { cableTypeId: 'hdmi' })
    expect(codes()).toContain('cable-mismatch')
  })
  it('la liste des câbles regroupe par type et par longueur', async () => {
    const { buildCableBom } = await import('./cables')
    const p = buildSampleProject()
    const ids = Object.keys(p.links)
    let q = p
    for (const id of ids.slice(0, 2)) q = ops.updateLink(q, id, { cableTypeId: 'mod-xlr3', lengthM: 10 })
    const bom = buildCableBom(q, () => ['xlr3', 'xlr3'])
    const line = bom.find((l) => l.cableId === 'mod-xlr3' && l.lengthM === 10)
    expect(line?.quantity).toBe(2)
    expect(bom.reduce((s, l) => s + l.quantity, 0)).toBe(ids.length)
  })
})

describe('multipaires', () => {
  const sample = () => {
    let p = buildSampleProject()
    const r = ops.addMulticore(p, { pairs: 2 })
    p = r.project
    return { p, mc: r.id, links: Object.keys(p.links) }
  }
  it('crée MP-01 puis MP-02 et trouve la première paire libre', () => {
    const s0 = sample()
    const { mc, links } = s0
    let p = s0.p
    expect(p.multicores?.[mc].label).toBe('MP-01')
    expect(ops.addMulticore(p).project.multicores && Object.values(ops.addMulticore(p).project.multicores!).map((m) => m.label)).toContain('MP-02')
    p = ops.updateLink(p, links[0], { multicoreId: mc, pair: 1 })
    expect(ops.firstFreePair(p, mc)).toBe(2)
    p = ops.updateLink(p, links[1], { multicoreId: mc, pair: 2 })
    expect(ops.firstFreePair(p, mc)).toBeUndefined()
  })
  it('signale une paire occupée deux fois, hors capacité ou manquante', () => {
    const s0 = sample()
    const { mc, links } = s0
    let p = s0.p
    p = ops.updateLink(p, links[0], { multicoreId: mc, pair: 1 })
    p = ops.updateLink(p, links[1], { multicoreId: mc, pair: 1 })
    expect(checkLink(p, p.links[links[1]]).map((i) => i.code)).toContain('pair-busy')
    p = ops.updateLink(p, links[1], { pair: 5 })
    expect(checkLink(p, p.links[links[1]]).map((i) => i.code)).toContain('pair-range')
    p = ops.updateLink(p, links[1], { pair: undefined })
    expect(checkLink(p, p.links[links[1]]).map((i) => i.code)).toContain('pair-missing')
  })
  it('la suppression libère les liaisons et le multipaire compte dans les câbles', async () => {
    const { buildCableBom } = await import('./cables')
    const s0 = sample()
    const { mc, links } = s0
    let p = s0.p
    p = ops.updateMulticore(p, mc, { lengthM: 30 })
    p = ops.updateLink(p, links[0], { multicoreId: mc, pair: 1 })
    const bom = buildCableBom(p, () => ['xlr3', 'xlr3'])
    expect(bom.find((l) => l.multicorePairs === 2)?.lengthM).toBe(30)
    expect(bom.reduce((s, l) => s + l.quantity, 0)).toBe(links.length) // 1 multipaire + (n - 1) câbles
    p = ops.removeMulticore(p, mc)
    expect(p.links[links[0]].multicoreId).toBeUndefined()
    expect(p.links[links[0]].pair).toBeUndefined()
  })
})
