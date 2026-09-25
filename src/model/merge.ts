// Fusion de deux versions d'un même projet (échange de fichiers .avd entre collègues).
// Sans version commune de référence, la fusion est une union par identifiant :
// - un élément présent d'un seul côté est ajouté ;
// - un élément identique des deux côtés est gardé tel quel ;
// - un élément modifié des deux côtés est un conflit, tranché selon la politique choisie.
// Limite connue : une suppression faite dans l'autre version ne peut pas être détectée.
import { assignFreshNum, normalizeProject, relabelAll } from './project'
import type { Project } from './types'

export type MergeKind = 'equipment' | 'links' | 'annotations' | 'multicores' | 'sheets' | 'zones'
export type MergePolicy = 'ours' | 'theirs'

export interface MergeConflict {
  kind: MergeKind
  id: string
  name: string
}

export interface MergeReport {
  added: Record<MergeKind, number>
  conflicts: MergeConflict[]
  /** Liaisons ajoutées dont le numéro de câble existait déjà : un nouveau numéro leur est donné */
  renumbered: number
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

function mergeRecord<T extends { id: string }>(
  kind: MergeKind,
  ours: Record<string, T>,
  theirs: Record<string, T>,
  policy: MergePolicy,
  nameOf: (x: T) => string,
  report: MergeReport,
): Record<string, T> {
  const out = { ...ours }
  for (const [id, t] of Object.entries(theirs)) {
    const o = ours[id]
    if (!o) {
      out[id] = t
      report.added[kind]++
    } else if (!same(o, t)) {
      report.conflicts.push({ kind, id, name: nameOf(o) })
      if (policy === 'theirs') out[id] = t
    }
  }
  return out
}

function mergeList<T extends { id: string }>(kind: MergeKind, ours: T[], theirs: T[], policy: MergePolicy, nameOf: (x: T) => string, report: MergeReport): T[] {
  const merged = mergeRecord(kind, Object.fromEntries(ours.map((x) => [x.id, x])), Object.fromEntries(theirs.map((x) => [x.id, x])), policy, nameOf, report)
  // Ordre : celui de notre version, puis les ajouts dans l'ordre de l'autre version
  const order = [...ours.map((x) => x.id), ...theirs.map((x) => x.id).filter((id) => !ours.some((o) => o.id === id))]
  return order.map((id) => merged[id])
}

export function mergeProjects(oursIn: Project, theirsIn: Project, policy: MergePolicy = 'ours'): { project: Project; report: MergeReport } {
  const ours = normalizeProject(oursIn)
  const theirs = normalizeProject(theirsIn)
  const report: MergeReport = {
    added: { equipment: 0, links: 0, annotations: 0, multicores: 0, sheets: 0, zones: 0 },
    conflicts: [],
    renumbered: 0,
  }
  const equipment = mergeRecord('equipment', ours.equipment, theirs.equipment, policy, (e) => e.name, report)
  const links = mergeRecord('links', ours.links, theirs.links, policy, (l) => l.label, report)
  const annotations = mergeRecord('annotations', ours.annotations ?? {}, theirs.annotations ?? {}, policy, (a) => a.text.slice(0, 40), report)
  const multicores = mergeRecord('multicores', ours.multicores ?? {}, theirs.multicores ?? {}, policy, (m) => m.label, report)
  const sheets = mergeList('sheets', ours.sheets ?? [], theirs.sheets ?? [], policy, (s) => s.name, report)
  const zones = mergeList('zones', ours.zones, theirs.zones, policy, (z) => `${z.name} (${z.code})`, report)

  let project: Project = { ...ours, equipment, links, annotations, multicores, sheets, zones, updatedAt: new Date().toISOString() }
  project = relabelAll(project)

  // Numéros de câble en double : les liaisons venues de l'autre version reçoivent un nouveau numéro
  const addedLinks = Object.keys(theirs.links).filter((id) => !ours.links[id])
  const taken = new Map<string, string>()
  for (const l of Object.values(project.links)) if (!addedLinks.includes(l.id)) taken.set(l.label, l.id)
  for (const id of addedLinks) {
    const label = project.links[id]?.label
    if (label && taken.has(label)) {
      project = assignFreshNum(project, id)
      report.renumbered++
    }
    taken.set(project.links[id].label, id)
  }
  return { project, report }
}
