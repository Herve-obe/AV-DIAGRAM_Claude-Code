// Groupes et sous-schémas. Un groupe est une feuille rattachée à une feuille parente (parentId) :
// sur la parente, il s'affiche replié en un bloc dont les ports sont les liaisons qui franchissent
// sa frontière. Les groupes s'imbriquent sans limite de profondeur.
import { DEFAULT_SHEET_ID, uid } from './project'
import type { SignalFamily } from './signals'
import type { Equipment, Project, Sheet } from './types'

export const GROUP_NODE_PREFIX = 'grp:'
export const groupNodeId = (sheetId: string) => `${GROUP_NODE_PREFIX}${sheetId}`
export const isGroupNodeId = (id: string) => id.startsWith(GROUP_NODE_PREFIX)
export const sheetIdOfGroupNode = (id: string) => id.slice(GROUP_NODE_PREFIX.length)

const sheetOf = (e: Equipment) => e.sheetId ?? DEFAULT_SHEET_ID

function sheetsById(project: Project): Map<string, Sheet> {
  return new Map((project.sheets ?? []).map((s) => [s.id, s]))
}

/** Chaîne des feuilles parentes, de la plus proche à la racine. */
export function ancestors(project: Project, sheetId: string): string[] {
  const byId = sheetsById(project)
  const out: string[] = []
  let cur = byId.get(sheetId)?.parentId
  while (cur && !out.includes(cur)) {
    out.push(cur)
    cur = byId.get(cur)?.parentId
  }
  return out
}

/**
 * Où apparaît, sur la feuille affichée, un élément posé sur `sheetId` :
 * la feuille elle-même, le groupe enfant direct qui le contient, ou rien (autre branche).
 */
export function placeOnView(project: Project, sheetId: string, viewId: string): { kind: 'self' } | { kind: 'group'; groupId: string } | null {
  if (sheetId === viewId) return { kind: 'self' }
  const byId = sheetsById(project)
  let cur = sheetId
  const seen = new Set<string>()
  while (!seen.has(cur)) {
    seen.add(cur)
    const parent = byId.get(cur)?.parentId
    if (!parent) return null
    if (parent === viewId) return { kind: 'group', groupId: cur }
    cur = parent
  }
  return null
}

/** Vrai si la feuille est le groupe lui-même ou l'un de ses descendants. */
export function isInside(project: Project, sheetId: string, groupId: string): boolean {
  return sheetId === groupId || ancestors(project, sheetId).includes(groupId)
}

export interface GroupPort {
  /** Identifiant de poignée : équipement intérieur et port, séparés par « : » */
  id: string
  name: string
  direction: 'in' | 'out'
  signal: SignalFamily
}

/** Ports d'interface d'un groupe : une poignée par liaison qui franchit sa frontière. */
export function groupInterface(project: Project, groupId: string): GroupPort[] {
  const ports = new Map<string, GroupPort>()
  for (const l of Object.values(project.links)) {
    const se = project.equipment[l.source.equipmentId]
    const te = project.equipment[l.target.equipmentId]
    if (!se || !te) continue
    const sIn = isInside(project, sheetOf(se), groupId)
    const tIn = isInside(project, sheetOf(te), groupId)
    if (sIn === tIn) continue
    const [eq, portId, direction] = sIn ? [se, l.source.portId, 'out' as const] : [te, l.target.portId, 'in' as const]
    const port = eq.ports.find((p) => p.id === portId)
    const id = `${eq.id}:${portId}`
    if (!ports.has(id)) ports.set(id, { id, name: `${eq.name} / ${port?.name ?? portId}`, direction, signal: port?.signal ?? 'audioAnalog' })
  }
  return [...ports.values()].sort((a, b) => a.name.localeCompare(b.name))
}

/** Regroupe des équipements (et annotations) de la feuille `sheetId` dans un nouveau sous-schéma. */
export function groupSelection(
  project: Project,
  sheetId: string,
  equipmentIds: string[],
  name: string,
  annotationIds: string[] = [],
): { project: Project; id: string | null } {
  const eqs = equipmentIds.map((id) => project.equipment[id]).filter((e): e is Equipment => !!e && sheetOf(e) === sheetId)
  if (!eqs.length) return { project, id: null }
  const id = uid('sh')
  const cx = eqs.reduce((s, e) => s + e.position.x, 0) / eqs.length
  const cy = eqs.reduce((s, e) => s + e.position.y, 0) / eqs.length
  const groupPosition = { x: Math.round(cx / 10) * 10, y: Math.round(cy / 10) * 10 }
  const equipment = { ...project.equipment }
  for (const e of eqs) equipment[e.id] = { ...e, sheetId: id }
  const annotations = { ...project.annotations }
  for (const aid of annotationIds) if (annotations[aid]?.sheetId === sheetId) annotations[aid] = { ...annotations[aid], sheetId: id }
  const sheets = [...(project.sheets ?? []), { id, name, parentId: sheetId, groupPosition }]
  return { project: { ...project, equipment, annotations, sheets, updatedAt: new Date().toISOString() }, id }
}

/** Dissout un groupe : son contenu et ses sous-groupes remontent dans la feuille parente. */
export function ungroup(project: Project, groupId: string): Project {
  const sheet = project.sheets?.find((s) => s.id === groupId)
  if (!sheet?.parentId) return project
  const parent = sheet.parentId
  const equipment = Object.fromEntries(
    Object.entries(project.equipment).map(([k, e]) => [k, sheetOf(e) === groupId ? { ...e, sheetId: parent } : e]),
  )
  const annotations = Object.fromEntries(
    Object.entries(project.annotations ?? {}).map(([k, a]) => [k, a.sheetId === groupId ? { ...a, sheetId: parent } : a]),
  )
  const sheets = (project.sheets ?? [])
    .filter((s) => s.id !== groupId)
    .map((s) => (s.parentId === groupId ? { ...s, parentId: parent } : s))
  return { ...project, equipment, annotations, sheets, updatedAt: new Date().toISOString() }
}

/** Déplace le bloc replié d'un groupe sur sa feuille parente. */
export function moveGroup(project: Project, groupId: string, position: { x: number; y: number }): Project {
  return { ...project, sheets: (project.sheets ?? []).map((s) => (s.id === groupId ? { ...s, groupPosition: position } : s)) }
}

/** Profondeur d'une feuille dans l'arbre (0 pour une feuille racine). */
export const depthOf = (project: Project, sheetId: string) => ancestors(project, sheetId).length

/** Feuilles dans l'ordre de l'arbre : chaque parente suivie de ses sous-schémas. */
export function sheetTree(project: Project): Sheet[] {
  const sheets = project.sheets ?? []
  const ids = new Set(sheets.map((s) => s.id))
  const out: Sheet[] = []
  const visit = (parent: string | undefined) => {
    for (const s of sheets) {
      const p = s.parentId && ids.has(s.parentId) ? s.parentId : undefined
      if (p === parent && !out.includes(s)) {
        out.push(s)
        visit(s.id)
      }
    }
  }
  visit(undefined)
  return out
}
