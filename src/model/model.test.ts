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
    expect(issues.map((i) => i.code).sort()).toEqual(['level-mic-to-line', 'output-split', 'output-split', 'phantom-unknown'])
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

describe('fiches constructeur', () => {
  it('toutes les fiches de src/library/devices sont valides', async () => {
    const { readdirSync, readFileSync } = await import('node:fs')
    const { validateTemplate } = await import('./validateTemplate')
    const dir = new URL('../library/devices/', import.meta.url)
    for (const f of readdirSync(dir).filter((n) => n.endsWith('.json'))) {
      expect(validateTemplate(JSON.parse(readFileSync(new URL(f, dir), 'utf8'))), f).toEqual([])
    }
  })
  it('refuse une fiche vérifiée sans source', async () => {
    const { validateTemplate } = await import('./validateTemplate')
    // Données de test fictives, pas un produit réel
    const errors = validateTemplate({
      id: 'test-x', family: 'console', manufacturer: 'Test', model: 'X', pictogram: 'console', status: 'verified',
      ports: [{ id: 'p1', name: 'In', direction: 'in', signal: 'audioAnalog', connector: 'xlr3' }],
    })
    expect(errors.join()).toContain('source')
  })
})

describe('éditeur de blocs et zones', () => {
  it('ajoute un port avec un identifiant libre', () => {
    const { p, b } = twoBoxes('gen-mic-dyn', 'gen-console')
    const n = p.equipment[b].ports.length
    const r = ops.addPort(p, b, { name: 'Aux', direction: 'in', signal: 'audioAnalog', connector: 'jack-trs', level: 'line+4' })
    expect(r.project.equipment[b].ports).toHaveLength(n + 1)
    expect(r.id).toBe(`p${n + 1}`)
  })
  it('supprimer un port supprime ses liaisons', () => {
    const { p, a, b } = twoBoxes('gen-mic-dyn', 'gen-console')
    const r = ops.connect(p, { equipmentId: a, portId: 'p1' }, { equipmentId: b, portId: 'p1' })
    const after = ops.removePort(r.project, b, 'p1')
    expect(Object.keys(after.links)).toHaveLength(0)
    expect(after.equipment[b].ports.find((x) => x.id === 'p1')).toBeUndefined()
  })
  it('changer le code d\'une zone renomme les câbles', () => {
    const { p, a, b } = twoBoxes('gen-mic-dyn', 'gen-console')
    const r = ops.connect(p, { equipmentId: a, portId: 'p1' }, { equipmentId: b, portId: 'p1' })
    const after = ops.updateZone(r.project, 'z-scn', { code: 'stage' })
    expect(after.links[r.id!].label).toBe('STAGE-AUD-001')
  })
  it('supprimer une zone renvoie ses câbles sur le code par défaut', () => {
    const { p, a, b } = twoBoxes('gen-mic-dyn', 'gen-console')
    const r = ops.connect(p, { equipmentId: a, portId: 'p1' }, { equipmentId: b, portId: 'p1' })
    const after = ops.removeZone(r.project, 'z-scn')
    expect(after.equipment[a].zoneId).toBeUndefined()
    expect(after.links[r.id!].label).toBe('GEN-AUD-001')
  })
  it('un modèle perso issu d\'un équipement est une fiche valide', async () => {
    const { validateTemplate } = await import('./validateTemplate')
    const { p, b } = twoBoxes('gen-mic-dyn', 'gen-console')
    const tpl = ops.templateFromEquipment(p.equipment[b])
    expect(tpl.status).toBe('user')
    expect(validateTemplate(tpl)).toEqual([])
  })
})

describe('traductions', () => {
  it('le français et l\'anglais ont exactement les mêmes clés', async () => {
    const fr = (await import('../i18n/fr.json')).default
    const en = (await import('../i18n/en.json')).default
    const keys = (o: object, p = ''): string[] =>
      Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' ? keys(v, `${p}${k}.`) : [`${p}${k}`]))
    expect(keys(en).sort()).toEqual(keys(fr).sort())
  })
})

describe('alimentation fantôme', () => {
  it('micro statique sur entrée console générique (fantôme fourni) : aucune alerte fantôme', () => {
    const { p, a, b } = twoBoxes('gen-mic-cond', 'gen-console')
    const r = ops.connect(p, { equipmentId: a, portId: 'p1' }, { equipmentId: b, portId: 'p1' })
    expect(checkLink(r.project, r.project.links[r.id!]).map((i) => i.code)).not.toContain('phantom-missing')
  })
  it('micro statique sur une entrée sans fantôme : avertissement', () => {
    const boxes = twoBoxes('gen-mic-cond', 'gen-console')
    const { a, b } = boxes
    const p = ops.updatePort(boxes.p, b, 'p1', { phantom: 'none' })
    const r = ops.connect(p, { equipmentId: a, portId: 'p1' }, { equipmentId: b, portId: 'p1' })
    expect(checkLink(r.project, r.project.links[r.id!]).map((i) => i.code)).toContain('phantom-missing')
  })
})

