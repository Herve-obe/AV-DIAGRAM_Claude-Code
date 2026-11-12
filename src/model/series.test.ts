import { describe, expect, it } from 'vitest'
import * as ops from './project'

describe('liaisons en série', () => {
  it('relie dix micros dans l\'ordre du schéma aux entrées libres, à partir d\'une entrée choisie, dans un multipaire', async () => {
    const s = await import('./series')
    const { LIBRARY } = await import('../library')
    const mic = LIBRARY.find((t) => t.family === 'capture' && t.ports.filter((p) => p.direction === 'out').length === 1 && t.ports[0].signal === 'audioAnalog')!
    const desk = LIBRARY.find((t) => t.family === 'console' && t.ports.filter((p) => p.direction === 'in' && p.signal === 'audioAnalog').length >= 16)!
    let p = ops.createProject('t')
    const d = ops.addEquipment(p, desk, { x: 800, y: 0 })
    p = d.project
    const mics: string[] = []
    // Ajoutés dans le désordre : l'ordre retenu est celui du schéma (de haut en bas)
    for (const k of [3, 0, 9, 1, 2, 8, 4, 7, 5, 6]) {
      const r = ops.addEquipment(p, mic, { x: 0, y: k * 80 })
      p = r.project
      mics[k] = r.id
    }
    const inputs = s.freeInputs(p, d.id, 'audioAnalog')
    const plan = s.planSeries(p, [...mics, d.id], d.id, { startPortId: inputs[2].id })
    expect(plan.pairs).toHaveLength(10)
    expect(plan.pairs.map((x) => x.source.equipmentId)).toEqual(mics)
    expect(plan.pairs[0].target.portId).toBe(inputs[2].id)
    const r = s.applySeries(p, plan, null)
    expect(r.linkIds).toHaveLength(10)
    expect(r.project.multicores![r.multicoreId!].pairs).toBe(12)
    // Une seconde fois : les sorties sont déjà reliées, rien à faire
    expect(s.planSeries(r.project, mics, d.id).pairs).toHaveLength(0)
  })
})
