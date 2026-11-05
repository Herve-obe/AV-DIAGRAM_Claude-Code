// Les profils attribués autorisent des opérations métier ; le filtre Général reste en lecture seule.
import { LAYERS, layerOfSignal, primaryLayer, type Layer, type LayerView } from '../model/layers'
import { familiesCompatible } from '../model/signals'
import type { Equipment, Link, PortDef, Project } from '../model/types'
import { claimMembers, type Claims } from './protection'
import { sameData as equal } from './compare'

export function guestLayers(claims: Claims, userId: string): Set<Layer> {
  return new Set(LAYERS.filter(l => claimMembers(claims[l]).some(c => c.userId === userId)))
}
export interface AccessReason {
  code: 'general' | 'waiting' | 'equipment' | 'port' | 'link' | 'busy' | 'common' | 'history'
  params?: Record<string, string | number>
}
export function canEditEquipment(e: Pick<Equipment, 'family'>, allowed: Set<Layer>): boolean {
  const layer = primaryLayer(e)
  return layer !== null && allowed.has(layer)
}
export const sharedNetworkPort = (e: Pick<Equipment, 'family'>, p: Pick<PortDef, 'signal'>) => e.family === 'network' && p.signal === 'network'
export function canEditPort(e: Pick<Equipment, 'family'>, p: Pick<PortDef, 'signal'>, allowed: Set<Layer>): boolean {
  // Un port de switch reste une configuration d'infrastructure, quel que soit son signal annoncé.
  if (e.family === 'network' && !allowed.has('network')) return false
  const layer = layerOfSignal(p.signal)
  if (layer === 'sound' || layer === 'image' || layer === 'light') return allowed.has(layer)
  return (layer !== null && allowed.has(layer)) || canEditEquipment(e, allowed)
}
type End = Link['source']
const sameEnd = (a: End, b: End) => a.equipmentId === b.equipmentId && a.portId === b.portId
export function portOccupied(project: Project, end: End, except?: string): boolean {
  return Object.values(project.links).some(l => l.id !== except && (sameEnd(l.source, end) || sameEnd(l.target, end)))
}
/** Même règle pour le garde, les poignées et les commandes de liaison. */
export function linkAccess(project: Project, link: Pick<Link, 'source' | 'target'> & { id?: string }, allowed: Set<Layer>, occupancy = project): AccessReason | null {
  const ends = [link.source, link.target].map(ref => {
    const e = project.equipment[ref.equipmentId], p = e?.ports.find(p => p.id === ref.portId)
    return { ref, e, p }
  })
  if (ends.some(x => !x.e || !x.p)) return { code: 'common' }
  const [a, b] = ends as { ref: End; e: Equipment; p: PortDef }[]
  const own = ends.map(x => canEditPort(x.e!, x.p!, allowed))
  if (own.every(Boolean)) return null
  for (const [index, other] of [[0, b], [1, a]] as const) {
    const shared = ends[index]
    if (!own[1 - index] || !sharedNetworkPort(shared.e!, shared.p!)) continue
    if (!familiesCompatible(shared.p!.signal, other.p.signal)) return { code: 'link', params: { name: shared.e!.name, port: shared.p!.name } }
    if (portOccupied(occupancy, shared.ref, link.id)) return { code: 'busy', params: { name: shared.e!.name, port: shared.p!.name } }
    return null
  }
  return { code: 'link', params: { name: !own[0] ? a.e.name : b.e.name, port: !own[0] ? a.p.name : b.p.name } }
}

const DEFAULT_PORT: Record<Layer, Pick<PortDef, 'signal' | 'connector' | 'direction'>> = {
  sound: { signal: 'audioAnalog', connector: 'xlr3', direction: 'in' },
  image: { signal: 'video', connector: 'bnc', direction: 'in' },
  light: { signal: 'dmx', connector: 'xlr5', direction: 'in' },
  network: { signal: 'network', connector: 'rj45', direction: 'bidir' },
  distribution: { signal: 'power', connector: 'iec-c13', direction: 'in' },
}
export function initialPort(e: Pick<Equipment, 'family'>, allowed: Set<Layer>, view: LayerView): Pick<PortDef, 'signal' | 'connector' | 'direction'> | null {
  const main = primaryLayer(e)
  const order = [view !== 'all' ? view : main, main, ...LAYERS]
  for (const layer of order) {
    if (layer && canEditPort(e, DEFAULT_PORT[layer], allowed)) return DEFAULT_PORT[layer]
  }
  return null
}
export function guestChangeReason(prev: Project, next: Project, allowed: Set<Layer>, view: LayerView): AccessReason | null {
  if (equal(prev, next)) return null
  if (view === 'all') return { code: 'general' }
  if (prev.id !== next.id || !allowed.size) return { code: 'common' }
  for (const k of new Set([...Object.keys(prev), ...Object.keys(next)])) {
    if (['equipment', 'links', 'updatedAt'].includes(k)) continue
    if (!equal(prev[k as keyof Project], next[k as keyof Project])) return { code: 'common' }
  }
  // Vérifier aussi les anciennes liaisons empêche de libérer un port protégé puis de le réutiliser.
  for (const id of new Set([...Object.keys(prev.links), ...Object.keys(next.links)])) {
    const a = prev.links[id], b = next.links[id]
    if (equal(a, b)) continue
    if (a) { const reason = linkAccess(prev, a, allowed); if (reason) return { ...reason, params: { ...reason.params, link: a.label } } }
    if (b) {
      const reason = linkAccess(next, b, allowed, prev) ?? linkAccess(next, b, allowed)
      if (reason) return { ...reason, params: { ...reason.params, link: b.label } }
    }
  }
  for (const id of new Set([...Object.keys(prev.equipment), ...Object.keys(next.equipment)])) {
    const a = prev.equipment[id], b = next.equipment[id]
    if (equal(a, b)) continue
    const e = (a ?? b)!
    if (!a || !b) {
      if (!canEditEquipment(e, allowed)) return { code: 'equipment', params: { name: e.name } }
      if (a && !b) for (const link of Object.values(prev.links)) {
        if (link.source.equipmentId !== id && link.target.equipmentId !== id) continue
        const reason = linkAccess(prev, link, allowed)
        if (reason) return reason
      }
      continue
    }
    if (a.id !== b.id || primaryLayer(a) !== primaryLayer(b)) return { code: 'equipment', params: { name: a.name } }
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
      if (k !== 'ports' && !equal(a[k as keyof Equipment], b[k as keyof Equipment]) && !canEditEquipment(a, allowed)) return { code: 'equipment', params: { name: a.name } }
    }
    const foreign = (ports: PortDef[]) => ports.filter(p => !canEditPort(a, p, allowed)).map(p => p.id)
    if (!equal(foreign(a.ports), foreign(b.ports))) return { code: 'port', params: { name: a.name, port: [...a.ports, ...b.ports].find(p => !canEditPort(a, p, allowed))?.name ?? '' } }
    for (const id of new Set([...a.ports.map(p => p.id), ...b.ports.map(p => p.id)])) {
      const pa = a.ports.find(p => p.id === id), pb = b.ports.find(p => p.id === id)
      if (equal(pa, pb)) continue
      for (const p of [pa, pb]) if (p && !canEditPort(a, p, allowed)) return { code: 'port', params: { name: a.name, port: p.name } }
    }
  }
  return null
}
export function checkGuestChange(prev: Project, next: Project, allowed: Set<Layer>, view: LayerView): boolean {
  return guestChangeReason(prev, next, allowed, view) === null
}
