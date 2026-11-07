// Catalogue de câbles et d'adaptateurs du parc. Un câble relie deux familles de connecteurs :
// choisi sur une liaison, il lève l'alerte « adaptateur nécessaire » quand ses deux extrémités
// s'accouplent aux ports reliés. Le genre (mâle / femelle) n'est pas modélisé.
import { connectorsMate } from './connectors'
import type { Link, Project } from './types'

export interface CableType {
  id: string
  label: string
  /** Connecteur à chaque extrémité (identifiants du catalogue de connecteurs) */
  ends: [string, string]
  /** Longueurs disponibles au parc, en mètres */
  lengthsM?: number[]
  /** Vrai pour un câble adaptateur (extrémités de familles différentes) */
  adapter?: boolean
  /** Constructeur et référence, quand ils sont connus */
  reference?: string
  /** Multipaire : nombre de voies audio transportées (éclaté D-Sub 25, multipaire de location) */
  pairs?: number
  /** Genre des XLR épanouis d'un éclaté : femelles côté sources, mâles côté entrées */
  xlrGender?: 'male' | 'female'
  /** Multipaire de liaison longue (plusieurs liaisons, une paire chacune) : se choisit dans l'onglet Multipaires */
  multicore?: boolean
}

// Sources : liste du parc matériel fournie le 2026-09-24 ; références Sennheiser d'après les notices
// EK 100 G3 (Publ. 12/16) et ew 100 G4 v2.2 ; câbles Sound Devices d'après la liste du parc.
export const CABLE_CATALOG: CableType[] = [
  { id: 'mod-xlr3', label: 'Modulation XLR 3 points', ends: ['xlr3', 'xlr3'], lengthsM: [3, 5, 10, 20] },
  { id: 'mod-xlr-trs', label: 'Câble audio symétrique XLR 3 / jack TRS', ends: ['xlr3', 'jack-trs'], adapter: true },
  { id: 'eth-cat6', label: 'Ethernet RJ45 Cat6', ends: ['rj45', 'rj45'] },
  { id: 'sdi-bnc', label: 'Vidéo HD-SDI (BNC)', ends: ['bnc', 'bnc'] },
  { id: 'hdmi', label: 'HDMI', ends: ['hdmi', 'hdmi'] },
  { id: 'nj3fc6c', label: 'Adaptateur jack TRS femelle vers XLR 3 femelle', ends: ['jack-trs', 'xlr3'], adapter: true, reference: 'Neutrik NJ3FC6C-BAG' },
  { id: 'cl100', label: 'Câble ligne jack 3,5 verrouillable vers XLR-3', ends: ['minijack', 'xlr3'], adapter: true, reference: 'Sennheiser CL 100' },
  { id: 'cl2', label: 'Câble jack 3,5 verrouillable vers XLR-3 femelle', ends: ['minijack', 'xlr3'], adapter: true, reference: 'Sennheiser CL 2' },
  { id: 'cl1', label: 'Câble ligne jack 3,5 vers jack 3,5 verrouillable', ends: ['minijack', 'minijack'], reference: 'Sennheiser CL 1' },
  { id: 'ci1n', label: 'Câble instrument jack 6,35 vers jack 3,5 verrouillable', ends: ['jack-ts', 'minijack'], adapter: true, reference: 'Sennheiser Ci 1-N' },
  { id: 'ta3-xlr', label: 'Câble TA3 femelle vers XLR 3', ends: ['ta3', 'xlr3'], adapter: true, reference: 'Sound Devices' },
  { id: 'lemo5-bnc', label: 'Câble timecode LEMO 5 vers 2 x BNC', ends: ['lemo5', 'bnc'], adapter: true, reference: 'Sound Devices' },
  // Éclatés D-Sub 25 analogiques, brochage Tascam (8 voies symétriques par connecteur)
  { id: 'db25-xlrf-8', label: 'Multipaire D-Sub 25 vers 8 XLR femelles (analogique, brochage Tascam)', ends: ['dsub25', 'xlr3'], adapter: true, pairs: 8, xlrGender: 'female', lengthsM: [1.5, 3, 5] },
  { id: 'db25-xlrm-8', label: 'Multipaire D-Sub 25 vers 8 XLR mâles (analogique, brochage Tascam)', ends: ['dsub25', 'xlr3'], adapter: true, pairs: 8, xlrGender: 'male', lengthsM: [1.5, 3, 5] },
  { id: 'db25-trs-8', label: 'Multipaire D-Sub 25 vers 8 jacks TRS (analogique, brochage Tascam)', ends: ['dsub25', 'jack-trs'], adapter: true, pairs: 8, lengthsM: [1.5, 3, 5] },
  { id: 'db25-db25-8', label: 'Multipaire D-Sub 25 vers D-Sub 25 (8 voies analogiques, brochage Tascam)', ends: ['dsub25', 'dsub25'], pairs: 8, lengthsM: [1.5, 3, 5] },
  // Multipaires analogiques génériques de location
  { id: 'mp-xlr-4', label: 'Multipaire 4 paires épanoui XLR / XLR', ends: ['xlr3', 'xlr3'], pairs: 4, multicore: true, lengthsM: [5, 10, 15] },
  { id: 'mp-xlr-8', label: 'Multipaire 8 paires épanoui XLR / XLR', ends: ['xlr3', 'xlr3'], pairs: 8, multicore: true, lengthsM: [10, 15, 25] },
  { id: 'mp-xlr-12', label: 'Multipaire 12 paires épanoui XLR / XLR', ends: ['xlr3', 'xlr3'], pairs: 12, multicore: true, lengthsM: [15, 25, 50] },
  { id: 'mp-xlr-16', label: 'Multipaire 16 paires épanoui XLR / XLR', ends: ['xlr3', 'xlr3'], pairs: 16, multicore: true, lengthsM: [25, 50] },
  { id: 'mp-box-12', label: 'Multipaire 12 paires avec boîtier de scène 12 XLR / épanoui XLR', ends: ['xlr3', 'xlr3'], pairs: 12, multicore: true, lengthsM: [25, 50] },
  { id: 'mp-box-24', label: 'Multipaire 24 paires avec boîtier de scène 24 XLR / épanoui XLR', ends: ['xlr3', 'xlr3'], pairs: 24, multicore: true, lengthsM: [30, 50] },
  { id: 'mp-box-32', label: 'Multipaire 32 paires avec boîtier de scène 32 XLR / épanoui XLR', ends: ['xlr3', 'xlr3'], pairs: 32, multicore: true, lengthsM: [30, 50] },
  { id: 'mp-harting-24', label: 'Multipaire 24 paires multibroche 72 points (type Harting)', ends: ['multipin', 'multipin'], pairs: 24, multicore: true, lengthsM: [10, 25, 50] },
  { id: 'mp-harting-36', label: 'Multipaire 36 paires multibroche 108 points (type Harting)', ends: ['multipin', 'multipin'], pairs: 36, multicore: true, lengthsM: [10, 25, 50] },
  { id: 'fan-harting-24-xlrf', label: 'Éclaté multibroche 72 points vers 24 XLR femelles', ends: ['multipin', 'xlr3'], adapter: true, pairs: 24, xlrGender: 'female' },
  { id: 'fan-harting-24-xlrm', label: 'Éclaté multibroche 72 points vers 24 XLR mâles', ends: ['multipin', 'xlr3'], adapter: true, pairs: 24, xlrGender: 'male' },
]

