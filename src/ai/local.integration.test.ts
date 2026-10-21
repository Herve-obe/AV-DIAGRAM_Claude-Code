// Activé seulement par scripts/test-local-ai.py : vrai modèle, serveur éphémère sur le poste, projet fictif.
import { describe, expect, it } from 'vitest'
import { GENERIC_LIBRARY } from '../library/generic'
import { createProject, DEFAULT_SHEET_ID } from '../model/project'
import { buildSystemPrompt, runTurn, type Transport } from './agent'
import { createDraft } from './tools'
import { LIBRARY } from '../library'
import { checkProject } from '../model/rules'
import { diagramBlockSize } from '../model/diagramLayout'
import { appendFileSync, writeFileSync } from 'node:fs'

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
      history: [], userText: "Propose un synoptique d'un plateau TV avec 5 caméras Sony, un mélangeur vidéo Tricaster et une console Yamaha CL5",
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
})
