import { describe, expect, it } from 'vitest'

describe('traductions', () => {
  it('le français et l\'anglais ont exactement les mêmes clés', async () => {
    const fr = (await import('../i18n/fr.json')).default
    const en = (await import('../i18n/en.json')).default
    const keys = (o: object, p = ''): string[] =>
      Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' ? keys(v, `${p}${k}.`) : [`${p}${k}`]))
    expect(keys(en).sort()).toEqual(keys(fr).sort())
  })
})
