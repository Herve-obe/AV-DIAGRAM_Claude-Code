// Opérations pures sur un projet : chaque fonction renvoie un NOUVEAU projet (immuable).
// Le store (src/store) les appelle et gère l'historique d'annulation.
import { formatCableLabel } from './numbering'
import type { SignalFamily } from './signals'
import type { Equipment, EquipmentTemplate, Link, Project } from './types'

export function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

export function createProject(name: string): Project {
  const now = new Date().toISOString()
  return {
    format: 1,
    id: uid('prj'),
    name,
    createdAt: now,
    updatedAt: now,
    equipment: {},
    links: {},
    zones: [
      { id: 'z-scn', name: 'Scène', code: 'SCN' },
      { id: 'z-foh', name: 'Régie façade', code: 'FOH' },
      { id: 'z-mon', name: 'Régie retours', code: 'MON' },
      { id: 'z-vid', name: 'Régie vidéo', code: 'VID' },
    ],
    settings: { cableFormat: '{ZONE}-{TYPE}-{NUM:000}', defaultZoneCode: 'GEN', mainsVoltage: 230 },
  }
}

function touch(p: Project): Project {
  return { ...p, updatedAt: new Date().toISOString() }
}

/** Nom unique : "Micro dynamique", puis "Micro dynamique 2", "Micro dynamique 3"... */
function uniqueName(project: Project, base: string): string {
  const names = new Set(Object.values(project.equipment).map((e) => e.name))
  if (!names.has(base)) return base
  let i = 2
  while (names.has(`${base} ${i}`)) i++
  return `${base} ${i}`
}

export function addEquipment(
  project: Project,
  template: EquipmentTemplate,
  position: { x: number; y: number },
  extra: Partial<Pick<Equipment, 'name' | 'zoneId'>> = {},
): { project: Project; id: string } {
  const id = uid('eq')
  const eq: Equipment = {
    id,
    templateId: template.id,
    name: extra.name ?? uniqueName(project, template.model),
    model: template.model,
    manufacturer: template.manufacturer,
    pictogram: template.pictogram,
    family: template.family,
    ports: template.ports.map((p) => ({ ...p })),
    powerW: template.powerW,
    weightKg: template.weightKg,
    rackU: template.rackU,
    zoneId: extra.zoneId,
    position,
  }
  return { project: touch({ ...project, equipment: { ...project.equipment, [id]: eq } }), id }
}

export function updateEquipment(project: Project, id: string, patch: Partial<Omit<Equipment, 'id'>>): Project {
  const eq = project.equipment[id]
  if (!eq) return project
  const next = touch({ ...project, equipment: { ...project.equipment, [id]: { ...eq, ...patch } } })
  // Changer la zone change le préfixe des câbles qui partent de cet équipement
  return 'zoneId' in patch ? relabelAll(next) : next
}

export function moveEquipment(project: Project, id: string, position: { x: number; y: number }): Project {
  const eq = project.equipment[id]
  if (!eq) return project
  return { ...project, equipment: { ...project.equipment, [id]: { ...eq, position } } }
}

/** Zone (code) et signal qui déterminent la série de numérotation d'une liaison. */
function seriesOf(project: Project, link: Pick<Link, 'source'>): { zone: string; signal: SignalFamily } {
  const eq = project.equipment[link.source.equipmentId]
  const zone = project.zones.find((z) => z.id === eq?.zoneId)?.code ?? project.settings.defaultZoneCode
  const signal = eq?.ports.find((p) => p.id === link.source.portId)?.signal ?? 'audioAnalog'
  return { zone, signal }
}

function labelOf(project: Project, link: Pick<Link, 'source' | 'num'>): string {
  const s = seriesOf(project, link)
  return formatCableLabel(project.settings.cableFormat, { ...s, num: link.num })
}

/** Recalcule toutes les étiquettes (après un changement de zone ou de format). */
export function relabelAll(project: Project): Project {
  const links: Record<string, Link> = {}
  for (const l of Object.values(project.links)) links[l.id] = { ...l, label: labelOf(project, l) }
  return { ...project, links }
}

type PortRef = { equipmentId: string; portId: string }

