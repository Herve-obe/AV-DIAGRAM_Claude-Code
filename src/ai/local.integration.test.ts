// Activé seulement par scripts/test-local-ai.py : vrai modèle, serveur éphémère sur le poste, projet fictif.
import { describe, expect, it, vi } from 'vitest'
import { testAssistant } from './setup'
import { nativeTransport } from './transport'
import { GENERIC_LIBRARY } from '../library/generic'
import { createProject, DEFAULT_SHEET_ID } from '../model/project'
import { buildSystemPrompt, runTurn, type Transport } from './agent'
import { createDraft } from './tools'
import { LIBRARY } from '../library'
import { checkProject } from '../model/rules'
import { diagramBlockSize } from '../model/diagramLayout'
import { appendFileSync, writeFileSync } from 'node:fs'
import interviewRequest from './fixtures/interview-live.txt?raw'

const address = process.env.AVD_LOCAL_AI_TEST_URL
const token = process.env.AVD_LOCAL_AI_TEST_TOKEN
function trace(event: Record<string, unknown>) {
  if (process.env.AVD_LOCAL_AI_TEST_TRACE) appendFileSync(process.env.AVD_LOCAL_AI_TEST_TRACE, JSON.stringify({ time: new Date().toISOString(), ...event }) + '\n')
}
const transport: Transport = { async request(provider, _base, req) {
  if (!address || !/^http:\/\/127\.0\.0\.1:\d+\/v1$/.test(address) || provider !== 'builtin') throw new Error('serveur de test local requis')
  trace({ event: 'request', bytes: req.body?.length })
  const response = await fetch(address + req.path, { method: req.method, headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: req.body })
  const body = await response.text()
  trace({ event: 'response', status: response.status, body })
  return { status: response.status, body }
} }

