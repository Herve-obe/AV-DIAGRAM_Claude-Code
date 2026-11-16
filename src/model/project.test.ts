import { describe, expect, it } from 'vitest'
import { buildSampleProject } from '../library/sample'
import { DEFAULT_EXPORT } from './exportOptions'
import * as ops from './project'
import { checkProject } from './rules'
import type { Project } from './types'
import { tpl, twoBoxes } from './testFixtures'

describe('validation du format .avd', () => {
  const p = buildSampleProject()
  const [id, eq] = Object.entries(p.equipment)[0]
  const [linkId, link] = Object.entries(p.links)[0]

  it('accepte un projet complet après un aller-retour JSON', () => {
    const complete: Project = { ...p,
      annotations: { note: { id: 'note', kind: 'note', sheetId: p.sheets![0].id, text: 'Régie', position: { x: 0, y: 0 }, size: { w: 100, h: 50 } } },
      racks: { baie: { id: 'baie', name: 'Baie', heightU: 42 } },
      multicores: { mp: { id: 'mp', label: 'MP-01', pairs: 16 } },
      info: { client: 'Essai', revisions: [{ index: 'A', date: '2026-10-13', description: 'Création' }] },
      settings: { ...p.settings, export: DEFAULT_EXPORT },
    }
    expect(ops.isProject(JSON.parse(JSON.stringify(complete)))).toBe(true)
    expect(ops.isProject(ops.createProject('Projet vide'))).toBe(true)
  })

  it('accepte les anciens projets et les réglages d’export partiels', () => {
    const old = { ...p, sheets: undefined, annotations: undefined, multicores: undefined, racks: undefined }
    expect(ops.isProject(old)).toBe(true)
    expect(ops.normalizeProject(old).sheets).toHaveLength(1)
    expect(ops.isProject({ ...old, settings: { ...p.settings, export: { protect: true } } })).toBe(true)
  })

  it.each([
    ['un projet null', null],
    ['un tableau', []],
    ['un identifiant absent', { ...p, id: undefined }],
    ['une version inconnue', { ...p, format: 2 }],
    ['des équipements null', { ...p, equipment: null }],
    ['des équipements en tableau', { ...p, equipment: [] }],
    ['un équipement null', { ...p, equipment: { [id]: null } }],
    ['des ports absents', { ...p, equipment: { [id]: { ...eq, ports: undefined } } }],
    ['un port null', { ...p, equipment: { [id]: { ...eq, ports: [null] } } }],
    ['un signal inconnu', { ...p, equipment: { [id]: { ...eq, ports: [{ ...eq.ports[0], signal: 'inconnu' }] } } }],
    ['une position invalide', { ...p, equipment: { [id]: { ...eq, position: { x: '100', y: 0 } } } }],
    ['une rotation invalide', { ...p, equipment: { [id]: { ...eq, rotation: 45 } } }],
    ['un affichage des prises invalide', { ...p, equipment: { [id]: { ...eq, portsExpanded: 'true' } } }],
    ['une liaison null', { ...p, links: { [linkId]: null } }],
    ['une extrémité absente', { ...p, links: { [linkId]: { ...link, source: undefined } } }],
    ['des zones absentes', { ...p, zones: undefined }],
    ['des réglages absents', { ...p, settings: undefined }],
    ['une tension non numérique', { ...p, settings: { ...p.settings, mainsVoltage: '230' } }],
    ['une annotation null', { ...p, annotations: { note: null } }],
    ['une baie invalide', { ...p, racks: { baie: { id: 'baie', name: 'Baie', heightU: '42' } } }],
    ['des feuilles null', { ...p, sheets: null }],
    ['des révisions invalides', { ...p, info: { revisions: [null] } }],
    ['un format de papier inconnu', { ...p, settings: { ...p.settings, export: { paper: 'inconnu' } } }],
    ['un filigrane mal formé', { ...p, settings: { ...p.settings, export: { watermark: { text: [] } } } }],
  ])('refuse %s sans lever d’exception', (_label, value) => {
    expect(ops.isProject(value)).toBe(false)
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

describe('éditeur de blocs et zones', () => {
  it('ajoute un port avec un identifiant libre', () => {
    const { p, b } = twoBoxes('gen-mic-dyn', 'gen-console')
    const n = p.equipment[b].ports.length
    const r = ops.addPort(p, b, { name: 'Aux', direction: 'in', signal: 'audioAnalog', connector: 'jack-trs', level: 'line+4' })
    expect(r.project.equipment[b].ports).toHaveLength(n + 1)
    expect(r.id).toBeTruthy()
    expect(p.equipment[b].ports.some(port => port.id === r.id)).toBe(false)
    const other = ops.addPort(p, b, { name: 'Ajout concurrent', direction: 'out', signal: 'video', connector: 'bnc' })
    expect(other.id).not.toBe(r.id)
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
  it('le concert enregistre le mix de la console et ne branche aucun microphone sur une entrée ligne', () => {
    const p = buildSampleProject()
    const rec = Object.values(p.equipment).find(e => e.templateId === 'gen-recorder')!
    const incoming = Object.values(p.links).filter(l => l.target.equipmentId === rec.id)
    expect(incoming).toHaveLength(2)
    for (const l of incoming) {
      expect(p.equipment[l.source.equipmentId].templateId).toBe('gen-console')
      expect(p.equipment[l.source.equipmentId].ports.find(port => port.id === l.source.portId)?.level).toBe('line+4')
    }
    expect(new Set(incoming.map(l => l.target.portId)).size).toBe(2)
    expect(checkProject(p)).toEqual([])
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

it('refuse un projet dont un identifiant vise le prototype', async () => {
  const { createProject, isProject } = await import('./project')
  const p = JSON.parse(JSON.stringify(createProject('t')))
  expect(isProject(p)).toBe(true)
  const piege = JSON.parse(JSON.stringify(p).replace('"equipment":{}', '"equipment":{"__proto__":{"id":"__proto__"}}'))
  expect(Object.keys(piege.equipment)).toEqual(['__proto__'])
  expect(isProject(piege)).toBe(false)
})
