import { describe, expect, it } from 'vitest'
import { GENERIC_LIBRARY, LIBRARY_BY_ID } from '../library/generic'
import { buildSampleProject } from '../library/sample'
import { computeTotals, buildBom } from './bom'
import { connectorsMate } from './connectors'
import { formatCableLabel } from './numbering'
import * as ops from './project'
import { checkLink, checkProject } from './rules'
import { familiesCompatible } from './signals'
import type { Project } from './types'

const tpl = (id: string) => {
  const t = LIBRARY_BY_ID.get(id)
  if (!t) throw new Error(id)
  return t
}

/** Projet minimal avec deux équipements, renvoie aussi leurs identifiants. */
function twoBoxes(a: string, b: string): { p: Project; a: string; b: string } {
  let p = ops.createProject('test')
  const ra = ops.addEquipment(p, tpl(a), { x: 0, y: 0 }, { zoneId: 'z-scn' })
  p = ra.project
  const rb = ops.addEquipment(p, tpl(b), { x: 300, y: 0 })
  return { p: rb.project, a: ra.id, b: rb.id }
}

describe('signaux et connecteurs', () => {
  it('un flux audio sur IP passe sur un port réseau', () => {
    expect(familiesCompatible('audioIp', 'network')).toBe(true)
    expect(familiesCompatible('network', 'videoIp')).toBe(true)
    expect(familiesCompatible('video', 'audioAnalog')).toBe(false)
    expect(familiesCompatible('audioIp', 'videoIp')).toBe(false)
  })
  it('un RJ45 entre dans une embase etherCON, pas un XLR dans un jack', () => {
    expect(connectorsMate('rj45', 'ethercon')).toBe(true)
    expect(connectorsMate('xlr3', 'jack-trs')).toBe(false)
  })
})

describe('numérotation des câbles', () => {
  it('applique le format configurable', () => {
    expect(formatCableLabel('{ZONE}-{TYPE}-{NUM:000}', { zone: 'FOH', signal: 'audioAnalog', num: 12 })).toBe('FOH-AUD-012')
    expect(formatCableLabel('C{NUM}', { zone: 'X', signal: 'video', num: 7 })).toBe('C7')
  })
  it('numérote par série zone + type et renumérote sans trou', () => {
    const { p, a, b } = twoBoxes('gen-mic-dyn', 'gen-console')
    const r1 = ops.connect(p, { equipmentId: a, portId: 'p1' }, { equipmentId: b, portId: 'p1' })
    expect(r1.project.links[r1.id!].label).toBe('SCN-AUD-001')
    const r2 = ops.connect(r1.project, { equipmentId: a, portId: 'p1' }, { equipmentId: b, portId: 'p2' })
    expect(r2.project.links[r2.id!].label).toBe('SCN-AUD-002')
    const removed = ops.removeElements(r2.project, [], [r1.id!])
    const renum = ops.renumberLinks(removed)
    expect(renum.links[r2.id!].label).toBe('SCN-AUD-001')
  })
})

describe('liaisons', () => {
  it('rétablit le sens quand on tire depuis une entrée', () => {
    const { p, a, b } = twoBoxes('gen-mic-dyn', 'gen-console')
    const r = ops.connect(p, { equipmentId: b, portId: 'p1' }, { equipmentId: a, portId: 'p1' })
    expect(r.project.links[r.id!].source.equipmentId).toBe(a)
  })
  it('refuse un doublon exact', () => {
    const { p, a, b } = twoBoxes('gen-mic-dyn', 'gen-console')
    const r1 = ops.connect(p, { equipmentId: a, portId: 'p1' }, { equipmentId: b, portId: 'p1' })
    const r2 = ops.connect(r1.project, { equipmentId: a, portId: 'p1' }, { equipmentId: b, portId: 'p1' })
    expect(r2.id).toBeNull()
  })
  it('supprimer un équipement supprime ses liaisons', () => {
    const { p, a, b } = twoBoxes('gen-mic-dyn', 'gen-console')
    const r = ops.connect(p, { equipmentId: a, portId: 'p1' }, { equipmentId: b, portId: 'p1' })
    expect(Object.keys(ops.removeElements(r.project, [a], []).links)).toHaveLength(0)
  })
})

