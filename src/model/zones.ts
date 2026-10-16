// Zones tracées sur le synoptique : un cadre associé à une zone du projet donne cette zone aux
// équipements posés dedans (préfixe des numéros de câble). En sortant de tous les cadres de cette
// zone, l'équipement la perd ; une zone choisie à la main hors de tout cadre reste inchangée.
import { addAnnotation, addZone, DEFAULT_SHEET_ID, normalizeZoneCode, removeZone, updateAnnotation, updateEquipment, updateZone } from './project'
import type { Annotation, Equipment, Project } from './types'

/** Point de référence d'un bloc : un peu sous son coin haut gauche (la taille du bloc n'est pas dans le modèle). */
const ANCHOR = { x: 20, y: 20 }

const sheetOf = (x: { sheetId?: string }) => x.sheetId ?? DEFAULT_SHEET_ID

function contains(a: Annotation, eq: Equipment): boolean {
  const x = eq.position.x + ANCHOR.x
  const y = eq.position.y + ANCHOR.y
  return x >= a.position.x && x <= a.position.x + a.size.w && y >= a.position.y && y <= a.position.y + a.size.h
}

/** Zone que donne la géométrie : le plus petit cadre lié qui contient l'équipement (cadres imbriqués). */
export function frameZoneOf(project: Project, eq: Equipment): string | undefined {
  let best: Annotation | undefined
  for (const a of Object.values(project.annotations ?? {})) {
    if (a.kind !== 'frame' || !a.zoneId || sheetOf(a) !== sheetOf(eq) || !contains(a, eq)) continue
    if (!best || a.size.w * a.size.h < best.size.w * best.size.h) best = a
  }
  return best?.zoneId
}

/** Applique les zones des cadres à tous les équipements ; renvoie le même objet si rien ne change. */
export function applyFrameZones(project: Project): Project {
  const framed = new Map<string, Set<string>>()
  for (const a of Object.values(project.annotations ?? {})) {
    if (a.kind !== 'frame' || !a.zoneId || !project.zones.some((z) => z.id === a.zoneId)) continue
    framed.set(sheetOf(a), (framed.get(sheetOf(a)) ?? new Set()).add(a.zoneId))
  }
  let next = project
  for (const eq of Object.values(project.equipment)) {
    const zone = frameZoneOf(project, eq)
    const want = zone ?? (eq.zoneId && framed.get(sheetOf(eq))?.has(eq.zoneId) ? undefined : eq.zoneId)
    if (want !== eq.zoneId) next = updateEquipment(next, eq.id, { zoneId: want })
  }
  return next
}

/** Code proposé pour une nouvelle zone : 3 premières lettres du nom, rendu unique (SCE, SCE2…). */
export function suggestZoneCode(project: Project, name: string, exceptZoneId?: string): string {
  const base = (normalizeZoneCode(name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')).slice(0, 3) || 'Z').padEnd(2, 'Z')
  const used = new Set(project.zones.filter((z) => z.id !== exceptZoneId).map((z) => z.code))
  if (!used.has(base)) return base
  for (let n = 2; ; n++) if (!used.has(`${base}${n}`)) return `${base}${n}`
}

/** Crée une zone à partir d'un cadre (nom = texte du cadre) et l'y associe. */
export function zoneFromFrame(project: Project, frameId: string): { project: Project; id: string | null } {
  const a = project.annotations?.[frameId]
  if (!a) return { project, id: null }
  const name = a.text.split('\n')[0].trim() || `Zone ${project.zones.length + 1}`
  const r = addZone(project, name, suggestZoneCode(project, name))
  const p = { ...r.project, annotations: { ...r.project.annotations, [frameId]: { ...a, zoneId: r.id } } }
  return { project: applyFrameZones(p), id: r.id }
}

/** Code provisoire d'une zone posée depuis la barre d'outils (Z1, Z2…) : remplacé dès qu'on la nomme */
const PROVISIONAL = /^Z\d+$/

/** Pose une zone : un cadre lié à une nouvelle zone « Zone n » (code Zn). */
export function addZoneFrame(
  project: Project,
  frame: Pick<Annotation, 'sheetId' | 'position' | 'size' | 'color'>,
): { project: Project; frameId: string; zoneId: string } {
  let n = project.zones.length + 1
  const names = new Set(project.zones.map((z) => z.name))
  const codes = new Set(project.zones.map((z) => z.code))
  while (names.has(`Zone ${n}`) || codes.has(`Z${n}`)) n++
  const z = addZone(project, `Zone ${n}`, `Z${n}`)
  const a = addAnnotation(z.project, { ...frame, kind: 'frame', text: `Zone ${n}`, zoneId: z.id })
  return { project: applyFrameZones(a.project), frameId: a.id, zoneId: z.id }
}

/**
 * Modification d'un cadre. Cadre de zone : son texte est le nom de la zone (le code provisoire Zn
 * devient un code tiré du nom) ; la géométrie redistribue les équipements.
 */
export function updateFrame(project: Project, id: string, patch: Partial<Omit<Annotation, 'id'>>): Project {
  let p = updateAnnotation(project, id, patch)
  const a = p.annotations?.[id]
  const zone = a?.zoneId ? p.zones.find((z) => z.id === a.zoneId) : undefined
  if (zone && patch.text !== undefined) {
    const name = patch.text.split('\n')[0].trim()
    if (name && name !== zone.name) {
      p = updateZone(p, zone.id, PROVISIONAL.test(zone.code) ? { name, code: suggestZoneCode(p, name, zone.id) } : { name })
    }
  }
  return applyFrameZones(p)
}

/** Zones à supprimer avec des cadres effacés : celles qu'aucun autre cadre ne délimite plus. */
export function removeOrphanZones(project: Project, before: Project): Project {
  const still = new Set(Object.values(project.annotations ?? {}).map((a) => a.zoneId).filter(Boolean))
  let p = project
  for (const a of Object.values(before.annotations ?? {})) {
    if (a.zoneId && !project.annotations?.[a.id] && !still.has(a.zoneId) && p.zones.some((z) => z.id === a.zoneId)) p = removeZone(p, a.zoneId)
  }
  return p
}

/** Zone renommée ailleurs (Paramètres) : les cadres qui la délimitent prennent le nouveau nom. */
export function syncFrameNames(project: Project, zoneId: string): Project {
  const zone = project.zones.find((z) => z.id === zoneId)
  if (!zone) return project
  let p = project
  for (const a of Object.values(project.annotations ?? {})) {
    if (a.zoneId !== zoneId) continue
    const [first, ...rest] = a.text.split('\n')
    if (first.trim() !== zone.name) p = updateAnnotation(p, a.id, { text: [zone.name, ...rest].join('\n') })
  }
  return p
}
