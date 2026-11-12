import { describe, expect, it } from 'vitest'
import { computeTotals, buildBom } from './bom'
import * as ops from './project'
import { tpl, twoBoxes } from './testFixtures'

describe('bilans', () => {
  it('calcule le courant I = P / U', () => {
    const boxes = twoBoxes('gen-console', 'gen-amp4')
    const p = ops.updateEquipment(boxes.p, boxes.a, { powerW: 460 })
    const tot = computeTotals(p)
    expect(tot.powerW).toBe(460)
    expect(tot.currentA).toBeCloseTo(2, 5)
    expect(tot.missingPower).toBe(1)
  })
  it('regroupe la nomenclature par modèle', () => {
    let { p } = twoBoxes('gen-mic-dyn', 'gen-mic-dyn')
    p = ops.addEquipment(p, tpl('gen-console'), { x: 0, y: 0 }).project
    const bom = buildBom(p)
    expect(bom.find((l) => l.model === 'Micro dynamique')?.quantity).toBe(2)
  })
})
