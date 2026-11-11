import { describe, expect, it } from 'vitest'
import { LIBRARY_BY_ID } from '../library/generic'
import { addEquipment, createProject } from '../model/project'
import { checkProject } from '../model/rules'
import { issuesOf } from './useIssues'

describe('alertes mémorisées par version du projet', () => {
  it('renvoie le même calcul pour un même projet et recalcule pour une nouvelle version', () => {
    const p = createProject('Concert')
    const first = issuesOf(p)
    expect(issuesOf(p)).toBe(first)
    expect(first).toEqual(checkProject(p))
    const next = addEquipment(p, LIBRARY_BY_ID.get('gen-console')!, { x: 0, y: 0 }).project
    expect(issuesOf(next)).not.toBe(first)
    expect(issuesOf(next)).toEqual(checkProject(next))
  })
})
