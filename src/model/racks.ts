// Vue Baies (élévation de rack, cahier des charges V4) : baies 19", montage des équipements en U,
// faces avant et arrière, bilans par baie. Un équipement monté reste la même instance que sur le
// synoptique : seul son champ `mount` indique sa place dans la baie.
import { uid } from './project'
import type { Equipment, Project, Rack, RackFace } from './types'

/** Hauteur d'une unité de baie, en mm (EIA-310) */
export const U_MM = 44.45
/** Hauteurs de baie proposées dans l'interface */
export const RACK_HEIGHTS = [4, 6, 8, 10, 12, 16, 20, 24, 32, 42, 45, 47] as const
/** 1 W dissipé = 3,412 BTU/h */
export const BTU_PER_W = 3.412

const touch = (p: Project): Project => ({ ...p, updatedAt: new Date().toISOString() })

/** Hauteur occupée en U (au moins 1 : un équipement sans hauteur renseignée compte pour 1 U) */
export const heightOf = (eq: Equipment) => Math.max(1, Math.round(eq.rackU ?? 1))

export function addRack(project: Project, init: Partial<Omit<Rack, 'id'>> = {}): { project: Project; id: string } {
  const id = uid('rk')
  const names = new Set(Object.values(project.racks ?? {}).map((r) => r.name))
  let n = Object.keys(project.racks ?? {}).length + 1
  while (names.has(`Baie ${n}`)) n++
  const rack: Rack = { id, name: `Baie ${n}`, heightU: 12, ...init }
  return { project: touch({ ...project, racks: { ...project.racks, [id]: rack } }), id }
}

export function updateRack(project: Project, id: string, patch: Partial<Omit<Rack, 'id'>>): Project {
  const rack = project.racks?.[id]
  if (!rack) return project
  return touch({ ...project, racks: { ...project.racks, [id]: { ...rack, ...patch } } })
}

/** Supprime la baie ; ses équipements restent dans le projet, démontés. */
export function removeRack(project: Project, id: string): Project {
  if (!project.racks?.[id]) return project
  const racks = Object.fromEntries(Object.entries(project.racks).filter(([k]) => k !== id))
  const equipment = Object.fromEntries(
    Object.entries(project.equipment).map(([k, eq]) => [k, eq.mount?.rackId === id ? withoutMount(eq) : eq]),
  )
  return touch({ ...project, racks, equipment })
}

function withoutMount(eq: Equipment): Equipment {
  const rest = { ...eq }
  delete rest.mount
  return rest
}

/** Équipements montés dans une baie (une face ou les deux), du haut vers le bas. */
export function mountedIn(project: Project, rackId: string, face?: RackFace): Equipment[] {
  return Object.values(project.equipment)
    .filter((eq) => eq.mount?.rackId === rackId && (!face || eq.mount.face === face))
    .sort((a, b) => b.mount!.u - a.mount!.u)
}

export type MountError = 'noRack' | 'noEquipment' | 'outOfRack' | 'overlap'

/**
 * Vérifie qu'un équipement tient à la position u (unité basse) sur la face donnée :
 * dans la hauteur de la baie et sans chevaucher un autre équipement de la même face.
 */
export function checkMount(project: Project, eqId: string, rackId: string, u: number, face: RackFace): MountError | null {
  const rack = project.racks?.[rackId]
  if (!rack) return 'noRack'
  const eq = project.equipment[eqId]
  if (!eq) return 'noEquipment'
  const h = heightOf(eq)
  if (!Number.isInteger(u) || u < 1 || u + h - 1 > rack.heightU) return 'outOfRack'
  const clash = mountedIn(project, rackId, face).some((o) => {
    if (o.id === eqId) return false
    const lo = o.mount!.u
    const hi = lo + heightOf(o) - 1
    return u <= hi && u + h - 1 >= lo
  })
  return clash ? 'overlap' : null
}

