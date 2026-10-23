import { describe, expect, it } from 'vitest'
import { LIBRARY } from '../library'
import { addAnnotation, addEquipment, createProject, DEFAULT_SHEET_ID, isProject } from '../model/project'
import { checkProject } from '../model/rules'
import { diagramBlockSize } from '../model/diagramLayout'
import { runTurn, type Transport } from './agent'
import { createDraft, referenceScore, runTool } from './tools'
import request from './fixtures/interview-live.txt?raw'

const ctx = { library: LIBRARY, describe: (i: { code: string }) => i.code }
const call = { id: 'production', name: 'propose_audio_production', args: { main_console_template_id: 'yamaha-m7cl-48es', live_console_template_id: 'yamaha-01v96' } }
const base = () => createDraft(createProject('Émission Twitch'), DEFAULT_SHEET_ID)

describe('proposition audio complète et persistante', () => {
  it('câble les vrais ports, conserve le routage et les zones dans le fichier sans toucher la source', () => {
    const draft = base(), result = runTool(draft, call, ctx), value = JSON.parse(result.content)
    expect(value).not.toHaveProperty('error')
    expect(value.mixes).toHaveLength(6)
    const p = result.draft.project
    expect(result.draft.addedEquipment).toHaveLength(22)
    expect(result.draft.addedLinks).toHaveLength(30)
    expect(checkProject(p).filter(i => i.severity !== 'info')).toEqual([])
    expect(p.zones.map(z => z.name).slice(-3)).toEqual(['Plateau interview', 'Régie émission', 'Studio live'])
    expect(Object.values(p.annotations ?? {}).filter(a => a.kind === 'note')).toHaveLength(3)
    expect(Object.values(p.equipment).every(e => e.zoneId)).toBe(true)
    const recorder = Object.values(p.equipment).find(e => e.templateId === 'tascam-dr-40')!
    expect(recorder.ports.filter(p => ['in1', 'in2'].includes(p.id)).every(p => p.connector === 'jack-trs' && p.level === 'line+4' && p.phantom === 'none')).toBe(true)
    expect(LIBRARY.find(t => t.id === recorder.templateId)!.ports[0].level).toBe('mic')
    expect(isProject(JSON.parse(JSON.stringify(p)))).toBe(true)
    const invalid = structuredClone(p)
    invalid.equipment[recorder.id].ports[0].modes = [{ connector: 'prise-inventée', level: 'line+4' }]
    expect(isProject(invalid)).toBe(false)
    expect(Object.values(JSON.parse(JSON.stringify(p)).equipment).some(e => (e as { notes?: string }).notes?.includes('MIX 3/4'))).toBe(true)
    expect(Object.keys(draft.base.equipment)).toEqual([])
    expect(Object.values(p.links).every(l => l.source.equipmentId !== l.target.equipmentId)).toBe(true)
    const sizes = Object.values(p.equipment).map(e => ({ ...e.position, ...diagramBlockSize(p, e) }))
    sizes.forEach((a, i) => sizes.slice(i + 1).forEach(b => expect(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y).toBe(true)))
  })
  it('refuse atomiquement les droits insuffisants, une fiche manquante et un mode inventé', () => {
    const draft = base()
    expect(referenceScore(LIBRARY.find(t => t.id === 'novelty-ces')!, request)).toBe(0)
    for (const context of [{ ...ctx, allowed: () => false }, { ...ctx, library: LIBRARY.filter(t => t.id !== 'behringer-ha8000') }]) {
      const result = runTool(draft, call, context)
      expect(JSON.parse(result.content).error).toBeTruthy()
      expect(result.draft).toBe(draft)
    }
    const result = runTool(draft, { id: 'mode', name: 'propose_diagram', args: { equipment: [{ ref: 'rec', template_id: 'tascam-dr-40', port_modes: [{ port_id: 'in1', mode: 50 }] }], connections: [] } }, ctx)
    expect(JSON.parse(result.content).error).toContain('non documenté')
    expect(result.draft).toBe(draft)
    const badCable = runTool(draft, { id: 'cable', name: 'propose_diagram', args: {
      equipment: [{ ref: 'mic', template_id: 'shure-sm58' }, { ref: 'desk', template_id: 'yamaha-01v96' }],
      connections: [{ from: 'mic', from_port: 'out', to: 'desk', to_port: 'in1', cable_type_id: 'câble-inventé' }],
    } }, ctx)
    expect(JSON.parse(badCable.content).error).toBeTruthy()
    expect(badCable.draft).toBe(draft)
    const p = runTool(draft, call, { ...ctx, lang: 'en' })
    expect(Object.values(p.draft.project.annotations ?? {}).some(a => a.text.includes('PROGRAMME ROUTING'))).toBe(true)
  })
  it('garde une position, une note et une connexion existantes intactes', () => {
    const added = addEquipment(base().project, LIBRARY.find(t => t.id === 'shure-sm58')!, { x: 400, y: 100 })
    const frame = addAnnotation(added.project, { kind: 'frame', sheetId: DEFAULT_SHEET_ID, text: 'Cadre antérieur', zoneId: added.project.zones[0].id,
      position: { x: 350, y: 50 }, size: { w: 300, h: 250 } })
    const draft = createDraft(frame.project, DEFAULT_SHEET_ID)
    const result = runTool(draft, call, ctx)
    expect(JSON.parse(result.content).error).toBeUndefined()
    expect(result.draft.project.equipment[added.id]).toEqual(added.project.equipment[added.id])
    expect(Object.values(result.draft.project.equipment).filter(e => e.id !== added.id).every(e => e.position.x > 400)).toBe(true)
    const positions = Object.fromEntries(result.draft.addedEquipment.map(id => [id, result.draft.project.equipment[id].position]))
    const more = runTool(result.draft, { id: 'more', name: 'propose_diagram', args: { equipment: [{ ref: 'extra', template_id: 'shure-sm58' }], connections: [] } }, ctx)
    for (const [id, position] of Object.entries(positions)) expect(more.draft.project.equipment[id].position).toEqual(position)
  })
  it('analyse le cahier des charges puis termine après un appel modèle et la vérification locale', async () => {
    const sent: string[] = []
    const transport: Transport = { async request(_provider, _base, req) {
      sent.push(req.body!)
      return { status: 200, body: JSON.stringify({ choices: [{ message: { tool_calls: [{ id: call.id, type: 'function', function: { name: call.name, arguments: JSON.stringify(call.args) } }] } }] }) }
    } }
    const draft = base()
    const result = await runTurn({ connection: { provider: 'builtin', model: 'test' }, system: '', userText: request, history: [], draft, ctx, transport })
    expect(sent).toHaveLength(1)
    expect(result.toolsUsed).toEqual(['propose_audio_production', 'check_project'])
    expect(result.reply).toContain('Proposition préparée')
    expect(result.reply).toContain('Hypothèse')
    expect(result.draft.addedEquipment.length).toBeGreaterThan(20)
    expect(JSON.parse(sent[0]).tools.map((t: { function: { name: string } }) => t.function.name)).toEqual(['ask_user', 'propose_audio_production'])
    expect(Object.keys(draft.base.equipment)).toEqual([])
  })
})
