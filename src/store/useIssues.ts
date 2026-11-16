// Alertes de compatibilité du projet courant, recalculées seulement quand le projet change.
import { checkProject, type Issue, type Severity } from '../model/rules'
import type { Project } from '../model/types'
import { useProject } from './projectStore'

/**
 * Un seul calcul par version du projet, partagé par tous les composants (canevas, inspecteur, panneau
 * du bas, guide). Le projet est immuable : chaque modification crée un nouvel objet, et les anciennes
 * versions sortent du cache avec lui.
 */
const cache = new WeakMap<Project, Issue[]>()

export function issuesOf(project: Project): Issue[] {
  let issues = cache.get(project)
  if (!issues) {
    issues = checkProject(project)
    cache.set(project, issues)
  }
  return issues
}

/** Alertes du projet courant, ou du projet donné (aperçu d'une proposition de l'assistant). */
export function useIssues(project?: Project): Issue[] {
  const stored = useProject((s) => s.project)
  return issuesOf(project ?? stored)
}

/** Gravité la plus haute par liaison (pour colorer les étiquettes de câble). */
export function worstByLink(issues: Issue[]): Map<string, Severity> {
  const rank: Record<Severity, number> = { error: 0, warning: 1, info: 2 }
  const map = new Map<string, Severity>()
  for (const i of issues) {
    const cur = map.get(i.linkId)
    if (!cur || rank[i.severity] < rank[cur]) map.set(i.linkId, i.severity)
  }
  return map
}
