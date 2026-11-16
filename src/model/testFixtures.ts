import { LIBRARY_BY_ID } from '../library/generic'
import * as ops from './project'
import type { Project } from './types'

// Aides communes aux tests de src/model : modèles de la bibliothèque et petits projets.
export const tpl = (id: string) => {
  const t = LIBRARY_BY_ID.get(id)
  if (!t) throw new Error(id)
  return t
}

/** Projet minimal avec deux équipements, renvoie aussi leurs identifiants. */
export function twoBoxes(a: string, b: string): { p: Project; a: string; b: string } {
  let p = ops.createProject('test')
  const ra = ops.addEquipment(p, tpl(a), { x: 0, y: 0 }, { zoneId: 'z-scn' })
  p = ra.project
  const rb = ops.addEquipment(p, tpl(b), { x: 300, y: 0 })
  return { p: rb.project, a: ra.id, b: rb.id }
}