describe('feuilles, annotations et modèles de projets', () => {
  it('un projet ancien sans feuille est complété à l\'ouverture', () => {
    const { p, a } = twoBoxes('gen-mic-dyn', 'gen-console')
    const old = { ...p, sheets: undefined, annotations: undefined, equipment: { ...p.equipment, [a]: { ...p.equipment[a], sheetId: undefined } } }
    const n = ops.normalizeProject(old)
    expect(n.sheets).toHaveLength(1)
    expect(n.equipment[a].sheetId).toBe(n.sheets![0].id)
  })
  it('supprimer une feuille supprime ses équipements et ses annotations, jamais la dernière', () => {
    let p = ops.createProject('t')
    const s2 = ops.addSheet(p, 'Régie')
    p = s2.project
    const eq = ops.addEquipment(p, tpl('gen-console'), { x: 0, y: 0 }, { sheetId: s2.id })
    p = ops.addAnnotation(eq.project, { kind: 'note', sheetId: s2.id, position: { x: 0, y: 0 }, size: { w: 10, h: 10 }, text: 'x' }).project
    p = ops.removeSheet(p, s2.id)
    expect(Object.keys(p.equipment)).toHaveLength(0)
    expect(Object.keys(p.annotations ?? {})).toHaveLength(0)
    expect(ops.removeSheet(p, p.sheets![0].id).sheets).toHaveLength(1)
  })
  it('les modèles de projets se construisent sans erreur de compatibilité', async () => {
    const { buildTemplate } = await import('../library/templates')
    for (const id of ['blank', 'concert', 'tvStudio', 'conference'] as const) {
      const p = buildTemplate(id, 'Nouveau')
      expect(checkProject(p).filter((i) => i.severity === 'error'), id).toEqual([])
    }
    const tv = buildTemplate('tvStudio', 'x')
    expect(tv.sheets).toHaveLength(2)
    expect(Object.keys(tv.links).length).toBeGreaterThan(8)
  })
})

describe('connecteurs combo', () => {
  it('une embase combo accepte un XLR et un jack', () => {
    expect(connectorsMate('xlr3', 'combo')).toBe(true)
    expect(connectorsMate('combo', 'jack-trs')).toBe(true)
    expect(connectorsMate('combo', 'bnc')).toBe(false)
  })
})

describe('catalogue de câbles', () => {
  it('le CL 100 relie un jack 3,5 à une XLR, dans les deux sens', async () => {
    const { cableFits, getCable, cablesFor } = await import('./cables')
    const cl100 = getCable('cl100')!
    expect(cableFits(cl100, 'minijack', 'xlr3')).toBe(true)
    expect(cableFits(cl100, 'xlr3', 'minijack')).toBe(true)
    expect(cableFits(cl100, 'xlr3', 'xlr3')).toBe(false)
    expect(cablesFor('xlr3', 'xlr3').map((c) => c.id)).toContain('mod-xlr3')
  })
  it('un câble adaptateur choisi lève l’alerte, un câble inadapté en crée une autre', async () => {
    const { LIBRARY } = await import('../library')
    const ek = LIBRARY.find((t) => t.id === 'sennheiser-ek-100-g4')!
    let p = ops.createProject('test')
    const ra = ops.addEquipment(p, ek, { x: 0, y: 0 })
    const rb = ops.addEquipment(ra.project, tpl('gen-console'), { x: 300, y: 0 })
    const r = ops.connect(rb.project, { equipmentId: ra.id, portId: 'out' }, { equipmentId: rb.id, portId: 'p1' })
    p = r.project
    const codes = () => checkLink(p, p.links[r.id!]).map((i) => i.code)
    expect(codes()).toContain('adapter-needed')
    p = ops.updateLink(p, r.id!, { cableTypeId: 'cl100' })
    expect(codes()).not.toContain('adapter-needed')
    p = ops.updateLink(p, r.id!, { cableTypeId: 'hdmi' })
    expect(codes()).toContain('cable-mismatch')
  })
  it('la liste des câbles regroupe par type et par longueur', async () => {
    const { buildCableBom } = await import('./cables')
    const p = buildSampleProject()
    const ids = Object.keys(p.links)
    let q = p
    for (const id of ids.slice(0, 2)) q = ops.updateLink(q, id, { cableTypeId: 'mod-xlr3', lengthM: 10 })
    const bom = buildCableBom(q, () => ['xlr3', 'xlr3'])
    const line = bom.find((l) => l.cableId === 'mod-xlr3' && l.lengthM === 10)
    expect(line?.quantity).toBe(2)
    expect(bom.reduce((s, l) => s + l.quantity, 0)).toBe(ids.length)
  })
})

