import { describe, expect, it } from 'vitest'
import { buildSampleProject } from '../library/sample'
import { formatCableLabel } from './numbering'
import * as ops from './project'
import { twoBoxes } from './testFixtures'

describe('numérotation des câbles', () => {
  it('applique le format configurable', () => {
    expect(formatCableLabel('{ZONE}-{TYPE}-{NUM:000}', { zone: 'FOH', signal: 'audioAnalog', num: 12 })).toBe('FOH-AUD-012')
    expect(formatCableLabel('C{NUM}', { zone: 'X', signal: 'video', num: 7 })).toBe('C7')
  })
  it('numérote par série zone + type et renumérote sans trou', () => {
    const { p, a, b } = twoBoxes('gen-mic-dyn', 'gen-console')
    const r1 = ops.connect(p, { equipmentId: a, portId: 'p1' }, { equipmentId: b, portId: 'p1' })
    expect(r1.project.links[r1.id!].label).toBe('SCN-AUD-001')
    const r2 = ops.connect(r1.project, { equipmentId: a, portId: 'p1' }, { equipmentId: b, portId: 'p2' })
    expect(r2.project.links[r2.id!].label).toBe('SCN-AUD-002')
    const removed = ops.removeElements(r2.project, [], [r1.id!])
    const renum = ops.renumberLinks(removed)
    expect(renum.links[r2.id!].label).toBe('SCN-AUD-001')
  })
})

describe('codes de type personnalisés', () => {
  it('un code personnalisé remplace AUD et renumérote les étiquettes', () => {
    expect(formatCableLabel('{TYPE}-{NUM:00}', { zone: 'X', signal: 'audioAnalog', num: 3 }, { audioAnalog: 'MOD' })).toBe('MOD-03')
    const p = ops.updateSettings(buildSampleProject(), { typeCodes: { audioAnalog: 'MOD' } })
    const labels = Object.values(p.links).map((l) => l.label)
    expect(labels.some((l) => l.includes('-MOD-'))).toBe(true)
    expect(labels.some((l) => l.includes('-AUD-'))).toBe(false)
  })
})
