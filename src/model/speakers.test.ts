import { describe, expect, it } from 'vitest'
import { LIBRARY } from '../library'
import { requestedSpeakerPower, speakerPower } from './speakers'

const ports = (id: string) => LIBRARY.find(t => t.id === id)!.ports

describe('enceinte amplifiée ou passive', () => {
  it('se déduit des entrées de la fiche', () => {
    expect(speakerPower(ports('gen-speaker-active'))).toBe('active')
    expect(speakerPower(ports('gen-speaker-passive'))).toBe('passive')
    // Retour à entrées Speakon seulement : un amplificateur externe est nécessaire
    expect(speakerPower(ports('nexo-45n12'))).toBe('passive')
    expect(speakerPower([])).toBe('unknown')
  })
  it('lit ce que la demande précise', () => {
    expect(requestedSpeakerPower('retours de scène amplifiés')).toBe('active')
    expect(requestedSpeakerPower('Enceintes actives')).toBe('active')
    expect(requestedSpeakerPower('enceinte auto-amplifiée')).toBe('active')
    expect(requestedSpeakerPower('enceintes passives')).toBe('passive')
    expect(requestedSpeakerPower('enceinte non amplifiée')).toBe('passive')
    expect(requestedSpeakerPower('retour bi-amplifié')).toBeNull()
    expect(requestedSpeakerPower('enceintes de façade')).toBeNull()
  })
})
