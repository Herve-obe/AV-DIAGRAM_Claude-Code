// Classement de la bibliothèque en menus (Son, Image, Lumière, Réseau, Divers) puis en familles.
// Le menu vient de la famille ; une fiche peut le préciser (champ domain) quand la famille est
// partagée, par exemple un enregistreur vidéo dans la famille « Enregistrement ».
import type { EquipmentFamily, EquipmentTemplate, LibraryDomain } from '../model/types'

/** Familles de chaque menu, dans l'ordre d'affichage. */
export const DOMAIN_FAMILIES: Record<LibraryDomain, EquipmentFamily[]> = {
  sound: ['capture', 'wireless', 'console', 'stagebox', 'processing', 'amplification', 'speaker', 'recording', 'intercom', 'sync', 'control'],
  image: ['camera', 'videoSwitcher', 'videoRouting', 'display', 'recording', 'control', 'sync'],
  light: [],
  network: ['network'],
  misc: ['power', 'passive'],
}

const DEFAULT_DOMAIN: Record<EquipmentFamily, LibraryDomain> = {
  capture: 'sound',
  wireless: 'sound',
  console: 'sound',
  stagebox: 'sound',
  processing: 'sound',
  amplification: 'sound',
  speaker: 'sound',
  recording: 'sound',
  intercom: 'sound',
  sync: 'sound',
  control: 'sound',
  camera: 'image',
  videoSwitcher: 'image',
  videoRouting: 'image',
  display: 'image',
  network: 'network',
  power: 'misc',
  passive: 'misc',
}

export const domainOf = (t: Pick<EquipmentTemplate, 'family' | 'domain'>): LibraryDomain => t.domain ?? DEFAULT_DOMAIN[t.family]

/** Modèles rangés par menu puis par famille (menus et familles vides compris). */
export function groupByDomain(templates: EquipmentTemplate[]): { domain: LibraryDomain; families: { family: EquipmentFamily; items: EquipmentTemplate[] }[] }[] {
  return (Object.keys(DOMAIN_FAMILIES) as LibraryDomain[]).map((domain) => ({
    domain,
    families: DOMAIN_FAMILIES[domain]
      .map((family) => ({ family, items: templates.filter((t) => t.family === family && domainOf(t) === domain) }))
      .filter((f) => f.items.length > 0),
  }))
}
