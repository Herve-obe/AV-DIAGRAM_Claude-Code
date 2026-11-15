import { describe, expect, it } from 'vitest'
import { durationLabel } from './text'

describe('durée lisible', () => {
  it('donne secondes, minutes et heures', () => {
    expect(durationLabel(0)).toBe('0 s')
    expect(durationLabel(48_400)).toBe('48 s')
    expect(durationLabel(252_000)).toBe('4 min 12 s')
    expect(durationLabel(65_000)).toBe('1 min 05 s')
    expect(durationLabel(3_900_000)).toBe('1 h 05 min')
    expect(durationLabel(-5)).toBe('0 s')
  })
})
