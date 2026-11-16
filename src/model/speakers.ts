// Enceinte amplifiée ou passive : déduit des entrées documentées de la fiche, jamais du nom.
import { fold } from './text'
import type { PortDef } from './types'

export type SpeakerPower = 'active' | 'passive' | 'unknown'

/**
 * Une entrée au niveau ligne ou micro, ou une entrée numérique, signifie que l'amplification est dans l'enceinte.
 * Une enceinte qui n'a que des entrées au niveau haut-parleur (Speakon) attend un amplificateur externe.
 */
export function speakerPower(ports: PortDef[]): SpeakerPower {
  const inputs = ports.filter(p => p.direction !== 'out')
  const builtIn = (p: PortDef) => p.signal === 'audioDigital' || p.signal === 'audioIp'
    || (p.signal === 'audioAnalog' && (p.level === 'line+4' || p.level === 'line-10' || p.level === 'mic'))
  if (inputs.some(builtIn)) return 'active'
  return inputs.some(p => p.signal === 'audioAnalog' && p.level === 'speaker') ? 'passive' : 'unknown'
}

/** Ce que la demande précise : « amplifiée », « active », « autoamplifiée » ou « passive » ; null si elle ne dit rien. */
export function requestedSpeakerPower(query: string): Exclude<SpeakerPower, 'unknown'> | null {
  const text = ` ${fold(query)} `
  if (/[^a-z](?:passi[fv]|non[ -]amplifi|sans ampli)/.test(text)) return 'passive'
  // « bi-amplifiée » décrit un filtrage actif à amplificateurs externes : ce n'est pas une enceinte amplifiée
  return /(?:^|[^a-z-])(?:auto[ -]?)?(?:amplifi|acti[fv]|powered)/.test(text) ? 'active' : null
}
