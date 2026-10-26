import { describe, expect, it } from 'vitest'
import { GENERIC_LIBRARY } from '../library/generic'
import { createProject, DEFAULT_SHEET_ID, isProject } from '../model/project'
import { checkProject } from '../model/rules'
import { createDraft, runTool } from './tools'
import { runTurn, type Transport } from './agent'
import { checkGuestChange } from '../collab/access'

const ctx = { library: GENERIC_LIBRARY, describe: (i: { code: string }) => i.code }
const base = () => createDraft(createProject('Système fictif'), DEFAULT_SHEET_ID)
const call = (name: string, args: Record<string, unknown>) => ({ id: name, name, args })
const audio = {
  equipment: [{ ref: 'mic', template_id: 'gen-mic-dyn', count: 3 }, { ref: 'desk', template_id: 'gen-console' }, { ref: 'speaker', template_id: 'gen-speaker-active', count: 2 }],
  connections: [{ from: 'mic', to: 'desk', signal: 'audioAnalog' }, { from: 'desk', to: 'speaker', signal: 'audioAnalog', purpose: 'Affecter les sorties au programme gauche/droite.' }],
}
const plan = {
  goal: 'Sonoriser une conférence de trois personnes',
  roles: [{ ref: 'mic', query: 'Micro dynamique', family: 'capture', count: 3, required_model: false },
    { ref: 'desk', query: 'Console numérique', family: 'console', count: 1, required_model: false },
    { ref: 'speaker', query: 'Enceinte amplifiée', family: 'speaker', count: 2, required_model: false }],
  constraints: ['Trois microphones et deux enceintes'], assumptions: ['Références génériques proposées à confirmer.'], questions: [],
}
const replies = (calls: ReturnType<typeof call>[], sent: string[] = []): Transport => ({ async request(_provider, _url, req) {
  sent.push(req.body!)
  const next = calls.shift()
  if (!next) throw new Error('Appel modèle supplémentaire inattendu')
  return { status: 200, body: JSON.stringify({ choices: [{ message: { tool_calls: [{ id: next.id, type: 'function', function: { name: next.name, arguments: JSON.stringify(next.args) } }] } }] }) }
} })

