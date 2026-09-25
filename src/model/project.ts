// Opérations pures sur un projet : chaque fonction renvoie un NOUVEAU projet (immuable).
// Le store (src/store) les appelle et gère l'historique d'annulation.
import { formatCableLabel } from './numbering'
import type { SignalFamily } from './signals'
import type { Annotation, Equipment, EquipmentTemplate, Link, Multicore, PortDef, Project, ProjectInfo, ProjectSettings, Zone } from './types'

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
    sheets: [{ id: DEFAULT_SHEET_ID, name: 'Synoptique' }],
    annotations: {},
  }
}

export const DEFAULT_SHEET_ID = 'sh-1'

/**
 * Complète un projet ancien ou importé : feuilles, annotations, feuille de chaque équipement.
 * À appeler à chaque ouverture de fichier.
 */
export function normalizeProject(project: Project): Project {
  const sheets = project.sheets?.length ? project.sheets : [{ id: DEFAULT_SHEET_ID, name: 'Synoptique' }]
  const ids = new Set(sheets.map((s) => s.id))
  const equipment = Object.fromEntries(
    Object.entries(project.equipment).map(([k, e]) => [k, e.sheetId && ids.has(e.sheetId) ? e : { ...e, sheetId: sheets[0].id }]),
  )
  return { ...project, sheets, equipment, annotations: project.annotations ?? {}, multicores: project.multicores ?? {} }
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
  extra: Partial<Pick<Equipment, 'name' | 'zoneId' | 'sheetId'>> = {},
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
    sheetId: extra.sheetId ?? project.sheets?.[0]?.id ?? DEFAULT_SHEET_ID,
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
  return formatCableLabel(project.settings.cableFormat, { ...s, num: link.num }, project.settings.typeCodes)
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

/** Donne à une liaison le prochain numéro libre de sa série (zone + type), et recalcule son étiquette. */
export function assignFreshNum(project: Project, linkId: string): Project {
  const l = project.links[linkId]
  if (!l) return project
  const series = seriesOf(project, l)
  const num = 1 + Math.max(0, ...Object.values(project.links)
    .filter((x) => x.id !== linkId)
    .filter((x) => { const s = seriesOf(project, x); return s.zone === series.zone && s.signal === series.signal })
    .map((x) => x.num))
  const next = { ...l, num }
  return { ...project, links: { ...project.links, [linkId]: { ...next, label: labelOf(project, next) } } }
}

/** Contrôle minimal d'un fichier .avd importé. */
export function isProject(value: unknown): value is Project {
  const v = value as Project
  return !!v && v.format === 1 && typeof v.name === 'string' && typeof v.equipment === 'object' && typeof v.links === 'object'
}

/* ---------- Ports (éditeur de blocs) ---------- */

/** Prochain identifiant de port libre : p1, p2, ... */
function nextPortId(ports: PortDef[]): string {
  const nums = ports.map((p) => Number(/^p(\d+)$/.exec(p.id)?.[1] ?? 0))
  return `p${Math.max(0, ...nums) + 1}`
}

export function addPort(project: Project, equipmentId: string, port: Omit<PortDef, 'id'>): { project: Project; id: string | null } {
  const eq = project.equipment[equipmentId]
  if (!eq) return { project, id: null }
  const id = nextPortId(eq.ports)
  return { project: updateEquipment(project, equipmentId, { ports: [...eq.ports, { ...port, id }] }), id }
}

export function updatePort(project: Project, equipmentId: string, portId: string, patch: Partial<Omit<PortDef, 'id'>>): Project {
  const eq = project.equipment[equipmentId]
  if (!eq) return project
  const ports = eq.ports.map((p) => (p.id === portId ? { ...p, ...patch } : p))
  // Le signal détermine la série de numérotation des câbles
  return relabelAll(updateEquipment(project, equipmentId, { ports }))
}

/** Supprime un port et les liaisons qui l'utilisent. */
export function removePort(project: Project, equipmentId: string, portId: string): Project {
  const eq = project.equipment[equipmentId]
  if (!eq) return project
  const uses = (r: { equipmentId: string; portId: string }) => r.equipmentId === equipmentId && r.portId === portId
  const linkIds = Object.values(project.links).filter((l) => uses(l.source) || uses(l.target)).map((l) => l.id)
  const p = removeElements(project, [], linkIds)
  return updateEquipment(p, equipmentId, { ports: eq.ports.filter((x) => x.id !== portId) })
}

/** Crée une fiche "utilisateur" à partir d'un équipement du projet (modèle perso réutilisable). */
export function templateFromEquipment(eq: Equipment): EquipmentTemplate {
  return {
    id: uid('usr'),
    family: eq.family,
    manufacturer: eq.manufacturer,
    model: eq.name,
    pictogram: eq.pictogram,
    ports: eq.ports.map((p) => ({ ...p })),
    powerW: eq.powerW,
    weightKg: eq.weightKg,
    rackU: eq.rackU,
    status: 'user',
  }
}

/* ---------- Zones et réglages ---------- */

/** Code de zone : majuscules et chiffres, 2 à 6 caractères. */
export function normalizeZoneCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
}

export function addZone(project: Project, name: string, code: string): { project: Project; id: string } {
  const id = uid('z')
  const zone: Zone = { id, name, code: normalizeZoneCode(code) || 'Z' }
  return { project: touch({ ...project, zones: [...project.zones, zone] }), id }
}

export function updateZone(project: Project, id: string, patch: Partial<Omit<Zone, 'id'>>): Project {
  const zones = project.zones.map((z) =>
    z.id === id ? { ...z, ...patch, code: patch.code !== undefined ? normalizeZoneCode(patch.code) || z.code : z.code } : z,
  )
  return relabelAll(touch({ ...project, zones }))
}

