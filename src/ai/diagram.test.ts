import { describe, expect, it } from 'vitest'
import { LIBRARY } from '../library'
import { diagramBlockSize, layoutDiagram } from '../model/diagramLayout'
import { addEquipment, createProject, DEFAULT_SHEET_ID } from '../model/project'
import { checkProject } from '../model/rules'
import { boundedHistory } from './agent'
import { createDraft, runTool, searchLibrary } from './tools'

const ctx = { library: LIBRARY, describe: (i: { code: string }) => i.code }
const equipment = [
  ...Array.from({ length: 5 }, (_, i) => ({ ref: `cam${i + 1}`, template_id: 'sony-pmw-400', name: `Caméra ${i + 1}` })),
  { ref: 'console', template_id: 'yamaha-cl5', name: 'Console son' },
  { ref: 'video', template_id: 'newtek-tricaster-2-elite', name: 'Mélangeur vidéo' },
]
const connections = [
  ...Array.from({ length: 5 }, (_, i) => ({ from: `cam${i + 1}`, from_port: 'sdi1', to: 'video', to_port: `sdi-in-${i + 1}` })),
  { from: 'console', from_port: 'out1', to: 'video', to_port: 'audio-in-l' },
  { from: 'console', from_port: 'out2', to: 'video', to_port: 'audio-in-r' },
]
const propose = (args: Record<string, unknown>, draft = createDraft(createProject('Plateau TV'), DEFAULT_SHEET_ID), allowed?: () => boolean) =>
  runTool(draft, { id: 'test', name: 'propose_diagram', args }, { ...ctx, allowed })