const BY_ID = new Map(CABLE_CATALOG.map((c) => [c.id, c]))

export function getCable(id?: string): CableType | undefined {
  return id ? BY_ID.get(id) : undefined
}

/** Vrai si le câble relie les deux connecteurs, dans un sens ou dans l'autre. */
export function cableFits(cable: CableType, a: string, b: string): boolean {
  const [x, y] = cable.ends
  return (connectorsMate(x, a) && connectorsMate(y, b)) || (connectorsMate(x, b) && connectorsMate(y, a))
}

/** Câbles du catalogue compatibles avec une paire de connecteurs (hors multipaires de l'onglet Multipaires). */
export function cablesFor(a: string, b: string): CableType[] {
  return LINK_CABLES.filter((c) => cableFits(c, a, b))
}

/** Câbles choisis sur une liaison ; les multipaires longs se gèrent dans l'onglet Multipaires. */
export const LINK_CABLES = CABLE_CATALOG.filter((c) => !c.multicore)

/** Multipaires génériques du catalogue, proposés à la création d'un multipaire du projet. */
export const MULTICORE_CATALOG = CABLE_CATALOG.filter((c) => c.multicore)

/**
 * Câble proposé d'office à la création d'une liaison : seulement quand les connecteurs ne
 * s'accouplent pas et qu'un éclaté multipaire convient (ex. entrée D-Sub 25 et sortie XLR).
 * Une entrée reçoit des XLR femelles (la source a une sortie mâle), une sortie des XLR mâles.
 */