/** Supprime une zone : les équipements concernés n'ont plus de zone. */
export function removeZone(project: Project, id: string): Project {
  const equipment = Object.fromEntries(
    Object.entries(project.equipment).map(([k, e]) => [k, e.zoneId === id ? { ...e, zoneId: undefined } : e]),
  )
  return relabelAll(touch({ ...project, zones: project.zones.filter((z) => z.id !== id), equipment }))
}

export function updateSettings(project: Project, patch: Partial<ProjectSettings>): Project {
  return relabelAll(touch({ ...project, settings: { ...project.settings, ...patch } }))
}

export function updateInfo(project: Project, patch: Partial<ProjectInfo>): Project {
  return touch({ ...project, info: { ...project.info, ...patch } })
}

/* ---------- Feuilles ---------- */

export function addSheet(project: Project, name: string): { project: Project; id: string } {
  const id = uid('sh')
  const sheets = [...(normalizeProject(project).sheets ?? []), { id, name }]
  return { project: touch({ ...project, sheets }), id }
}

export function renameSheet(project: Project, id: string, name: string): Project {
  return touch({ ...project, sheets: (project.sheets ?? []).map((s) => (s.id === id ? { ...s, name } : s)) })
}

/** Supprime une feuille et tout ce qu'elle contient. La dernière feuille ne peut pas être supprimée. */
export function removeSheet(project: Project, id: string): Project {
  const sheets = project.sheets ?? []
  if (sheets.length <= 1) return project
  const eqIds = Object.values(project.equipment).filter((e) => e.sheetId === id).map((e) => e.id)
  const p = removeElements(project, eqIds, [])
  const annotations = Object.fromEntries(Object.entries(p.annotations ?? {}).filter(([, a]) => a.sheetId !== id))
  // Les sous-schémas de la feuille supprimée remontent d'un niveau
  const removed = sheets.find((s) => s.id === id)
  const rest = sheets.filter((s) => s.id !== id).map((s) => (s.parentId === id ? { ...s, parentId: removed?.parentId } : s))
  return touch({ ...p, sheets: rest, annotations })
}

/** Nom de la feuille d'un équipement (pour les renvois entre feuilles). */
export function sheetName(project: Project, sheetId: string | undefined): string {
  return project.sheets?.find((s) => s.id === sheetId)?.name ?? ''
}

/* ---------- Annotations ---------- */

export function addAnnotation(project: Project, a: Omit<Annotation, 'id'>): { project: Project; id: string } {
  const id = uid('an')
  return { project: touch({ ...project, annotations: { ...project.annotations, [id]: { ...a, id } } }), id }
}

export function updateAnnotation(project: Project, id: string, patch: Partial<Omit<Annotation, 'id'>>): Project {
  const a = project.annotations?.[id]
  if (!a) return project
  return { ...project, annotations: { ...project.annotations, [id]: { ...a, ...patch } }, updatedAt: new Date().toISOString() }
}

export function removeAnnotations(project: Project, ids: string[]): Project {
  if (!ids.length) return project
  const set = new Set(ids)
  return touch({ ...project, annotations: Object.fromEntries(Object.entries(project.annotations ?? {}).filter(([k]) => !set.has(k))) })
}


// ---------- Multipaires ----------

/** Crée un multipaire ; l'étiquette par défaut suit la série MP-01, MP-02... */
export function addMulticore(project: Project, init: Partial<Omit<Multicore, 'id'>> = {}): { project: Project; id: string } {
  const id = uid('mc')
  const existing = new Set(Object.values(project.multicores ?? {}).map((m) => m.label))
  let n = 1
  while (existing.has(`MP-${String(n).padStart(2, '0')}`)) n++
  const mc: Multicore = { id, label: `MP-${String(n).padStart(2, '0')}`, pairs: 8, ...init }
  return { project: touch({ ...project, multicores: { ...project.multicores, [id]: mc } }), id }
}

export function updateMulticore(project: Project, id: string, patch: Partial<Omit<Multicore, 'id'>>): Project {
  const m = project.multicores?.[id]
  if (!m) return project
  return touch({ ...project, multicores: { ...project.multicores, [id]: { ...m, ...patch } } })
}

/** Supprime un multipaire ; les liaisons qui l'empruntaient redeviennent des câbles simples. */
export function removeMulticore(project: Project, id: string): Project {
  const multicores = Object.fromEntries(Object.entries(project.multicores ?? {}).filter(([k]) => k !== id))
  const links = Object.fromEntries(
    Object.entries(project.links).map(([k, l]) => {
      if (l.multicoreId !== id) return [k, l]
      const rest = { ...l }
      delete rest.multicoreId
      delete rest.pair
      return [k, rest]
    }),
  )
  return touch({ ...project, multicores, links })
}

/** Occupation d'un multipaire : numéro de paire vers identifiants des liaisons. */
export function multicoreUsage(project: Project, id: string): Map<number, string[]> {
  const used = new Map<number, string[]>()
  for (const l of Object.values(project.links)) {
    if (l.multicoreId !== id || !l.pair) continue
    used.set(l.pair, [...(used.get(l.pair) ?? []), l.id])
  }
  return used
}

/** Première paire libre d'un multipaire, ou undefined s'il est plein. */
export function firstFreePair(project: Project, id: string): number | undefined {
  const m = project.multicores?.[id]
  if (!m) return undefined
  const used = multicoreUsage(project, id)
  for (let i = 1; i <= m.pairs; i++) if (!used.has(i)) return i
  return undefined
}
