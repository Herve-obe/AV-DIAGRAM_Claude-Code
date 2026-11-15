import { describe, expect, it } from 'vitest'
import { durationLabel, wrapWords } from './text'

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

describe('retour à la ligne entre les mots', () => {
  it('ne coupe pas un mot et garde tout le texte', () => {
    const text = 'Je veux sonoriser une conférence avec trois micros dynamiques, une console numérique et deux enceintes amplifiées.'
    const lines = wrapWords(text, 40)
    expect(lines.every(l => [...l].length <= 40)).toBe(true)
    expect(lines.join(' ')).toBe(text)
    expect(lines).toEqual(['Je veux sonoriser une conférence avec', 'trois micros dynamiques, une console', 'numérique et deux enceintes amplifiées.'])
  })
  it('garde une ligne vide et ne coupe qu’un mot plus long que la ligne', () => {
    expect(wrapWords('', 10)).toEqual([''])
    expect(wrapWords('court', 10)).toEqual(['court'])
    expect(wrapWords('a https://exemple.fr/chemin b', 10)).toEqual(['a', 'https://ex', 'emple.fr/c', 'hemin b'])
  })
})