export function suggestCable(source: string, target: string): CableType | undefined {
  if (connectorsMate(source, target)) return undefined
  const fitting = cablesFor(source, target).filter((c) => (c.pairs ?? 0) > 1)
  const multi = connectorsMate(target, 'dsub25') || connectorsMate(target, 'multipin') ? 'target' : 'source'
  const gender = multi === 'target' ? 'female' : 'male'
  const pick = fitting.filter((c) => !c.xlrGender || c.xlrGender === gender)
  return pick.length === 1 ? pick[0] : undefined
}

export interface CableBomLine {
  key: string
  /** Libellé du câble, ou paire de connecteurs si aucun câble n'est choisi */
  cableId?: string
  connectors?: [string, string]
  /** Nombre de paires, pour une ligne de multipaire */
  multicorePairs?: number
  lengthM?: number
  quantity: number
}

/** Câbles à préparer : regroupés par type de câble et par longueur. */
export function buildCableBom(project: Project, connectorOf: (l: Link) => [string, string] | undefined): CableBomLine[] {
  const lines = new Map<string, CableBomLine>()
  for (const m of Object.values(project.multicores ?? {})) {
    const key = `m:${m.cableTypeId ?? ''}:${m.pairs}|${m.lengthM ?? ''}`
    const line = lines.get(key)
    if (line) line.quantity += 1
    else lines.set(key, { key, cableId: m.cableTypeId, multicorePairs: m.pairs, lengthM: m.lengthM, quantity: 1 })
  }
  // Éclaté multipaire : un câble par prise multivoie et par tranche de voies (8 liaisons = 1 éclaté)
  const fanouts = new Map<string, number>()
  for (const l of Object.values(project.links)) {
    // Une liaison qui emprunte un multipaire ne demande pas de câble séparé
    if (l.multicoreId && project.multicores?.[l.multicoreId]) continue
    const pair = connectorOf(l)
    const cable = getCable(l.cableTypeId)
    if (cable?.pairs && cable.pairs > 1 && cable.ends[0] !== cable.ends[1] && pair) {
      const end = connectorsMate(pair[0], cable.ends[0]) ? l.source : l.target
      const key = `f:${cable.id}|${l.lengthM ?? ''}|${end.equipmentId}/${end.portId}`
      const n = (fanouts.get(key) ?? 0) + 1
      fanouts.set(key, n)
      if ((n - 1) % cable.pairs !== 0) continue
    }
    const base = cable ? `c:${cable.id}` : pair ? `p:${[...pair].sort().join('/')}` : 'p:?'
    const key = `${base}|${l.lengthM ?? ''}`
    const line = lines.get(key)
    if (line) line.quantity += 1
    else lines.set(key, { key, cableId: cable?.id, connectors: cable ? undefined : pair, lengthM: l.lengthM, quantity: 1 })
  }
  return [...lines.values()].sort((a, b) => a.key.localeCompare(b.key))
}
