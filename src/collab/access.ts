// Droits attribués par l'hôte. Un invité n'édite que depuis un calque explicitement attribué.
import { LAYERS, layerOfSignal, primaryLayer, type Layer, type LayerView } from '../model/layers'
import type { Project } from '../model/types'
import { checkChange, linkLayer, type Claims } from './protection'

const equal = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
export function guestLayers(claims: Claims, userId: string): Set<Layer> {
  return new Set(LAYERS.filter(l => claims[l]?.userId === userId))
}
export function checkGuestChange(prev: Project, next: Project, allowed: Set<Layer>, view: LayerView): boolean {
  if (equal(prev, next)) return true
  if (view === 'all' || !allowed.has(view) || prev.id !== next.id) return false
  // Nom, feuilles, zones, cadres, baies, multipaires et paramètres sont communs : réservés à l'hôte.
  for (const k of new Set([...Object.keys(prev), ...Object.keys(next)])) {
    if (['equipment', 'links', 'updatedAt'].includes(k)) continue
    if (!equal(prev[k as keyof Project], next[k as keyof Project])) return false
  }
  const editable = new Set<Layer>([view])
  if (checkChange(prev, next, new Set(LAYERS.filter(l => !editable.has(l))))) return false
  for (const id of new Set([...Object.keys(prev.equipment), ...Object.keys(next.equipment)])) {
    const a = prev.equipment[id], b = next.equipment[id]
    if (equal(a, b)) continue
    if (!a || !b) { if (primaryLayer((a ?? b)!) !== view) return false; continue }
    // La position et le nom d'un appareil partagé appartiennent à son domaine principal.
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
      if (k !== 'ports' && !equal(a[k as keyof typeof a], b[k as keyof typeof b]) && primaryLayer(a) !== view) return false
    }
    for (const portId of new Set([...a.ports.map(p => p.id), ...b.ports.map(p => p.id)])) {
      const pa = a.ports.find(p => p.id === portId), pb = b.ports.find(p => p.id === portId)
      if (equal(pa, pb)) continue
      for (const p of [pa, pb]) if (p && (layerOfSignal(p.signal) ?? primaryLayer(a)) !== view) return false
    }
  }
  for (const id of new Set([...Object.keys(prev.links), ...Object.keys(next.links)])) {
    const a = prev.links[id], b = next.links[id]
    if (equal(a, b)) continue
    if ((a && linkLayer(prev, a) !== view) || (b && linkLayer(next, b) !== view)) return false
  }
  return true
}
