// Alertes de compatibilité du projet courant, recalculées seulement quand le projet change.
import { useMemo } from 'react'
import { checkProject, type Issue, type Severity } from '../model/rules'
import { useProject } from './projectStore'

export function useIssues(): Issue[] {
  const project = useProject((s) => s.project)
  return useMemo(() => checkProject(project), [project])
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