describe('multipaires', () => {
  const sample = () => {
    let p = buildSampleProject()
    const r = ops.addMulticore(p, { pairs: 2 })
    p = r.project
    return { p, mc: r.id, links: Object.keys(p.links) }
  }
  it('crée MP-01 puis MP-02 et trouve la première paire libre', () => {
    const s0 = sample()
    const { mc, links } = s0
    let p = s0.p
    expect(p.multicores?.[mc].label).toBe('MP-01')
    expect(ops.addMulticore(p).project.multicores && Object.values(ops.addMulticore(p).project.multicores!).map((m) => m.label)).toContain('MP-02')
    p = ops.updateLink(p, links[0], { multicoreId: mc, pair: 1 })
    expect(ops.firstFreePair(p, mc)).toBe(2)
    p = ops.updateLink(p, links[1], { multicoreId: mc, pair: 2 })
    expect(ops.firstFreePair(p, mc)).toBeUndefined()
  })
  it('signale une paire occupée deux fois, hors capacité ou manquante', () => {
    const s0 = sample()
    const { mc, links } = s0
    let p = s0.p
    p = ops.updateLink(p, links[0], { multicoreId: mc, pair: 1 })
    p = ops.updateLink(p, links[1], { multicoreId: mc, pair: 1 })
    expect(checkLink(p, p.links[links[1]]).map((i) => i.code)).toContain('pair-busy')
    p = ops.updateLink(p, links[1], { pair: 5 })
    expect(checkLink(p, p.links[links[1]]).map((i) => i.code)).toContain('pair-range')
    p = ops.updateLink(p, links[1], { pair: undefined })
    expect(checkLink(p, p.links[links[1]]).map((i) => i.code)).toContain('pair-missing')
  })
  it('la suppression libère les liaisons et le multipaire compte dans les câbles', async () => {
    const { buildCableBom } = await import('./cables')
    const s0 = sample()
    const { mc, links } = s0
    let p = s0.p
    p = ops.updateMulticore(p, mc, { lengthM: 30 })
    p = ops.updateLink(p, links[0], { multicoreId: mc, pair: 1 })
    const bom = buildCableBom(p, () => ['xlr3', 'xlr3'])
    expect(bom.find((l) => l.multicorePairs === 2)?.lengthM).toBe(30)
    expect(bom.reduce((s, l) => s + l.quantity, 0)).toBe(links.length) // 1 multipaire + (n - 1) câbles
    p = ops.removeMulticore(p, mc)
    expect(p.links[links[0]].multicoreId).toBeUndefined()
    expect(p.links[links[0]].pair).toBeUndefined()
  })
})

describe('codes de type personnalisés', () => {
  it('un code personnalisé remplace AUD et renumérote les étiquettes', () => {
    expect(formatCableLabel('{TYPE}-{NUM:00}', { zone: 'X', signal: 'audioAnalog', num: 3 }, { audioAnalog: 'MOD' })).toBe('MOD-03')
    const p = ops.updateSettings(buildSampleProject(), { typeCodes: { audioAnalog: 'MOD' } })
    const labels = Object.values(p.links).map((l) => l.label)
    expect(labels.some((l) => l.includes('-MOD-'))).toBe(true)
    expect(labels.some((l) => l.includes('-AUD-'))).toBe(false)
  })
})

describe('flux réseau', () => {
  it('alerte quand une liaison transporte plus de canaux que la capacité déclarée', () => {
    let p = buildSampleProject()
    const l = Object.values(p.links)[0]
    p = ops.updatePort(p, l.source.equipmentId, l.source.portId, { channels: 64 })
    p = ops.updateLink(p, l.id, { channels: 64 })
    expect(checkLink(p, p.links[l.id]).map((i) => i.code)).not.toContain('channels-over')
    p = ops.updateLink(p, l.id, { channels: 65 })
    expect(checkLink(p, p.links[l.id]).map((i) => i.code)).toContain('channels-over')
  })
})
