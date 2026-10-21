import { describe, expect, it } from 'vitest'
import { LIBRARY } from '../library'
import { diagramBlockSize, layoutDiagram } from '../model/diagramLayout'
import { addEquipment, createProject, DEFAULT_SHEET_ID } from '../model/project'
import { checkProject } from '../model/rules'
import { boundedHistory, requestedCounts, runTurn, type Transport } from './agent'
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

describe('synoptique IA : plateau TV', () => {
  it('offre au modèle léger un outil de plateau câblé, sans lui déléguer le choix des prises', async () => {
    let sent = ''
    let n = 0
    const transport: Transport = { async request(_provider, _url, req) {
      sent = req.body!
      return { status: 200, body: JSON.stringify({ choices: [{ message: n++ === 0
        ? { tool_calls: [{ id: '1', type: 'function', function: { name: 'propose_video_studio', arguments: JSON.stringify({ camera_template_id: 'sony-hxc-d70', camera_count: 5, video_switcher_template_id: 'newtek-tricaster-2-elite', audio_console_template_id: 'yamaha-cl5' }) } }] }
        : { content: 'Plateau proposé.' } }] }) }
    } }
    const result = await runTurn({ transport, connection: { provider: 'builtin', model: 'test' }, system: '', history: [],
      userText: 'Propose un synoptique de plateau TV avec 5 caméras Sony, un mélangeur vidéo Tricaster et une console Yamaha CL5',
      draft: createDraft(createProject('t'), DEFAULT_SHEET_ID), ctx })
    const names = JSON.parse(sent).tools.map((t: { function: { name: string } }) => t.function.name)
    expect(names).toContain('propose_video_studio')
    expect(names).not.toContain('propose_diagram')
    const context = JSON.parse(sent).messages[0].content
    expect(context).toContain('"template_id":"newtek-tricaster-2-elite"')
    expect(context).toContain('"template_id":"yamaha-cl5"')
    expect(context).toContain('"requested_count":5')
    expect(context).not.toContain('"ports":')
    expect(context.length).toBeLessThan(2000)
    expect(result.draft.addedEquipment).toHaveLength(7)
    expect(result.draft.addedLinks).toHaveLength(7)
    expect(result.history.some(m => m.role === 'tool' && m.results.some(r => r.content.includes('niveau ligne')))).toBe(true)
    const denied = runTool(createDraft(createProject('t'), DEFAULT_SHEET_ID), { id: '1', name: 'propose_video_studio', args: {
      camera_template_id: 'sony-hxc-d70', camera_count: 5, video_switcher_template_id: 'newtek-tricaster-2-elite', audio_console_template_id: 'yamaha-cl5',
    } }, { ...ctx, allowed: () => false })
    expect(denied.draft.addedEquipment).toEqual([])
  })
  it('lit les quantités explicites du prompt sans prendre une console lumière pour une console audio', () => {
    expect(Object.fromEntries(requestedCounts('5 caméras Sony, un mélangeur vidéo Tricaster et une console Yamaha CL5'))).toEqual({ camera: 5, console: 1, videoSwitcher: 1 })
    expect(Object.fromEntries(requestedCounts('a video switcher and 3 cameras'))).toEqual({ camera: 3, videoSwitcher: 1 })
    expect(requestedCounts('une console lumière').size).toBe(0)
  })
  it('fournit les vraies références et prises du catalogue avant la première réponse du modèle', async () => {
    let body = ''
    const transport: Transport = { async request(_provider, _url, req) { body = req.body!; throw new Error('fin du test') } }
    const base = createProject('t')
    await expect(runTurn({ transport, connection: { provider: 'builtin', model: 'test' }, system: '', history: [],
      userText: 'Propose un synoptique avec 5 caméras Sony, un mélangeur vidéo Tricaster et une console Yamaha CL5',
      draft: createDraft(base, DEFAULT_SHEET_ID), ctx })).rejects.toMatchObject({ kind: 'network' })
    const system = JSON.parse(body).messages[0].content
    expect(system).toContain('newtek-tricaster-2-elite')
    expect(system).toContain('yamaha-cl5')
    expect(system).toContain('sony-')
    expect(system).toContain('"requested_count":5')
    expect(system).toContain('"id":"sdi-in-5"')
    expect(system).toContain('"id":"out2"')
    expect(Object.keys(base.equipment)).toHaveLength(0)
  })
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
  it('ne valide pas une réponse textuelle annonçant des connexions absentes', async () => {
    let n = 0
    const transport: Transport = { async request() {
      return { status: 200, body: JSON.stringify({ choices: [{ message: n++ === 0
        ? { tool_calls: [{ id: '1', type: 'function', function: { name: 'propose_diagram', arguments: JSON.stringify({ equipment, connections: [] }) } }] }
        : { content: 'Les caméras sont reliées au TriCaster.' } }] }) }
    } }
    await expect(runTurn({ transport, connection: { provider: 'builtin', model: 'test' }, system: '', history: [],
      userText: 'Propose un synoptique plateau TV', draft: createDraft(createProject('t'), DEFAULT_SHEET_ID), ctx })).rejects.toMatchObject({ kind: 'incomplete' })
  })
  it('refuse un plan à deux caméras pour une demande de cinq, puis accepte le plan corrigé', async () => {
    const wrong = { equipment: [equipment[0], equipment[1], ...equipment.slice(5)], connections: connections.filter(c => !['cam3', 'cam4', 'cam5'].includes(c.from)) }
    const complete = { equipment: [{ ref: 'cam', template_id: 'sony-pmw-400', name: 'Caméra', count: 5 }, ...equipment.slice(5)], connections }
    const plans = [wrong, complete]
    const sent: string[] = []
    const transport: Transport = { async request(_provider, _url, req) {
      sent.push(req.body!)
      const plan = plans.shift()
      return { status: 200, body: JSON.stringify({ choices: [{ message: plan
        ? { tool_calls: [{ id: String(sent.length), type: 'function', function: { name: 'propose_diagram', arguments: JSON.stringify(plan) } }] }
        : { content: 'Sept équipements et leurs liaisons proposés.' } }] }) }
    } }
    const result = await runTurn({ transport, connection: { provider: 'builtin', model: 'test' }, system: '', history: [],
      userText: 'Propose un synoptique avec 5 caméras Sony, un mélangeur vidéo et une console Yamaha CL5', draft: createDraft(createProject('t'), DEFAULT_SHEET_ID), ctx })
    expect(sent[1]).toContain('5 demandés, 2 présents')
    expect(result.draft.addedEquipment).toHaveLength(7)
    expect(result.draft.addedLinks).toHaveLength(7)
  })
})