describe.skipIf(!address)('IA locale réelle Qwen3 4B', () => {
  it('active le modèle avec le vrai test de configuration en un appel, en français et en anglais', async () => {
    const request = vi.spyOn(nativeTransport, 'request').mockImplementation(transport.request)
    try {
      for (const lang of ['fr', 'en']) {
        trace({ stage: 'setup-' + lang })
        request.mockClear()
        await testAssistant({ provider: 'builtin', model: 'qwen3-4b' }, lang)
        expect(request).toHaveBeenCalledTimes(1)
      }
    } finally { request.mockRestore() }
  }, 300000)

  it('transforme le cahier des charges interview et duo live en proposition câblée', async () => {
    const base = createProject('Interview et duo live — test fictif')
    let requests = 0
    const counted: Transport = { async request(...args) { requests++; return transport.request(...args) } }
    trace({ stage: 'interview-live' })
    const start = performance.now()
    const result = await runTurn({ transport: counted, connection: { provider: 'builtin', model: 'qwen3-4b' },
      system: buildSystemPrompt({ lang: 'fr', mode: 'expert', projectName: base.name, sheetName: 'Test' }), history: [], userText: interviewRequest,
      draft: createDraft(base, DEFAULT_SHEET_ID), ctx: { library: LIBRARY, describe: i => i.code } })
    expect(requests).toBe(1)
    expect(result.toolsUsed).toEqual(['propose_audio_production', 'check_project'])
    expect(result.draft.addedEquipment).toHaveLength(22)
    expect(result.draft.addedLinks).toHaveLength(30)
    expect(checkProject(result.draft.project).filter(i => i.severity !== 'info')).toEqual([])
    expect(result.draft.project.zones.map(z => z.name)).toContain('Studio live')
    expect(Object.values(result.draft.project.equipment).find(e => e.templateId === 'yamaha-01v96')?.notes).toContain('exclu de ST')
    expect(result.reply).toContain('Hypothèse')
    expect(Object.keys(base.equipment)).toHaveLength(0)
    if (process.env.AVD_LOCAL_AI_TEST_DIAGRAM) writeFileSync(process.env.AVD_LOCAL_AI_TEST_DIAGRAM.replace('diagram-tv', 'diagram-interview-live'), JSON.stringify(result.draft.project, null, 2))
    console.log(JSON.stringify({ interviewLive: { seconds: (performance.now() - start) / 1000, requests, tools: result.toolsUsed, equipment: result.draft.addedEquipment.length, links: result.draft.addedLinks.length, reply: result.reply } }))
  }, 900000)
  it('vérifie un projet fictif puis prépare un ajout sans modifier la source', async () => {
    const base = createProject('Essai IA locale')
    const system = buildSystemPrompt({ lang: 'fr', mode: 'expert', projectName: base.name, sheetName: 'Test' })
    trace({ stage: 'check' })
    const check = await runTurn({ transport, connection: { provider: 'builtin', model: 'qwen3-4b' }, system,
      history: [], userText: 'Appelle obligatoirement check_project pour vérifier le schéma vide. Aucun ajout. Confirme ensuite en une phrase.',
      draft: createDraft(base, DEFAULT_SHEET_ID), ctx: { library: GENERIC_LIBRARY, describe: (i) => i.code }, maxSteps: 5 })
    expect(check.toolsUsed).toContain('check_project')
    trace({ stage: 'microphone' })
    const add = await runTurn({ transport, connection: { provider: 'builtin', model: 'qwen3-4b' }, system,
      history: [], userText: 'Propose exactement un micro dynamique générique pour la voix. Cherche dans la bibliothèque, puis appelle add_equipment avec le modèle trouvé. Ne crée aucune liaison. Termine après avoir vérifié le projet.',
      draft: createDraft(base, DEFAULT_SHEET_ID), ctx: { library: GENERIC_LIBRARY, describe: (i) => i.code }, maxSteps: 8 })
    expect(add.toolsUsed).toContain('search_library')
    expect(add.toolsUsed).toContain('add_equipment')
    expect(add.draft.addedEquipment).toHaveLength(1)
    expect(Object.keys(base.equipment)).toHaveLength(0)
    expect(Object.values(add.draft.project.equipment)[0].templateId).toBe('gen-mic-dyn')
    expect(add.draft.addedLinks).toHaveLength(0)
    trace({ stage: 'plateau-tv' })
    const tv = await runTurn({ transport, connection: { provider: 'builtin', model: 'qwen3-4b' }, system,
      history: [], userText: 'Génère un plateau TV avec 5 caméras Sony reliées à un Tricaster et une console CL5 reliée au mélangeur',
      draft: createDraft(base, DEFAULT_SHEET_ID), ctx: { library: LIBRARY, describe: i => i.code }, onTool: name => console.log('TV outil :', name) })
    const devices = Object.values(tv.draft.project.equipment)
    const cameras = devices.filter(e => e.family === 'camera')
    const mixer = devices.find(e => /tricaster/i.test(e.model))
    if (process.env.AVD_LOCAL_AI_TEST_DIAGRAM) writeFileSync(process.env.AVD_LOCAL_AI_TEST_DIAGRAM, JSON.stringify(tv.draft.project, null, 2))
    console.log(JSON.stringify({ tv: { devices: devices.map(e => ({ name: e.name, model: e.model, position: e.position })), links: Object.values(tv.draft.project.links), reply: tv.reply } }))
    expect(cameras).toHaveLength(5)
    expect(cameras.every(e => e.manufacturer === 'Sony')).toBe(true)
    expect(new Set(cameras.map(e => e.templateId)).size).toBe(1)
    expect(mixer).toBeDefined()
    expect(devices.some(e => e.templateId === 'yamaha-cl5')).toBe(true)
    expect(devices).toHaveLength(7)
    const links = Object.values(tv.draft.project.links)
    expect(cameras.every(e => links.some(l => l.source.equipmentId === e.id && l.target.equipmentId === mixer!.id
      && e.ports.some(p => p.id === l.source.portId && p.signal === 'video' && p.connector === 'bnc' && /SDI/i.test(p.name + ' ' + p.format))
      && mixer!.ports.some(p => p.id === l.target.portId && p.direction === 'in' && /SDI/i.test(p.name))))).toBe(true)
    expect(links.some(l => tv.draft.project.equipment[l.source.equipmentId].templateId === 'yamaha-cl5' && l.target.equipmentId === mixer!.id
      && mixer!.ports.some(p => p.id === l.target.portId && p.signal === 'audioAnalog' && p.connector === 'xlr3'))).toBe(true)
    expect(checkProject(tv.draft.project).filter(i => i.severity === 'error')).toEqual([])
    const boxes = devices.map(e => ({ ...e.position, ...diagramBlockSize(tv.draft.project, e) }))
    boxes.forEach((a, i) => boxes.slice(i + 1).forEach(b => expect(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y).toBe(true)))
    expect(Object.keys(base.equipment)).toHaveLength(0)
    console.log(JSON.stringify({ model: 'qwen3-4b', check: check.toolsUsed, proposal: add.toolsUsed, tv: { tools: tv.toolsUsed, devices: devices.map(e => ({ name: e.name, model: e.model, position: e.position })), links: links.length, reply: tv.reply } }))
  }, 900000)
  it('clarifie une demande large avec connectique manquante en un seul appel', async () => {
    const base = createProject('Essai de demande large')
    let requests = 0
    const counted: Transport = { async request(...args) { requests++; return transport.request(...args) } }
    const result = await runTurn({ transport: counted, connection: { provider: 'builtin', model: 'qwen3-4b' },
      system: buildSystemPrompt({ lang: 'fr', mode: 'expert', projectName: base.name, sheetName: 'Test' }), history: [],
      userText: 'Génère un plateau TV avec 5 caméra Panasonic P2 reliées à un mélangeur Tricaster. Une console audio CL5 avec des micros Sanken cos11 en HF avec des Sennheiser EW112 G4. La sortie master est envoyée au Tricaster.',
      draft: createDraft(base, DEFAULT_SHEET_ID), ctx: { library: LIBRARY, describe: i => i.code } })
    expect(requests).toBe(1)
    expect(result.toolsUsed).toEqual(['ask_user'])
    expect(result.reply).toMatch(/cos|sanken|hf|micro/i)
    expect(result.draft.addedEquipment).toEqual([])
    expect(Object.keys(base.equipment)).toHaveLength(0)
  }, 900000)
})
