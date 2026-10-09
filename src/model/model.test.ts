import { describe, expect, it } from 'vitest'
import { GENERIC_LIBRARY, LIBRARY_BY_ID } from '../library/generic'
import { buildSampleProject } from '../library/sample'
import { computeTotals, buildBom } from './bom'
import { connectorsMate } from './connectors'
import { formatCableLabel } from './numbering'
import * as ops from './project'
import { checkLink, checkProject, mutedIssues } from './rules'
import { equipmentInView } from './layers'
import { domainOf } from '../library/domains'
import { LIBRARY } from '../library'
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
  it('sortie phono vers entrée ligne, ligne vers entrée phono : avertissements', () => {
    const { p, a, b } = twoBoxes('gen-mic-dyn', 'gen-processor')
    const q = structuredClone(p)
    q.equipment[a].ports[0].level = 'phono'
    const r = ops.connect(q, { equipmentId: a, portId: 'p1' }, { equipmentId: b, portId: 'p1' })
    expect(checkLink(r.project, r.project.links[r.id!]).map((i) => i.code)).toContain('level-phono-to-line')
    q.equipment[a].ports[0].level = 'line+4'
    q.equipment[b].ports[0].level = 'phono'
    const s = ops.connect(q, { equipmentId: a, portId: 'p1' }, { equipmentId: b, portId: 'p1' })
    expect(checkLink(s.project, s.project.links[s.id!]).map((i) => i.code)).toContain('level-line-to-phono')
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
  it('bibliothèque filtrée sur le calque Audio : consoles gardées, projecteurs sans port audio écartés', () => {
    const onSound = LIBRARY.filter((tpl) => equipmentInView(tpl, 'sound'))
    expect(onSound.some((tpl) => tpl.family === 'console')).toBe(true)
    const lightOnly = LIBRARY.filter((tpl) => domainOf(tpl) === 'light' && !tpl.ports.some((p) => ['audioAnalog', 'audioDigital', 'audioIp', 'intercom', 'rf'].includes(p.signal)))
    expect(lightOnly.length).toBeGreaterThan(0)
    for (const tpl of lightOnly) expect(onSound).not.toContain(tpl)
    expect(LIBRARY.filter((tpl) => equipmentInView(tpl, 'all'))).toHaveLength(LIBRARY.length)
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

describe('fusion de deux versions', () => {
  it('ajoute, détecte les conflits et renumérote les doublons', async () => {
    const { mergeProjects } = await import('./merge')
    const base = ops.normalizeProject(buildSampleProject())
    // Notre version : on ajoute une liaison depuis un micro vers la console
    const eqs = Object.values(base.equipment)
    const moved = eqs[0]
    // Leur version : un bloc déplacé, un bloc ajouté et relié, une feuille ajoutée
    let theirs = ops.moveEquipment(base, moved.id, { x: moved.position.x + 100, y: moved.position.y })
    const added = ops.addEquipment(theirs, tpl('gen-mic-dyn'), { x: 0, y: 900 }, { zoneId: moved.zoneId })
    theirs = added.project
    const console_ = eqs.find((e) => e.ports.some((p) => p.direction === 'in' && p.signal === 'audioAnalog' && !Object.values(base.links).some((l) => l.target.equipmentId === e.id && l.target.portId === p.id)))!
    const freeIn = console_.ports.find((p) => p.direction === 'in' && p.signal === 'audioAnalog' && !Object.values(base.links).some((l) => l.target.equipmentId === console_.id && l.target.portId === p.id))!
    const c1 = ops.connect(theirs, { equipmentId: added.id, portId: 'p1' }, { equipmentId: console_.id, portId: freeIn.id })
    theirs = ops.addSheet(c1.project, 'Plateau').project
    // Notre version ajoute aussi une liaison dans la même série : même numéro de câble
    const ourMic = ops.addEquipment(base, tpl('gen-mic-dyn'), { x: 0, y: 1200 }, { zoneId: moved.zoneId })
    const c2 = ops.connect(ourMic.project, { equipmentId: ourMic.id, portId: 'p1' }, { equipmentId: console_.id, portId: freeIn.id })
    const ours = c2.project
    expect(ours.links[c2.id!].label).toBe(theirs.links[c1.id!].label)

    const r = mergeProjects(ours, theirs, 'ours')
    expect(r.report.added.equipment).toBe(1)
    expect(r.report.added.links).toBe(1)
    expect(r.report.added.sheets).toBe(1)
    expect(r.report.conflicts.map((c) => c.id)).toContain(moved.id)
    expect(r.report.renumbered).toBe(1)
    expect(r.project.equipment[moved.id].position).toEqual(moved.position)
    const labels = Object.values(r.project.links).map((l) => l.label)
    expect(new Set(labels).size).toBe(labels.length)

    const r2 = mergeProjects(ours, theirs, 'theirs')
    expect(r2.project.equipment[moved.id].position.x).toBe(moved.position.x + 100)
  })
})

describe('bibliothèque : menus', () => {
  it('range chaque modèle dans un menu, sans en perdre', async () => {
    const { LIBRARY } = await import('../library')
    const { groupByDomain, domainOf } = await import('../library/domains')
    const groups = groupByDomain(LIBRARY)
    const placed = groups.flatMap((g) => g.families.flatMap((f) => f.items))
    expect(placed).toHaveLength(LIBRARY.length)
    expect(groups.map((g) => g.domain)).toEqual(['sound', 'image', 'light', 'network', 'distribution', 'misc'])
    expect(domainOf(tpl('gen-mic-dyn'))).toBe('sound')
    expect(domainOf(tpl('gen-camera'))).toBe('image')
    expect(domainOf(tpl('gen-switch8'))).toBe('network')
    // Enregistreur vidéo de la famille « Enregistrement » : rangé en Image par sa fiche
    expect(domainOf(LIBRARY.find((t) => t.id === 'blackmagic-hyperdeck-studio-pro')!)).toBe('image')
  })
})

describe('routage des liaisons', () => {
  const crosses = (pts: { x: number; y: number }[], r: { x: number; y: number; w: number; h: number }) =>
    pts.slice(0, -1).some((a, i) => {
      const b = pts[i + 1]
      // Échantillonnage du segment
      for (let k = 0; k <= 20; k++) {
        const x = a.x + ((b.x - a.x) * k) / 20
        const y = a.y + ((b.y - a.y) * k) / 20
        if (x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h) return true
      }
      return false
    })

  it('contourne un bloc placé entre deux équipements, avec des segments orthogonaux', async () => {
    const { routeAll } = await import('./routing')
    const a = { x: 0, y: 0, w: 100, h: 100 }
    const mid = { x: 250, y: -20, w: 100, h: 140 }
    const b = { x: 500, y: 0, w: 100, h: 100 }
    const r = routeAll([a, mid, b], [{ id: 'l', source: { x: 100, y: 50, side: 'right' }, target: { x: 500, y: 50, side: 'left' } }])
    const pts = r.get('l')!
    expect(pts[0]).toEqual({ x: 100, y: 50 })
    expect(pts[pts.length - 1]).toEqual({ x: 500, y: 50 })
    expect(crosses(pts, mid)).toBe(false)
    for (let i = 0; i < pts.length - 1; i++) expect(pts[i].x === pts[i + 1].x || pts[i].y === pts[i + 1].y).toBe(true)
  })

  it('va droit quand rien ne gêne', async () => {
    const { routeAll } = await import('./routing')
    const r = routeAll([{ x: 0, y: 0, w: 100, h: 100 }, { x: 300, y: 0, w: 100, h: 100 }], [
      { id: 'l', source: { x: 100, y: 40, side: 'right' }, target: { x: 300, y: 40, side: 'left' } },
    ])
    expect(r.get('l')).toEqual([{ x: 100, y: 40 }, { x: 300, y: 40 }])
  })

  it('relie des ports en haut et en bas (bloc pivoté) par des amorces verticales', async () => {
    const { routeAll } = await import('./routing')
    const a = { x: 0, y: 0, w: 100, h: 60 }
    const b = { x: 300, y: 200, w: 100, h: 60 }
    const r = routeAll([a, b], [{ id: 'v', source: { x: 50, y: 60, side: 'bottom' }, target: { x: 350, y: 200, side: 'top' } }])
    const pts = r.get('v')!
    expect(pts[0]).toEqual({ x: 50, y: 60 })
    expect(pts[pts.length - 1]).toEqual({ x: 350, y: 200 })
    // Sortie vers le bas, arrivée par le haut
    expect(pts[1].x).toBe(50)
    expect(pts[1].y).toBeGreaterThan(60)
    expect(pts[pts.length - 2].x).toBe(350)
    expect(pts[pts.length - 2].y).toBeLessThan(200)
    expect(crosses(pts, a) || crosses(pts, b)).toBe(false)
    for (let i = 0; i < pts.length - 1; i++) expect(pts[i].x === pts[i + 1].x || pts[i].y === pts[i + 1].y).toBe(true)
  })

  it('contourne le bloc de départ quand la sortie est du mauvais côté (bloc retourné)', async () => {
    const { routeAll } = await import('./routing')
    const a = { x: 0, y: 0, w: 100, h: 60 }
    const b = { x: 300, y: 0, w: 100, h: 60 }
    // Sortie à gauche du bloc A alors que la cible est à droite : le tracé doit faire le tour
    const r = routeAll([a, b], [{ id: 'f', source: { x: 0, y: 30, side: 'left' }, target: { x: 300, y: 30, side: 'left' } }])
    const pts = r.get('f')!
    expect(pts[1].x).toBeLessThan(0)
    expect(crosses(pts, { x: a.x + 1, y: a.y + 1, w: a.w - 2, h: a.h - 2 })).toBe(false)
  })

  it('place les étiquettes sans chevauchement', async () => {
    const { placeLabels } = await import('./routing')
    const routes = new Map([
      ['a', [{ x: 0, y: 0 }, { x: 300, y: 0 }]],
      ['b', [{ x: 0, y: 8 }, { x: 300, y: 8 }]],
    ])
    const size = { w: 80, h: 16 }
    const at = placeLabels(routes, new Map([['a', size], ['b', size]]), [])
    const a = at.get('a')!
    const b = at.get('b')!
    const overlap = Math.abs(a.x - b.x) < size.w && Math.abs(a.y - b.y) < size.h
    expect(overlap).toBe(false)
  })

  it('écarte deux tronçons verticaux superposés', async () => {
    const { nudge } = await import('./routing')
    const routes = [
      [{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 50, y: 100 }, { x: 100, y: 100 }],
      [{ x: 0, y: 20 }, { x: 50, y: 20 }, { x: 50, y: 120 }, { x: 100, y: 120 }],
    ]
    const out = nudge(routes, 8, 12)
    expect(out[0][1].x).not.toBe(out[1][1].x)
    expect(Math.abs(out[0][1].x - out[1][1].x)).toBe(8)
    // Les amorces gardent la hauteur des ports
    expect(out[0][0].y).toBe(0)
    expect(out[1][3].y).toBe(120)
  })
})

describe('calques et orientation', () => {
  it('range une caméra dans les calques Image et Audio, et rappelle ses entrées audio non reliées', async () => {
    const { LIBRARY } = await import('../library')
    const { crossLayerHints, equipmentInView, hintKey, layersOf, portInView } = await import('./layers')
    const cam = LIBRARY.find((t) => t.id === 'panasonic-aw-ue150')!
    let p = ops.createProject('t')
    const r = ops.addEquipment(p, cam, { x: 0, y: 0 })
    p = r.project
    const eq = p.equipment[r.id]
    const layers = layersOf(eq)
    expect(layers.has('image')).toBe(true)
    expect(layers.has('sound')).toBe(true)
    expect(equipmentInView(eq, 'sound')).toBe(true)
    expect(equipmentInView(eq, 'light')).toBe(false)
    const mic = eq.ports.find((x) => x.signal === 'audioAnalog')!
    const hdmi = eq.ports.find((x) => x.id === 'hdmi')!
    expect(portInView(mic, 'sound')).toBe(true)
    expect(portInView(hdmi, 'sound')).toBe(false)
    const hints = crossLayerHints(p)
    expect(hints).toHaveLength(1)
    expect(hints[0]).toMatchObject({ equipmentId: r.id, layer: 'sound', home: 'image', dismissed: false })
    // Ignorer le rappel : il reste listé, marqué ignoré
    p = ops.setHintDismissed(p, r.id, hintKey('sound'), true)
    expect(crossLayerHints(p)[0].dismissed).toBe(true)
    p = ops.setHintDismissed(p, r.id, hintKey('sound'), false)
    expect(crossLayerHints(p)[0].dismissed).toBe(false)
  })

  it('le rappel disparaît une fois les ports reliés', async () => {
    const { LIBRARY } = await import('../library')
    const { crossLayerHints } = await import('./layers')
    let p = ops.createProject('t')
    const cam = ops.addEquipment(p, LIBRARY.find((t) => t.id === 'panasonic-aw-ue150')!, { x: 0, y: 0 })
    p = cam.project
    const sm58 = ops.addEquipment(p, LIBRARY.find((t) => t.id === 'shure-sm58')!, { x: -300, y: 0 })
    p = sm58.project
    const micPort = p.equipment[cam.id].ports.find((x) => x.signal === 'audioAnalog')!
    const res = ops.connect(p, { equipmentId: sm58.id, portId: p.equipment[sm58.id].ports[0].id }, { equipmentId: cam.id, portId: micPort.id })
    expect(crossLayerHints(res.project)).toHaveLength(0)
  })

  it('pivote par quarts de tour dans les deux sens', () => {
    let p = ops.createProject('t')
    const r = ops.addEquipment(p, LIBRARY_BY_ID.get('gen-mic-dyn')!, { x: 0, y: 0 })
    p = ops.rotateEquipment(r.project, [r.id], 1)
    expect(p.equipment[r.id].rotation).toBe(90)
    p = ops.rotateEquipment(p, [r.id], -1)
    p = ops.rotateEquipment(p, [r.id], -1)
    expect(p.equipment[r.id].rotation).toBe(270)
  })
})

describe('zones tracées et regroupement en multipaire', () => {
  it('un cadre lié donne sa zone aux équipements posés dedans et la reprend en sortant', async () => {
    const z = await import('./zones')
    let p = ops.normalizeProject(buildSampleProject())
    const eq = Object.values(p.equipment)[0]
    const sheetId = eq.sheetId ?? ops.DEFAULT_SHEET_ID
    const a = ops.addAnnotation(p, { kind: 'frame', sheetId, position: { x: eq.position.x - 10, y: eq.position.y - 10 }, size: { w: 300, h: 200 }, text: 'Scène' })
    const r = z.zoneFromFrame(a.project, a.id)
    p = r.project
    expect(p.zones.find((x) => x.id === r.id)?.code).toBe('SCE')
    expect(p.equipment[eq.id].zoneId).toBe(r.id)
    p = z.applyFrameZones(ops.moveEquipment(p, eq.id, { x: eq.position.x + 2000, y: eq.position.y }))
    expect(p.equipment[eq.id].zoneId).toBeUndefined()
    expect(z.applyFrameZones(p)).toBe(p)
  })
  it('zone posée depuis la barre : nommée, son code suit le nom, effacée avec son cadre', async () => {
    const z = await import('./zones')
    const p0 = ops.normalizeProject(buildSampleProject())
    const eq = Object.values(p0.equipment)[0]
    const r = z.addZoneFrame(p0, { sheetId: eq.sheetId ?? ops.DEFAULT_SHEET_ID, position: { x: eq.position.x - 10, y: eq.position.y - 10 }, size: { w: 300, h: 200 } })
    let p = r.project
    expect(p.zones.find((x) => x.id === r.zoneId)?.code).toMatch(/^Z\d+$/)
    expect(p.equipment[eq.id].zoneId).toBe(r.zoneId)
    p = z.updateFrame(p, r.frameId, { text: 'Régie son' })
    expect(p.zones.find((x) => x.id === r.zoneId)).toMatchObject({ name: 'Régie son', code: 'REG' })
    p = z.syncFrameNames(ops.updateZone(p, r.zoneId, { name: 'Régie FOH' }), r.zoneId)
    expect(p.annotations?.[r.frameId].text).toBe('Régie FOH')
    const after = z.removeOrphanZones(ops.removeAnnotations(p, [r.frameId]), p)
    expect(after.zones.some((x) => x.id === r.zoneId)).toBe(false)
    expect(after.equipment[eq.id].zoneId).toBeUndefined()
  })
  it('regroupe des liaisons sur les premières paires libres d\'un nouveau multipaire', () => {
    const p0 = buildSampleProject()
    const ids = Object.keys(p0.links).slice(0, 10)
    const r = ops.assignToMulticore(p0, ids, null)
    const mc = r.project.multicores![r.id!]
    expect(mc.pairs).toBe(12)
    expect(new Set(ids.map((id) => r.project.links[id].pair)).size).toBe(10)
    const r2 = ops.assignToMulticore(r.project, Object.keys(p0.links).slice(10), r.id)
    expect(r2.project.multicores![r.id!].pairs).toBeGreaterThanOrEqual(Object.keys(p0.links).length)
  })
})


describe('voies ordonnées dans les couloirs', () => {
  /** Croisements entre segments verticaux et horizontaux de tracés différents */
  const crossings = (routes: { x: number; y: number }[][]) => {
    let n = 0
    const segs = routes.map((r) => r.slice(1).map((b, i) => [r[i], b] as const))
    for (let i = 0; i < segs.length; i++) for (let j = 0; j < segs.length; j++) {
      if (i === j) continue
      for (const [a, b] of segs[i]) for (const [c, d] of segs[j]) {
        if (a.x !== b.x || c.y !== d.y) continue
        const [y0, y1] = [Math.min(a.y, b.y), Math.max(a.y, b.y)]
        const [x0, x1] = [Math.min(c.x, d.x), Math.max(c.x, d.x)]
        if (a.x > x0 && a.x < x1 && c.y > y0 && c.y < y1) n++
      }
    }
    return n
  }
  it('sept micros en colonne vers sept entrées : aucune liaison ne se croise, et un coude manuel est respecté', async () => {
    const { routeAll } = await import('./routing')
    const obstacles = [...Array.from({ length: 7 }, (_, k) => ({ x: 100 + k * 25, y: k * 70, w: 140, h: 50 })), { x: 700, y: 0, w: 220, h: 420 }]
    const requests = Array.from({ length: 7 }, (_, k) => ({
      id: `l${k}`,
      source: { x: 240 + k * 25, y: k * 70 + 40, side: 'right' as const },
      target: { x: 700, y: 40 + k * 18, side: 'left' as const },
    }))
    const routes = routeAll(obstacles, requests)
    expect(crossings([...routes.values()])).toBe(0)
    const bent = routeAll(obstacles, [{ ...requests[3], bendX: 500 }])
    expect(bent.get('l3')!.some((p) => p.x === 500)).toBe(true)
  })
})

describe('liaisons en série', () => {
  it('relie dix micros dans l\'ordre du schéma aux entrées libres, à partir d\'une entrée choisie, dans un multipaire', async () => {
    const s = await import('./series')
    const { LIBRARY } = await import('../library')
    const mic = LIBRARY.find((t) => t.family === 'capture' && t.ports.filter((p) => p.direction === 'out').length === 1 && t.ports[0].signal === 'audioAnalog')!
    const desk = LIBRARY.find((t) => t.family === 'console' && t.ports.filter((p) => p.direction === 'in' && p.signal === 'audioAnalog').length >= 16)!
    let p = ops.createProject('t')
    const d = ops.addEquipment(p, desk, { x: 800, y: 0 })
    p = d.project
    const mics: string[] = []
    // Ajoutés dans le désordre : l'ordre retenu est celui du schéma (de haut en bas)
    for (const k of [3, 0, 9, 1, 2, 8, 4, 7, 5, 6]) {
      const r = ops.addEquipment(p, mic, { x: 0, y: k * 80 })
      p = r.project
      mics[k] = r.id
    }
    const inputs = s.freeInputs(p, d.id, 'audioAnalog')
    const plan = s.planSeries(p, [...mics, d.id], d.id, { startPortId: inputs[2].id })
    expect(plan.pairs).toHaveLength(10)
    expect(plan.pairs.map((x) => x.source.equipmentId)).toEqual(mics)
    expect(plan.pairs[0].target.portId).toBe(inputs[2].id)
    const r = s.applySeries(p, plan, null)
    expect(r.linkIds).toHaveLength(10)
    expect(r.project.multicores![r.multicoreId!].pairs).toBe(12)
    // Une seconde fois : les sorties sont déjà reliées, rien à faire
    expect(s.planSeries(r.project, mics, d.id).pairs).toHaveLength(0)
  })
})

describe('contrôles désactivés pour le schéma', () => {
  it('une règle désactivée ne signale plus, sur toutes les liaisons, et reste listée pour être réactivée', () => {
    let p = buildSampleProject()
    const before = checkProject(p).filter((i) => i.code === 'level-mic-to-line')
    expect(before.length).toBeGreaterThan(0)
    p = ops.updateSettings(p, { mutedRules: ['level-mic-to-line'] })
    expect(checkProject(p).some((i) => i.code === 'level-mic-to-line')).toBe(false)
    expect(mutedIssues(p).filter((i) => i.scope === 'project' && i.code === 'level-mic-to-line')).toHaveLength(before.length)
    p = ops.updateSettings(p, { mutedRules: [] })
    expect(checkProject(p).filter((i) => i.code === 'level-mic-to-line')).toHaveLength(before.length)
  })
})
