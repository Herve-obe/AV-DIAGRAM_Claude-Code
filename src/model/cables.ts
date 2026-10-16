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
}

// Sources : liste du parc matériel fournie le 2026-09-24 ; références Sennheiser d'après les notices
// EK 100 G3 (Publ. 12/16) et ew 100 G4 v2.2 ; câbles Sound Devices d'après la liste du parc.
export const CABLE_CATALOG: CableType[] = [
  { id: 'mod-xlr3', label: 'Modulation XLR 3 points', ends: ['xlr3', 'xlr3'], lengthsM: [3, 5, 10, 20] },
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

/** Câbles du catalogue compatibles avec une paire de connecteurs. */
export function cablesFor(a: string, b: string): CableType[] {
  return CABLE_CATALOG.filter((c) => cableFits(c, a, b))
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
  for (const l of Object.values(project.links)) {
    // Une liaison qui emprunte un multipaire ne demande pas de câble séparé
    if (l.multicoreId && project.multicores?.[l.multicoreId]) continue
    const pair = connectorOf(l)
    const cable = getCable(l.cableTypeId)
    const base = cable ? `c:${cable.id}` : pair ? `p:${[...pair].sort().join('/')}` : 'p:?'
    const key = `${base}|${l.lengthM ?? ''}`
    const line = lines.get(key)
    if (line) line.quantity += 1
    else lines.set(key, { key, cableId: cable?.id, connectors: cable ? undefined : pair, lengthM: l.lengthM, quantity: 1 })
  }
  return [...lines.values()].sort((a, b) => a.key.localeCompare(b.key))
}