/** Monte (ou déplace) un équipement ; refuse si la place est prise ou hors de la baie. */
export function mountEquipment(
  project: Project,
  eqId: string,
  rackId: string,
  u: number,
  face: RackFace = 'front',
): { project: Project; error: MountError | null } {
  const error = checkMount(project, eqId, rackId, u, face)
  if (error) return { project, error }
  const eq = project.equipment[eqId]
  return { project: touch({ ...project, equipment: { ...project.equipment, [eqId]: { ...eq, mount: { rackId, u, face } } } }), error: null }
}

export function unmountEquipment(project: Project, eqId: string): Project {
  const eq = project.equipment[eqId]
  if (!eq?.mount) return project
  return touch({ ...project, equipment: { ...project.equipment, [eqId]: withoutMount(eq) } })
}

/** Première position libre, en partant du haut de la baie (null si l'équipement ne tient pas). */
export function firstFreeU(project: Project, eqId: string, rackId: string, face: RackFace = 'front'): number | null {
  const rack = project.racks?.[rackId]
  const eq = project.equipment[eqId]
  if (!rack || !eq) return null
  for (let u = rack.heightU - heightOf(eq) + 1; u >= 1; u--) if (!checkMount(project, eqId, rackId, u, face)) return u
  return null
}

export interface RackUsage {
  /** Unités occupées (une unité occupée à l'avant ou à l'arrière compte une fois) */
  usedU: number
  freeU: number
  weightKg: number
  powerW: number
  btuH: number
  /** Équipements dont la puissance ou le poids n'est pas renseigné */
  missingPower: number
  missingWeight: number
  /** Hauteur totale en mm (unités utiles seulement) */
  heightMm: number
}

export function rackUsage(project: Project, rackId: string): RackUsage {
  const rack = project.racks?.[rackId]
  const items = mountedIn(project, rackId)
  const occupied = new Set<number>()
  for (const eq of items) for (let i = 0; i < heightOf(eq); i++) occupied.add(eq.mount!.u + i)
  const powerW = items.reduce((s, e) => s + (e.powerW ?? 0), 0)
  return {
    usedU: occupied.size,
    freeU: Math.max(0, (rack?.heightU ?? 0) - occupied.size),
    weightKg: Math.round(items.reduce((s, e) => s + (e.weightKg ?? 0), 0) * 10) / 10,
    powerW,
    btuH: Math.round(powerW * BTU_PER_W),
    missingPower: items.filter((e) => e.powerW == null).length,
    missingWeight: items.filter((e) => e.weightKg == null).length,
    heightMm: Math.round((rack?.heightU ?? 0) * U_MM * 10) / 10,
  }
}

/** Équipements rackables (hauteur en U renseignée) qui ne sont montés dans aucune baie. */
export function unmountedRackable(project: Project): Equipment[] {
  return Object.values(project.equipment)
    .filter((eq) => (eq.rackU ?? 0) > 0 && !eq.mount)
    .sort((a, b) => a.name.localeCompare(b.name))
}

/** Montages devenus invalides (baie supprimée, baie raccourcie, hauteur modifiée) */
export function invalidMounts(project: Project): Equipment[] {
  return Object.values(project.equipment).filter(
    (eq) => eq.mount && checkMount(project, eq.id, eq.mount.rackId, eq.mount.u, eq.mount.face) !== null,
  )
}

/** Clé de rappel ignoré (Equipment.dismissedHints) pour « rackable mais absent des baies » */
export const RACK_HINT = 'rack:unmounted'

export interface RackHint {
  equipmentId: string
  /** unmounted : rackable, absent des baies (le projet a au moins une baie) ; invalid : montage à revoir */
  kind: 'unmounted' | 'invalid'
}

/**
 * Alertes entre vues liées (cahier des charges 3.1) : équipement présent sur le synoptique mais
 * absent des baies, désactivable par équipement ; montage devenu invalide.
 */
export function rackHints(project: Project): RackHint[] {
  const out: RackHint[] = invalidMounts(project).map((eq) => ({ equipmentId: eq.id, kind: 'invalid' as const }))
  if (Object.keys(project.racks ?? {}).length) {
    for (const eq of unmountedRackable(project)) {
      if (!eq.dismissedHints?.includes(RACK_HINT)) out.push({ equipmentId: eq.id, kind: 'unmounted' })
    }
  }
  return out
}
