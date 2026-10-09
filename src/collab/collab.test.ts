import { describe, expect, it } from 'vitest'
import * as Y from 'yjs'
import { buildSampleProject } from '../library/sample'
import * as ops from '../model/project'
import { addRack, mountEquipment } from '../model/racks'
import { createUndoManager, hasProject, observeChanges, readProject, writeProject, type ChangeSet } from './ydoc'

/** Deux documents reliés comme par le réseau : chaque mise à jour de l'un est appliquée à l'autre. */
function pair() {
  const a = new Y.Doc()
  const b = new Y.Doc()
  a.on('update', (u: Uint8Array, origin: unknown) => origin !== 'net' && Y.applyUpdate(b, u, 'net'))
  b.on('update', (u: Uint8Array, origin: unknown) => origin !== 'net' && Y.applyUpdate(a, u, 'net'))
  return { a, b }
}

describe('collaboration : document partagé', () => {
  it('écrit puis relit le projet à l\'identique', () => {
    const p = buildSampleProject()
    const doc = new Y.Doc()
    expect(hasProject(doc)).toBe(false)
    writeProject(doc, null, p)
    expect(hasProject(doc)).toBe(true)
    const back = readProject(doc)
    expect(back.equipment).toEqual(p.equipment)
    expect(back.links).toEqual(p.links)
    expect(back.sheets).toEqual(p.sheets)
    expect(back.zones).toEqual(p.zones)
    expect(back.name).toBe(p.name)
  })

  it('partage les baies et le montage des équipements', () => {
    const doc = new Y.Doc()
    const r = addRack(buildSampleProject(), { heightU: 10 })
    const eqId = Object.keys(r.project.equipment)[0]
    const p = mountEquipment(r.project, eqId, r.id, 1, 'rear').project
    writeProject(doc, null, p)
    const back = readProject(doc)
    expect(back.racks?.[r.id]?.heightU).toBe(10)
    expect(back.equipment[eqId].mount).toEqual({ rackId: r.id, u: 1, face: 'rear' })
  })
  it('fusionne deux modifications simultanées de champs différents du même équipement', () => {
    const p = buildSampleProject()
    const { a, b } = pair()
    writeProject(a, null, p)
    const id = Object.keys(p.equipment)[0]
    const pa = ops.updateEquipment(p, id, { name: 'Renommé par A' })
    const pb = ops.moveEquipment(p, id, { x: 999, y: 111 })
    writeProject(a, p, pa, 'local')
    writeProject(b, p, pb, 'local')
    for (const d of [a, b]) {
      const eq = readProject(d).equipment[id]
      expect(eq.name).toBe('Renommé par A')
      expect(eq.position).toEqual({ x: 999, y: 111 })
    }
  })

  it('relit seulement les éléments modifiés (les autres gardent leur identité)', () => {
    const p = buildSampleProject()
    const { a, b } = pair()
    writeProject(a, null, p)
    const prevB = readProject(b)
    let changes: ChangeSet | null = null
    const stop = observeChanges(b, (c) => { changes = c })
    const [id1, id2] = Object.keys(p.equipment)
    writeProject(a, p, ops.updateEquipment(p, id1, { name: 'X' }), 'local')
    stop()
    expect(changes).not.toBeNull()
    const next = readProject(b, prevB, changes!)
    expect(next.equipment[id1].name).toBe('X')
    expect(next.equipment[id2]).toBe(prevB.equipment[id2])
    expect(next.links).toBe(prevB.links)
  })

  it('n\'annule que ses propres modifications', () => {
    const p = buildSampleProject()
    const { a, b } = pair()
    writeProject(a, null, p)
    const um = createUndoManager(a, 'local')
    const [id1, id2] = Object.keys(p.equipment)
    const pa = ops.updateEquipment(p, id1, { name: 'A' })
    writeProject(a, p, pa, 'local')
    // B renomme un autre équipement
    writeProject(b, readProject(b), ops.updateEquipment(readProject(b), id2, { name: 'B' }), 'local')
    um.undo()
    const res = readProject(a)
    expect(res.equipment[id1].name).toBe(p.equipment[id1].name)
    expect(res.equipment[id2].name).toBe('B')
  })

  it('supprime un élément chez l\'autre participant', () => {
    const p = buildSampleProject()
    const { a, b } = pair()
    writeProject(a, null, p)
    const linkId = Object.keys(p.links)[0]
    writeProject(a, p, ops.removeElements(p, [], [linkId]), 'local')
    expect(readProject(b).links[linkId]).toBeUndefined()
  })
})
