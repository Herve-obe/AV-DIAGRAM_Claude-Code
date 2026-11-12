import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { equipmentInView, type Layer, type LayerView, LAYERS } from '../model/layers'
import { isNetworkPort } from '../model/network'
import type { Equipment, Link, PortDef, Project } from '../model/types'
import { useUi } from '../store/uiStore'
import { useProject } from '../store/projectStore'
import { useCollab } from './session'
import { canEditEquipment, canEditPort, guestChangeReason, guestLayers, hasFullAccess, initialPort, linkAccess, portOccupied, sharedNetworkPort, type AccessReason } from './access'

/**
 * Les commandes affichées emploient la même politique que le garde et l'hôte.
 * Abonnement limité à ce qui fixe les droits (état de la session, réservations de calques, calque
 * affiché) : un message, une présence ou une modification du projet ne redessinent pas chaque bloc.
 * Le projet est lu au moment de l'appel ; les composants qui affichent un résultat qui en dépend
 * (occupation d'un port, liaison) s'abonnent eux-mêmes à la partie du projet qui les concerne.
 */
export function useEditing() {
  const c = useCollab(useShallow(s => ({ status: s.status, role: s.role, started: s.started, claims: s.claims, userId: s.userId })))
  const layer = useUi(s => s.layer)
  return useMemo(() => {
    const project = () => useProject.getState().project
    const common = c.status === 'off' || c.role === 'host' || (c.role === 'guest' && c.started && hasFullAccess(c.claims, c.userId))
    const active = c.role === 'guest' && c.started && layer !== 'all'
    const allowed = common ? new Set(LAYERS) : active ? guestLayers(c.claims, c.userId) : new Set<Layer>()
    const reason: AccessReason = !c.started ? { code: 'waiting' as const } : layer === 'all' ? { code: 'general' as const } : { code: 'equipment' as const }
    const shared = (e: Equipment) => active && allowed.size > 0 && e.ports.some(p => sharedNetworkPort(e, p))
    const connection = (a: Equipment, ap: PortDef, b: Equipment, bp: PortDef, id?: string) => ({ source: { equipmentId: a.id, portId: ap.id }, target: { equipmentId: b.id, portId: bp.id }, id })
    return {
      common, allowed,
      reason,
      equipmentReason: (e: Equipment): AccessReason => active ? { code: 'equipment' as const, params: { name: e.name } } : reason,
      portReason: (e: Equipment, p: PortDef): AccessReason => active ? { code: 'port' as const, params: { name: e.name, port: p.name } } : reason,
      equipment: (e: Equipment) => common || (active && canEditEquipment(e, allowed)),
      port: (e: Equipment, p: PortDef) => common || (active && canEditPort(e, p, allowed)),
      connectable: (e: Equipment, p: PortDef) => common || (active && (canEditPort(e, p, allowed) || (allowed.size > 0 && sharedNetworkPort(e, p) && !portOccupied(project(), { equipmentId: e.id, portId: p.id })))),
      technical: (e: Equipment, p: PortDef) => active && canEditEquipment(e, allowed) && ['network', 'power', 'sync', 'control'].includes(p.signal),
      shared,
      visible: (e: Equipment, view: LayerView) => equipmentInView(e, view) || shared(e) || (active && view === 'network' && canEditEquipment(e, allowed) && e.ports.some(isNetworkPort)),
      link: (a: Equipment, ap: PortDef, b: Equipment, bp: PortDef, id?: string) => common || (active && !linkAccess(project(), connection(a, ap, b, bp, id), allowed)),
      existingLink: (l: Link) => common || (active && !linkAccess(project(), l, allowed)),
      initialPort: (e: Equipment) => common || active ? initialPort(e, allowed, layer) : null,
      changeReason: (next: Project) => common ? null : !active ? reason : guestChangeReason(project(), next, allowed, layer),
    }
  }, [c.status, c.role, c.started, c.claims, c.userId, layer])
}