describe('synoptique IA : fiches et propose_diagram', () => {
  it('conserve les ports de la console dans les anciens résultats, malgré ses nombreuses sources', () => {
    const draft = createDraft(createProject('t'), DEFAULT_SHEET_ID)
    const call = { id: 'fiche', name: 'get_template', args: { template_id: 'yamaha-cl5' } }
    const result = runTool(draft, call, ctx)
    const history = boundedHistory([{ role: 'user', text: 'Plateau TV' }, { role: 'assistant', text: '', toolCalls: [call] },
      { role: 'tool', results: [{ id: call.id, name: call.name, content: result.content }] },
      { role: 'assistant', text: 'Je poursuis.', toolCalls: [] }, { role: 'user', text: 'Continue' }])
    const message = history[2]
    expect(message.role).toBe('tool')
    if (message.role !== 'tool') throw new Error('résultat perdu')
    const template = JSON.parse(message.results[0].content)
    expect(template.ports).toHaveLength(16)
    expect(template.ports.some((p: { id: string }) => p.id === 'out2')).toBe(true)
    expect(template.sources).toHaveLength(2)
  })
  it('retrouve des références abrégées sans marque ni confusion avec un numéro voisin', () => {
    for (const query of ['CL5', 'console CL5', 'une console CL-5', 'CL 5']) {
      expect(searchLibrary(LIBRARY, query)[0].template_id, query).toBe('yamaha-cl5')
    }
    expect(searchLibrary(LIBRARY, 'XR18')[0].template_id).toBe('behringer-xr18')
    const neighbour = { ...LIBRARY.find(t => t.id === 'yamaha-cl5')!, id: 'other', model: 'CL50', aliases: [] }
    const cl5 = LIBRARY.find(t => t.id === 'yamaha-cl5')!
    expect(searchLibrary([neighbour, cl5], 'console CL50')[0].template_id).toBe('other')
  })
  it('donne les niveaux de toutes les prises analogiques malgré la pagination, sans les déduire du XLR', () => {
    const cl5 = LIBRARY.find(t => t.id === 'yamaha-cl5')!
    const longConsole = { ...cl5, id: 'test-long', ports: [
      ...Array.from({ length: 20 }, (_, i) => ({ ...cl5.ports[0], id: 'in' + i })),
      ...cl5.ports.filter(p => p.direction === 'out'),
    ] }
    const draft = createDraft(createProject('t'), DEFAULT_SHEET_ID)
    const context = { ...ctx, library: [longConsole, ...LIBRARY] }
    const result = runTool(draft, { id: '1', name: 'get_template', args: { template_id: longConsole.id } }, context)
    const fiche = JSON.parse(result.content)
    expect(fiche.ports.every((p: { direction: string }) => p.direction === 'in')).toBe(true)
    expect(fiche.audio_levels).toContainEqual({ direction: 'out', connector: 'xlr3', level: 'line+4', nominal_level: 'ligne +4 dBu', ports: 8 })
    expect(fiche.audio_levels).toContainEqual({ direction: 'in', connector: 'xlr3', level: 'mic', nominal_level: 'micro', ports: 20 })
    expect(fiche.audio_levels).toContainEqual({ direction: 'out', connector: 'jack-trs', level: 'none', nominal_level: 'sans niveau nominal', ports: 1 })
    const added = runTool(draft, { id: '2', name: 'add_equipment', args: { template_id: longConsole.id } }, context)
    expect(JSON.parse(added.content).audio_levels).toEqual(fiche.audio_levels)
    const placed = runTool(added.draft, { id: '3', name: 'get_equipment', args: { equipment_id: added.draft.addedEquipment[0] } }, context)
    expect(JSON.parse(placed.content).audio_levels).toEqual(fiche.audio_levels)
    const mic = runTool(draft, { id: '4', name: 'get_template', args: { template_id: 'shure-sm58' } }, context)
    expect(JSON.parse(mic.content).audio_levels).toContainEqual({ direction: 'out', connector: 'xlr3', level: 'mic', nominal_level: 'micro', ports: 1 })
  })
  it('retrouve le TriCaster documenté et respecte une référence exacte', () => {
    expect(searchLibrary(LIBRARY, 'Tricaster')[0].template_id).toBe('newtek-tricaster-2-elite')
    expect(searchLibrary(LIBRARY, 'Yamaha CL5')[0].template_id).toBe('yamaha-cl5')
  })
  it('prépare cinq caméras identiques, le mélangeur et la console, avec sept liaisons valides', () => {
    const { draft, content } = propose({ equipment: [{ ref: 'cam', template_id: 'sony-pmw-400', name: 'Caméra', count: 5 }, ...equipment.slice(5)], connections })
    expect(JSON.parse(content).error).toBeUndefined()
    expect(draft.addedEquipment).toHaveLength(7)
    expect(draft.addedLinks).toHaveLength(7)
    expect(Object.values(draft.project.equipment).filter(e => e.templateId === 'sony-pmw-400')).toHaveLength(5)
    expect(checkProject(draft.project).filter(i => i.severity !== 'info')).toEqual([])
    expect(Object.keys(draft.base.equipment)).toHaveLength(0)
    const boxes = Object.values(draft.project.equipment).map(e => ({ ...e.position, ...diagramBlockSize(draft.project, e) }))
    boxes.forEach((a, i) => boxes.slice(i + 1).forEach(b => expect(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y).toBe(true)))
    const mixer = Object.values(draft.project.equipment).find(e => e.family === 'videoSwitcher')!
    expect(boxes.every(b => b.x >= 40 && b.y >= 40)).toBe(true)
    expect(Object.values(draft.project.equipment).filter(e => e.family === 'camera').every(e => e.position.x < mixer.position.x)).toBe(true)
  })
  it('annule tout l’appel si une prise est inventée, occupée ou si les droits refusent', () => {
    for (const invalid of [
      [...connections, { from: 'cam1', from_port: 'inventé', to: 'video', to_port: 'sdi-in-6' }],
      [...connections, { from: 'cam2', from_port: 'sdi2', to: 'video', to_port: 'sdi-in-1' }],
    ]) {
      const base = createDraft(createProject('t'), DEFAULT_SHEET_ID)
      const result = propose({ equipment, connections: invalid }, base)
      expect(result.draft).toBe(base)
      expect(JSON.parse(result.content).error).toBeTruthy()
    }
    const base = createDraft(createProject('t'), DEFAULT_SHEET_ID)
    expect(propose({ equipment, connections }, base, () => false).draft).toBe(base)
  })
  it('refuse les listes mal formées et les références ambiguës', () => {
    for (const args of [{ equipment: null, connections: [] }, { equipment: [...equipment, equipment[0]], connections },
      { equipment: [null], connections: [] }, { equipment, connections: [null] }, { equipment: Array(51).fill(equipment[0]), connections: [] },
      ...[0, -1, 1.5, 51, '5'].map(count => ({ equipment: [{ ...equipment[0], count }], connections: [] }))]) {
      expect(JSON.parse(propose(args).content).error).toBeTruthy()
    }
  })
  it('applique un mode de prise documenté et refuse un mode ou un câble inventé', () => {
    const recorder = LIBRARY.find(t => t.id === 'tascam-dr-40')!
    const port = recorder.ports.find(p => p.modes?.length)!
    const ok = propose({ equipment: [{ ref: 'rec', template_id: recorder.id, port_modes: [{ port_id: port.id, mode: 0 }] }], connections: [] })
    expect(JSON.parse(ok.content).error).toBeUndefined()
    expect(ok.draft.project.equipment[ok.draft.addedEquipment[0]].ports.find(p => p.id === port.id)).toMatchObject(port.modes![0])
    const base = createDraft(createProject('t'), DEFAULT_SHEET_ID)
    const mode = propose({ equipment: [{ ref: 'rec', template_id: recorder.id, port_modes: [{ port_id: port.id, mode: 50 }] }], connections: [] }, base)
    expect(JSON.parse(mode.content).error).toContain('Modes documentés : 0 = jack-trs line+4')
    expect(mode.draft).toBe(base)
    const cable = propose({ equipment: [{ ref: 'mic', template_id: 'shure-sm58' }, { ref: 'desk', template_id: 'yamaha-01v96' }],
      connections: [{ from: 'mic', from_port: 'out', to: 'desk', to_port: 'in1', cable_type_id: 'câble-inventé' }] }, base)
    expect(JSON.parse(cable.content).error).toBeTruthy()
    expect(cable.draft).toBe(base)
  })
  it('ne déplace pas les équipements préexistants, y compris sur une autre feuille', () => {
    const a = addEquipment(createProject('t'), LIBRARY.find(t => t.id === 'sony-pmw-400')!, { x: 510, y: 90 })
    const b = addEquipment(a.project, LIBRARY[0], { x: 10000, y: 0 }, { sheetId: 'autre' })
    const result = propose({ equipment, connections }, createDraft(b.project, DEFAULT_SHEET_ID)).draft
    expect(result.project.equipment[a.id]).toBe(b.project.equipment[a.id])
    expect(result.project.equipment[b.id]).toBe(b.project.equipment[b.id])
    expect(Math.min(...result.addedEquipment.map(id => result.project.equipment[id].position.x))).toBeGreaterThan(750)
    expect(Math.max(...result.addedEquipment.map(id => result.project.equipment[id].position.x))).toBeLessThan(10000)
  })
  it('termine un placement avec boucle sans tourner indéfiniment', () => {
    const d = propose({ equipment, connections }).draft
    const [a, b] = d.addedEquipment
    const project = { ...d.project, links: { ...d.project.links, loop: { ...Object.values(d.project.links)[0], id: 'loop', source: { equipmentId: b, portId: 'sdi1' }, target: { equipmentId: a, portId: 'sdi1' } } } }
    expect(Object.values(layoutDiagram(project, [a, b], DEFAULT_SHEET_ID).equipment).every(e => Number.isFinite(e.position.x))).toBe(true)
  })
})
