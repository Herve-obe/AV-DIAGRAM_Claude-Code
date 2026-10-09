// Zones tracées sur le synoptique : un cadre associé à une zone du projet donne cette zone aux
// équipements posés dedans (préfixe des numéros de câble). En sortant de tous les cadres de cette
// zone, l'équipement la perd ; une zone choisie à la main hors de tout cadre reste inchangée.
import { addZone, DEFAULT_SHEET_ID, normalizeZoneCode, updateEquipment } from './project'
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
export function suggestZoneCode(project: Project, name: string): string {
  const base = (normalizeZoneCode(name.normalize('NFD').replace(/[̀-ͯ]/g, '')).slice(0, 3) || 'Z').padEnd(2, 'Z')
  const used = new Set(project.zones.map((z) => z.code))
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