describe('analyse de besoins et câblage de rôles sans scénario prédéfini', () => {
  it('analyse une conférence puis produit tous les câbles et conserve les hypothèses en deux appels', async () => {
    const draft = base(), sent: string[] = []
    const result = await runTurn({ draft, ctx, connection: { provider: 'builtin', model: 'test' }, system: '', history: [],
      userText: 'Je veux sonoriser une conférence avec trois micros et deux enceintes. Choisis une console adaptée.',
      transport: replies([call('plan_diagram', plan), call('propose_system', audio)], sent) })
    expect(sent).toHaveLength(2)
    expect(JSON.parse(sent[0]).tool_choice).toBe('required')
    expect(JSON.parse(sent[0]).tools.map((t: { function: { name: string } }) => t.function.name)).toEqual(['plan_diagram'])
    expect(result.toolsUsed).toEqual(['plan_diagram', 'propose_system', 'check_project'])
    expect(result.draft.addedEquipment).toHaveLength(6)
    expect(result.draft.addedLinks).toHaveLength(5)
    expect(checkProject(result.draft.project).filter(i => i.severity !== 'info')).toEqual([])
    expect(Object.values(result.draft.project.annotations ?? {}).some(a => a.text.includes('Trois microphones'))).toBe(true)
    expect(result.reply).toContain('Aucun stock')
    expect(result.draft.layout?.choices.length).toBeGreaterThan(1)
    expect(isProject(JSON.parse(JSON.stringify(result.draft.project)))).toBe(true)
    expect(Object.keys(draft.base.equipment)).toEqual([])
  })

  it('pose trois questions pour un podcast vague puis reprend le besoin avec les précisions', async () => {
    const draft = base(), options = { draft, ctx, connection: { provider: 'builtin' as const, model: 'test' }, system: '', history: [] }
    const first = await runTurn({ ...options, userText: 'Je veux faire un podcast.', transport: replies([call('plan_diagram', { ...plan,
      roles: [], questions: ['Combien de participants ?', 'Enregistrement ou diffusion ?', 'Quel matériel est imposé ?'],
    })]) })
    expect(first.draft).toBe(draft)
    expect(first.reply.split('\n')).toHaveLength(3)
    const sent: string[] = []
    const second = await runTurn({ ...options, history: first.history, userText: 'Trois micros, une console numérique et deux enceintes amplifiées, références libres.',
      transport: replies([call('plan_diagram', plan), call('propose_system', audio)], sent) })
    expect(JSON.parse(sent[0]).messages.at(-1).content).toContain('Je veux faire un podcast')
    expect(second.draft.addedLinks).toHaveLength(5)
  })

  it('demande une référence absente au lieu de substituer un appareil imposé', () => {
    const draft = base()
    const result = runTool(draft, call('plan_diagram', { ...plan, roles: [{ ref: 'desk', query: 'Inconnue ZZ9000', family: 'console', count: 1, required_model: true }] }), ctx)
    expect(JSON.parse(result.content).questions[0]).toContain('ZZ9000')
    expect(result.draft).toBe(draft)
  })

  it('refuse une référence imposée omise et permet de compléter une proposition précédente', async () => {
    const named = { ...GENERIC_LIBRARY.find(t => t.id === 'gen-console')!, id: 'real-xyz900', model: 'XYZ900', status: 'community' as const }
    const strict = { ...ctx, library: [named, ...GENERIC_LIBRARY] }, sent: string[] = []
    const failed = await runTurn({ draft: base(), ctx: strict, connection: { provider: 'builtin', model: 'test' }, system: '', history: [],
      userText: 'Propose une conférence avec 3 micros, deux enceintes et ma console XYZ900.',
      transport: replies([call('plan_diagram', plan), call('propose_system', audio), call('ask_user', { question: 'Confirme le modèle XYZ900 avant de remplacer la console.' })], sent) })
    expect(failed.draft.addedEquipment).toEqual([])
    expect(sent[2]).toContain('Références demandées absentes')
    const ready = runTool(runTool(base(), call('plan_diagram', plan), ctx).draft, call('propose_system', audio), ctx).draft
    const add = replies([call('add_equipment', { template_id: 'gen-mic-dyn' })]); let requests = 0
    const extra = await runTurn({ draft: ready, ctx, connection: { provider: 'builtin', model: 'test' }, system: '', history: [],
      userText: 'Ajoute un micro dynamique supplémentaire sans connexion',
      transport: { request: (...args) => requests++ ? Promise.resolve({ status: 200, body: JSON.stringify({ choices: [{ message: { content: 'Micro proposé.' } }] }) }) : add.request(...args) } })
    expect(extra.draft.addedEquipment).toHaveLength(7)
    expect(extra.draft.addedLinks).toEqual(ready.addedLinks)
  })

  it('câble vidéo et réseau avec des prises distinctes, sans réutiliser une sortie occupée', () => {
    for (const args of [
      { equipment: [{ ref: 'cam', template_id: 'gen-camera', count: 3 }, { ref: 'switcher', template_id: 'gen-switcher' }, { ref: 'display', template_id: 'gen-monitor' }],
        connections: [{ from: 'cam', to: 'switcher', signal: 'video' }, { from: 'switcher', to: 'display', signal: 'video' }] },
      { equipment: [{ ref: 'switch', template_id: 'gen-switch8', count: 4 }],
        connections: [{ from: 'switch1', to: 'switch2', signal: 'network' }, { from: 'switch1', to: 'switch3', signal: 'network' }, { from: 'switch1', to: 'switch4', signal: 'network' }] },
      { equipment: [{ ref: 'switch', template_id: 'gen-switch8' }, { ref: 'desk', template_id: 'gen-console' }, { ref: 'box', template_id: 'gen-stagebox-ip' }, { ref: 'clock', template_id: 'gen-clock' }],
        connections: [{ from: 'desk', to: 'switch', signal: 'audioIp' }, { from: 'box', to: 'switch', signal: 'audioIp' }, { from: 'clock', to: 'desk', signal: 'sync' }] },
    ]) {
      const result = runTool(base(), call('propose_system', args), ctx)
      expect(JSON.parse(result.content).error).toBeUndefined()
      const links = Object.values(result.draft.project.links)
      expect(links.length).toBeGreaterThan(2)
      const ends = links.flatMap(l => [l.source, l.target]).map(r => r.equipmentId + '/' + r.portId)
      expect(new Set(ends).size).toBe(ends.length)
      expect(checkProject(result.draft.project).filter(i => i.severity !== 'info')).toEqual([])
    }
  })

  it('refuse atomiquement capacité insuffisante, niveaux incompatibles, mauvais signal et rôles ambigus', () => {
    for (const args of [
      { ...audio, equipment: [{ ...audio.equipment[0], count: 40 }, ...audio.equipment.slice(1)] },
      { equipment: [{ ref: 'mic', template_id: 'gen-mic-dyn' }, { ref: 'speaker', template_id: 'gen-speaker-active' }], connections: [{ from: 'mic', to: 'speaker', signal: 'audioAnalog' }] },
      { ...audio, connections: [{ from: 'mic', to: 'desk', signal: 'signal-inventé' }] },
      { ...audio, connections: [{ from: 'mic', to: 'speaker', signal: 'audioAnalog' }] },
    ]) {
      const draft = base(), result = runTool(draft, call('propose_system', args), ctx)
      expect(JSON.parse(result.content).error).toBeTruthy()
      expect(result.draft).toBe(draft)
      expect(Object.keys(draft.project.equipment)).toEqual([])
    }
  })

  it('ne perd pas une quantité du plan et ne contourne pas les droits', () => {
    const draft = runTool(base(), call('plan_diagram', plan), ctx).draft
    const omitted = runTool(draft, call('propose_system', { ...audio, equipment: [{ ...audio.equipment[0], count: 2 }, ...audio.equipment.slice(1)] }), ctx)
    expect(JSON.parse(omitted.content).error).toContain('3 exemplaires')
    expect(omitted.draft).toBe(draft)
    const denied = runTool(base(), call('propose_system', audio), { ...ctx, allowed: () => false })
    expect(denied.draft.addedEquipment).toEqual([])
  })

  it('permet une proposition audio sur le calque attribué sans créer d’annotation commune', () => {
    const draft = runTool(base(), call('plan_diagram', plan), ctx).draft
    const result = runTool(draft, call('propose_system', audio), { ...ctx, allowed: (before, after) => checkGuestChange(before, after, new Set(['sound']), 'sound') })
    expect(JSON.parse(result.content).error).toBeUndefined()
    expect(result.draft.addedLinks).toHaveLength(5)
    expect(Object.values(result.draft.project.annotations ?? {})).toEqual([])
    expect(Object.values(result.draft.project.equipment).some(e => e.notes?.includes('Trois microphones'))).toBe(true)
  })

  it('termine les recherches infructueuses par une précision, sans perdre le projet', async () => {
    const draft = base(), sent: string[] = []
    const result = await runTurn({ draft, ctx, connection: { provider: 'builtin', model: 'test' }, system: '', history: [],
      userText: 'Propose une conférence avec trois micros, une console et deux enceintes.',
      transport: replies([call('plan_diagram', plan), call('propose_system', { ...audio, connections: [{ from: 'mic', to: 'speaker', signal: 'audioAnalog' }] }),
        ...['console', 'micro', 'speaker', 'capture', 'amplification'].map(query => call('search_library', { query })),
        call('ask_user', { question: 'Quelle sortie de la console souhaites-tu affecter aux enceintes ?' })], sent) })
    expect(sent).toHaveLength(8)
    expect(JSON.parse(sent.at(-1)!).tools.map((t: { function: { name: string } }) => t.function.name)).toEqual(['ask_user'])
    expect(result.draft).toBe(draft)
    expect(result.reply).toContain('sortie de la console')
  })

  it('conserve les vingt rôles quand le résultat du catalogue dépasse le budget de l’historique', async () => {
    const library = Array.from({ length: 20 }, (_, i) => ({ ...GENERIC_LIBRARY.find(t => t.id === 'gen-mic-dyn')!, id: `user-role-${i}`,
      model: 'Microphone fictif ' + 'description longue '.repeat(20), aliases: [`Alias${i}`], status: 'user' as const }))
    const roles = library.map((_, i) => ({ ref: `role${i}`, query: `Alias${i}`, count: 1, required_model: true }))
    const sent: string[] = [], draft = base()
    const result = await runTurn({ draft, ctx: { ...ctx, library }, connection: { provider: 'builtin', model: 'test' }, system: '', history: [],
      userText: 'Propose un podcast avec les vingt microphones du catalogue fictif.',
      transport: replies([call('plan_diagram', { ...plan, roles }), call('propose_system', { equipment: [], connections: [] }), call('ask_user', { question: 'Quelle console doit recevoir les vingt micros ?' })], sent) })
    const second = JSON.parse(sent[1])
    expect(second.messages.filter((m: { role: string }) => m.role === 'tool')).toEqual([])
    expect(second.messages[0].content).toContain('"ref":"role19"')
    expect(second.messages[0].content).toContain('"template_id":"user-role-19"')
    expect(result.draft).toBe(draft)
  })
})

it('corrige le nombre de câbles par enceinte observé avec Qwen3 sans perdre le plan', async () => {
  const draft = base(), sent: string[] = []
  const bad = { ...audio, connections: [audio.connections[0], { ...audio.connections[1], links_per_pair: 2 }] }
  const result = await runTurn({ draft, ctx, connection: { provider: 'builtin', model: 'test' }, system: '', history: [],
    userText: 'Propose une conférence avec trois micros dynamiques, une console et deux enceintes actives.',
    transport: replies([call('plan_diagram', plan), call('propose_system', bad), call('propose_system', audio)], sent) })
  expect(result.draft.addedEquipment).toHaveLength(6)
  expect(result.draft.addedLinks).toHaveLength(5)
  expect(result.toolsUsed).not.toContain('ask_user')
  expect(JSON.parse(sent[2]).tools.map((t: { function: { name: string } }) => t.function.name)).toEqual(['propose_system'])
  expect(JSON.parse(sent[2]).messages[0].content).toContain('in/audioAnalog/xlr3/line+4')
  expect(sent[2]).toContain('Aucune paire')
  expect(Object.keys(draft.base.equipment)).toHaveLength(0)
})
