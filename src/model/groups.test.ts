import { describe, expect, it } from 'vitest'
import { buildSampleProject } from '../library/sample'
import * as ops from './project'

describe('groupes et sous-schémas', () => {
  it('grouper crée un sous-schéma, expose ses ports d’interface et se dissout', async () => {
    const g = await import('./groups')
    let p = ops.normalizeProject(buildSampleProject())
    const root = p.sheets![0].id
    const eqs = Object.values(p.equipment)
    const inside = eqs.slice(0, 2).map((e) => e.id)
    const r = g.groupSelection(p, root, inside, 'Régie')
    expect(r.id).not.toBeNull()
    p = r.project
    const gid = r.id!
    expect(p.equipment[inside[0]].sheetId).toBe(gid)
    expect(g.placeOnView(p, gid, root)).toEqual({ kind: 'group', groupId: gid })
    expect(g.placeOnView(p, root, gid)).toBeNull()
    // Chaque port d'interface correspond à une liaison qui franchit la frontière
    const crossing = Object.values(p.links).filter((l) => {
      const a = inside.includes(l.source.equipmentId)
      const b = inside.includes(l.target.equipmentId)
      return a !== b
    })
    const iface = g.groupInterface(p, gid)
    expect(iface.length).toBe(new Set(crossing.map((l) => (inside.includes(l.source.equipmentId) ? `${l.source.equipmentId}:${l.source.portId}` : `${l.target.equipmentId}:${l.target.portId}`))).size)
    // Imbrication : un groupe dans le groupe
    const r2 = g.groupSelection(p, gid, [inside[0]], 'Sous-groupe')
    p = r2.project
    expect(g.ancestors(p, r2.id!)).toEqual([gid, root])
    expect(g.placeOnView(p, r2.id!, root)).toEqual({ kind: 'group', groupId: gid })
    expect(g.sheetTree(p).map((s) => s.id)).toEqual([root, gid, r2.id])
    // Dissolution : le contenu remonte et le sous-groupe est rattaché à la racine
    p = g.ungroup(p, gid)
    expect(p.equipment[inside[1]].sheetId).toBe(root)
    expect(p.sheets!.find((s) => s.id === r2.id)!.parentId).toBe(root)
  })
})