/**
 * Crée une liaison. Si l'utilisateur a tiré depuis une entrée vers une sortie, le sens est rétabli.
 * Les incompatibilités ne bloquent pas : elles sont signalées par les règles (rules.ts).
 */
export function connect(project: Project, a: PortRef, b: PortRef): { project: Project; id: string | null } {
  if (a.equipmentId === b.equipmentId && a.portId === b.portId) return { project, id: null }
  const pa = project.equipment[a.equipmentId]?.ports.find((p) => p.id === a.portId)
  const pb = project.equipment[b.equipmentId]?.ports.find((p) => p.id === b.portId)
  if (!pa || !pb) return { project, id: null }
  const [source, target] = pa.direction === 'in' && pb.direction !== 'in' ? [b, a] : [a, b]

  const duplicate = Object.values(project.links).some(
    (l) =>
      l.source.equipmentId === source.equipmentId && l.source.portId === source.portId &&
      l.target.equipmentId === target.equipmentId && l.target.portId === target.portId,
  )
  if (duplicate) return { project, id: null }

  const series = seriesOf(project, { source })
  const num =
    1 +
    Math.max(
      0,
      ...Object.values(project.links)
        .filter((l) => {
          const s = seriesOf(project, l)
          return s.zone === series.zone && s.signal === series.signal
        })
        .map((l) => l.num),
    )
  const id = uid('lk')
  const link: Link = { id, num, label: '', source, target }
  link.label = labelOf(project, link)
  return { project: touch({ ...project, links: { ...project.links, [id]: link } }), id }
}

export function updateLink(project: Project, id: string, patch: Partial<Omit<Link, 'id' | 'source' | 'target'>>): Project {
  const l = project.links[id]
  if (!l) return project
  const merged = { ...l, ...patch }
  if ('num' in patch) merged.label = labelOf(project, merged)
  return touch({ ...project, links: { ...project.links, [id]: merged } })
}

/** Supprime des équipements (et leurs liaisons) et des liaisons. */
export function removeElements(project: Project, equipmentIds: string[], linkIds: string[]): Project {
  const eqSet = new Set(equipmentIds)
  const lkSet = new Set(linkIds)
  const equipment = Object.fromEntries(Object.entries(project.equipment).filter(([id]) => !eqSet.has(id)))
  const links = Object.fromEntries(
    Object.entries(project.links).filter(
      ([id, l]) => !lkSet.has(id) && !eqSet.has(l.source.equipmentId) && !eqSet.has(l.target.equipmentId),
    ),
  )
  return touch({ ...project, equipment, links })
}

/** Duplique des équipements avec un décalage ; les noms sont incrémentés. */
export function duplicateEquipment(project: Project, ids: string[], offset = 40): { project: Project; ids: string[] } {
  let p = project
  const created: string[] = []
  for (const id of ids) {
    const eq = project.equipment[id]
    if (!eq) continue
    const newId = uid('eq')
    const base = eq.name.replace(/\s\d+$/, '')
    const copy: Equipment = {
      ...eq,
      id: newId,
      name: uniqueName(p, base),
      ports: eq.ports.map((pt) => ({ ...pt })),
      position: { x: eq.position.x + offset, y: eq.position.y + offset },
    }
    p = { ...p, equipment: { ...p.equipment, [newId]: copy } }
    created.push(newId)
  }
  return { project: touch(p), ids: created }
}

/** Renumérote les câbles de 1 à n dans chaque série zone + type, dans l'ordre actuel. */
export function renumberLinks(project: Project): Project {
  const groups = new Map<string, Link[]>()
  for (const l of Object.values(project.links)) {
    const s = seriesOf(project, l)
    const key = `${s.zone}|${s.signal}`
    groups.set(key, [...(groups.get(key) ?? []), l])
  }
  const links: Record<string, Link> = {}
  for (const list of groups.values()) {
    list.sort((a, b) => a.num - b.num).forEach((l, i) => {
      const next = { ...l, num: i + 1 }
      links[l.id] = { ...next, label: labelOf(project, next) }
    })
  }
  return touch({ ...project, links })
}

/** Contrôle minimal d'un fichier .avd importé. */
export function isProject(value: unknown): value is Project {
  const v = value as Project
  return !!v && v.format === 1 && typeof v.name === 'string' && typeof v.equipment === 'object' && typeof v.links === 'object'
}
