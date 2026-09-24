// Validation d'une fiche de bibliothèque (fichiers src/library/devices/*.json).
// Une fiche "verified" doit citer au moins une source constructeur : c'est la garantie
// qu'aucune caractéristique n'est inventée.
import { CONNECTORS } from './connectors'
import { SIGNAL_FAMILIES } from './signals'
import type { EquipmentTemplate } from './types'

const CONNECTOR_IDS = new Set(CONNECTORS.map((c) => c.id))
const LEVELS = new Set(['mic', 'instrument', 'line+4', 'line-10', 'speaker', 'none'])
const DIRECTIONS = new Set(['in', 'out', 'bidir'])
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/** Renvoie la liste des problèmes (vide si la fiche est valide). */
export function validateTemplate(t: EquipmentTemplate): string[] {
  const errors: string[] = []
  const where = t.id || '(sans id)'
  if (!t.id) errors.push('id manquant')
  if (!t.model) errors.push(`${where} : modèle manquant`)
  if ((t.status === 'verified' || t.status === 'community') && !t.manufacturer) errors.push(`${where} : fabricant manquant`)
  if (t.status === 'verified') {
    if (!t.sources?.length) errors.push(`${where} : une fiche vérifiée doit citer une source`)
    for (const s of t.sources ?? []) {
      if (!s.url && !s.document) errors.push(`${where} : une source doit indiquer une URL ou un document constructeur`)
      if (s.url && !/^https?:\/\//.test(s.url)) errors.push(`${where} : URL de source invalide (${s.url})`)
      if (!DATE_RE.test(s.accessed)) errors.push(`${where} : date de consultation attendue au format AAAA-MM-JJ`)
    }
  }
  if (!t.ports.length) errors.push(`${where} : aucun port`)
  const ids = new Set<string>()
  for (const p of t.ports) {
    if (ids.has(p.id)) errors.push(`${where} : identifiant de port en double (${p.id})`)
    ids.add(p.id)
    if (!DIRECTIONS.has(p.direction)) errors.push(`${where}/${p.id} : sens inconnu (${p.direction})`)
    if (!(SIGNAL_FAMILIES as readonly string[]).includes(p.signal)) errors.push(`${where}/${p.id} : signal inconnu (${p.signal})`)
    if (!CONNECTOR_IDS.has(p.connector)) errors.push(`${where}/${p.id} : connecteur inconnu (${p.connector})`)
    if (p.phantom && !['required', 'supplied', 'none'].includes(p.phantom)) errors.push(`${where}/${p.id} : valeur fantôme inconnue (${p.phantom})`)
    if (p.level && !LEVELS.has(p.level)) errors.push(`${where}/${p.id} : niveau inconnu (${p.level})`)
  }
  for (const [k, v] of [['powerW', t.powerW], ['weightKg', t.weightKg], ['rackU', t.rackU]] as const) {
    if (v !== undefined && (typeof v !== 'number' || v < 0)) errors.push(`${where} : ${k} doit être un nombre positif`)
  }
  return errors
}