describe('règles de compatibilité', () => {
  it('micro vers entrée micro : aucune alerte', () => {
    const { p, a, b } = twoBoxes('gen-mic-dyn', 'gen-console')
    const r = ops.connect(p, { equipmentId: a, portId: 'p1' }, { equipmentId: b, portId: 'p1' })
    expect(checkLink(r.project, r.project.links[r.id!])).toEqual([])
  })
  it('micro vers entrée ligne : avertissement de niveau', () => {
    const { p, a, b } = twoBoxes('gen-mic-dyn', 'gen-processor')
    const r = ops.connect(p, { equipmentId: a, portId: 'p1' }, { equipmentId: b, portId: 'p1' })
    const codes = checkLink(r.project, r.project.links[r.id!]).map((i) => i.code)
    expect(codes).toContain('level-mic-to-line')
  })
  it('SDI vers entrée XLR : erreur de signal', () => {
    const { p, a, b } = twoBoxes('gen-camera', 'gen-console')
    const r = ops.connect(p, { equipmentId: a, portId: 'p1' }, { equipmentId: b, portId: 'p1' })
    const issues = checkLink(r.project, r.project.links[r.id!])
    expect(issues.find((i) => i.code === 'signal-mismatch')?.severity).toBe('error')
    expect(issues.map((i) => i.code)).toContain('adapter-needed')
  })
  it('sortie HP vers entrée ligne : erreur', () => {
    const { p, a, b } = twoBoxes('gen-amp4', 'gen-processor')
    const r = ops.connect(p, { equipmentId: a, portId: 'p5' }, { equipmentId: b, portId: 'p1' })
    expect(checkLink(r.project, r.project.links[r.id!]).map((i) => i.code)).toContain('level-speaker-to-line')
  })
  it('deux sources sur une entrée : erreur', () => {
    const boxes = twoBoxes('gen-mic-dyn', 'gen-console')
    const { a, b } = boxes
    let p = boxes.p
    const r0 = ops.addEquipment(p, tpl('gen-mic-dyn'), { x: 0, y: 100 })
    p = r0.project
    p = ops.connect(p, { equipmentId: a, portId: 'p1' }, { equipmentId: b, portId: 'p1' }).project
    const r = ops.connect(p, { equipmentId: r0.id, portId: 'p1' }, { equipmentId: b, portId: 'p1' })
    expect(checkLink(r.project, r.project.links[r.id!]).map((i) => i.code)).toContain('input-busy')
  })
  it('une alerte ignorée disparaît', () => {
    const { p, a, b } = twoBoxes('gen-mic-dyn', 'gen-processor')
    const r = ops.connect(p, { equipmentId: a, portId: 'p1' }, { equipmentId: b, portId: 'p1' })
    const ignored = ops.updateLink(r.project, r.id!, { ignoredRules: ['level-mic-to-line'] })
    expect(checkLink(ignored, ignored.links[r.id!])).toEqual([])
  })
})

describe('projet d\'exemple et bibliothèque', () => {
  it('chaque port de la bibliothèque a un identifiant unique dans son modèle', () => {
    for (const t of GENERIC_LIBRARY) expect(new Set(t.ports.map((p) => p.id)).size).toBe(t.ports.length)
  })
  it('l\'exemple contient les alertes volontaires : micro vers ligne et sortie partagée', () => {
    const p = buildSampleProject()
    const issues = checkProject(p)
    expect(issues.map((i) => i.code)).toEqual(['level-mic-to-line', 'output-split', 'output-split'])
    expect(Object.keys(p.links)).toHaveLength(14)
  })
})

describe('bilans', () => {
  it('calcule le courant I = P / U', () => {
    const boxes = twoBoxes('gen-console', 'gen-amp4')
    const p = ops.updateEquipment(boxes.p, boxes.a, { powerW: 460 })
    const tot = computeTotals(p)
    expect(tot.powerW).toBe(460)
    expect(tot.currentA).toBeCloseTo(2, 5)
    expect(tot.missingPower).toBe(1)
  })
  it('regroupe la nomenclature par modèle', () => {
    let { p } = twoBoxes('gen-mic-dyn', 'gen-mic-dyn')
    p = ops.addEquipment(p, tpl('gen-console'), { x: 0, y: 0 }).project
    const bom = buildBom(p)
    expect(bom.find((l) => l.model === 'Micro dynamique')?.quantity).toBe(2)
  })
})
