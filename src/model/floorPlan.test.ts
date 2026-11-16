import { describe, expect, it } from 'vitest'
import { addEquipment, createProject, isProject } from './project'
import { DEFAULT_PLAN, footprint, metresBetween, placeOnPlan, planBounds, planOf, snapMetres, updateFloorPlan } from './floorPlan'
import { GENERIC_LIBRARY } from '../library/generic'
import { mergeProjects } from './merge'
import * as Y from 'yjs'
import { readProject, writeProject } from '../collab/ydoc'
import { checkGuestChange } from '../collab/access'

describe('plan d’implantation lié au projet', () => {
  it('conserve les anciennes positions et le montage, mesure en mètres et survit au fichier et au partage', () => {
    const made = addEquipment(createProject('Plan'), GENERIC_LIBRARY[0], { x: 123, y: 456 })
    const p = placeOnPlan(made.project, made.id, { x: 3, y: 4, angle: 90, width: 2, depth: 1 })
    expect(p.equipment[made.id].position).toEqual({ x: 123, y: 456 })
    expect(metresBetween({ x: 0, y: 0 }, p.equipment[made.id].plan!)).toBe(5)
    expect(footprint(p.equipment[made.id])[0].x).toBeCloseTo(3.5)
    expect(isProject(JSON.parse(JSON.stringify(p)))).toBe(true)
    const doc = new Y.Doc(); writeProject(doc, null, p)
    expect(readProject(doc).equipment[made.id].plan).toEqual(p.equipment[made.id].plan)
    expect(mergeProjects(made.project, p, 'theirs').project.equipment[made.id].plan).toEqual(p.equipment[made.id].plan)
    expect(placeOnPlan(p, made.id, undefined).equipment[made.id].position).toEqual({ x: 123, y: 456 })
  })
  it('refuse les géométries invalides et conserve les placements négatifs à l’export', () => {
    const made = addEquipment(createProject('Plan'), GENERIC_LIBRARY[0], { x: 0, y: 0 })
    expect(planOf(made.project, 'sh-1')).toEqual(DEFAULT_PLAN)
    expect(updateFloorPlan(made.project, 'sh-1', { width: -1 })).toBe(made.project)
    expect(placeOnPlan(made.project, made.id, { x: NaN, y: 0, angle: 0 })).toBe(made.project)
    const p = placeOnPlan(made.project, made.id, { x: -5, y: -3, angle: 0 })
    expect(planBounds(p, 'sh-1').x).toBeLessThan(-5)
    expect(snapMetres(-0.26, 0.1)).toBe(-0.3)
    expect(isProject({ ...p, sheets: [{ id: 'sh-1', name: 'Plan', plan: { ...DEFAULT_PLAN, grid: Infinity } }] })).toBe(false)
    expect(checkGuestChange(p, updateFloorPlan(p, 'sh-1', { width: 40 }), new Set(['sound']), 'sound')).toBe(false)
  })
})
