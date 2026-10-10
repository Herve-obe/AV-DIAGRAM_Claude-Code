// Calques réservés pendant une session : la personne qui s'occupe de l'audio réserve le calque Audio,
// les autres ne peuvent plus y toucher par erreur (et inversement). Sans réservation, tout est libre.
//
// Règles, pour un calque réservé par quelqu'un d'autre :
// - équipement dont tous les calques sont réservés par d'autres : aucune modification ;
// - équipement partagé (ex. caméra avec entrées audio) : disposition libre (position, orientation,
//   feuille, rappels) ; ses autres réglages seulement si son calque principal est libre ; ses ports
//   seulement ceux d'un calque libre ; pas de suppression ;
// - ajout d'un équipement dont le calque principal est réservé : refusé ;
// - liaison d'un calque réservé : ni ajout, ni modification, ni suppression.
// Les notes, feuilles, zones et réglages du projet restent libres.
import { layerOfSignal, layersOf, primaryLayer, type Layer } from '../model/layers'
import type { Equipment, Link, PortDef, Project } from '../model/types'

export interface Claim {
  userId: string
  name: string
  color: string
}
export type Claims = Partial<Record<Layer, Claim>>

export interface Violation {
  kind: 'equipment' | 'link'
  id: string
  layer: Layer
}

/** Calques réservés par d'autres que moi. */
export function lockedLayers(claims: Claims, me: string): Set<Layer> {
  const out = new Set<Layer>()
  for (const [layer, c] of Object.entries(claims) as [Layer, Claim | undefined][]) if (c && c.userId !== me) out.add(layer)
  return out
}

/** Calque d'une liaison : celui du signal de ses ports (synchro et contrôle : aucun). */
export function linkLayer(p: Project, l: Pick<Link, 'source' | 'target'>): Layer | null {
  for (const end of [l.source, l.target]) {
    const port = p.equipment[end.equipmentId]?.ports.find((x) => x.id === end.portId)
    if (port) return layerOfSignal(port.signal)
  }
  return null
}

/** Premier calque réservé de l'équipement s'il est entièrement réservé par d'autres, sinon null. */
export function fullyLocked(eq: Pick<Equipment, 'family' | 'ports' | 'domain'>, locked: Set<Layer>): Layer | null {
  const layers = [...layersOf(eq)]
  return layers.length > 0 && layers.every((l) => locked.has(l)) ? layers[0] : null
}

/** Champs de disposition, modifiables sur un équipement partagé */
const LAYOUT = new Set(['position', 'rotation', 'sheetId', 'dismissedHints', 'ports'])

const portLayer = (p: PortDef | undefined) => (p ? layerOfSignal(p.signal) : null)

function checkEquipment(a: Equipment | undefined, b: Equipment | undefined, locked: Set<Layer>): Layer | null {
  if (a && !b) return [...layersOf(a)].find((l) => locked.has(l)) ?? null
  if (!a && b) {
    const main = primaryLayer(b)
    return main && locked.has(main) ? main : null
  }
  if (!a || !b) return null
  const full = fullyLocked(a, locked)
  if (full) return full
  const main = primaryLayer(a)
  if (main && locked.has(main)) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)])
    for (const k of keys) {
      if (LAYOUT.has(k)) continue
      if (JSON.stringify(a[k as keyof Equipment]) !== JSON.stringify(b[k as keyof Equipment])) return main
    }
  }
  if (a.ports !== b.ports) {
    const before = new Map(a.ports.map((p) => [p.id, p]))
    const after = new Map(b.ports.map((p) => [p.id, p]))
    for (const id of new Set([...before.keys(), ...after.keys()])) {
      const pa = before.get(id)
      const pb = after.get(id)
      if (JSON.stringify(pa) === JSON.stringify(pb)) continue
      for (const l of [portLayer(pa), portLayer(pb)]) if (l && locked.has(l)) return l
    }
  }
  return null
}

/** Première modification interdite entre prev et next, ou null si tout est permis. */
export function checkChange(prev: Project, next: Project, locked: Set<Layer>): Violation | null {
  if (!locked.size) return null
  if (prev.equipment !== next.equipment) {
    for (const id of new Set([...Object.keys(prev.equipment), ...Object.keys(next.equipment)])) {
      const a = prev.equipment[id]
      const b = next.equipment[id]
      if (a === b) continue
      const layer = checkEquipment(a, b, locked)
      if (layer) return { kind: 'equipment', id, layer }
    }
  }
  if (prev.links !== next.links) {
    for (const id of new Set([...Object.keys(prev.links), ...Object.keys(next.links)])) {
      const a = prev.links[id]
      const b = next.links[id]
      if (a === b) continue
      const layer = b ? linkLayer(next, b) ?? (a ? linkLayer(prev, a) : null) : linkLayer(prev, a!)
      if (layer && locked.has(layer)) return { kind: 'link', id, layer }
    }
  }
  return null
}
