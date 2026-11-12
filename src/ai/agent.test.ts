// Boucle de l'assistant : liste d'outils stable, précisions, garde-fous. Le modèle est simulé par un transport.
import { describe, expect, it } from 'vitest'
import { LIBRARY } from '../library'
import { GENERIC_LIBRARY } from '../library/generic'
import { createProject, DEFAULT_SHEET_ID } from '../model/project'
import { runTurn, type Transport } from './agent'
import { createDraft, referenceScore, runTool, TOOL_SPECS } from './tools'

type Call = { id: string; name: string; args: Record<string, unknown> }
const ctx = { library: GENERIC_LIBRARY, describe: (i: { code: string }) => i.code }
const ask = { id: 'ask', name: 'ask_user', args: { question: 'Combien de participants faut-il sonoriser ?' } }
const role = (ref: string, query: string, family: string, count: number, required_model = false) => ({ ref, query, family, count, required_model })
const plan = {
  goal: 'Sonoriser une conférence', roles: [role('mic', 'Micro dynamique', 'capture', 3), role('desk', 'Console numérique', 'console', 1), role('speaker', 'Enceinte amplifiée', 'speaker', 2)],
  constraints: [], assumptions: ['Références génériques proposées à confirmer.'], questions: [],
}
const system = {
  equipment: [{ ref: 'mic', template_id: 'gen-mic-dyn', count: 3 }, { ref: 'desk', template_id: 'gen-console' }, { ref: 'speaker', template_id: 'gen-speaker-active', count: 2 }],
  connections: [{ from: 'mic', to: 'desk', signal: 'audioAnalog' }, { from: 'desk', to: 'speaker', signal: 'audioAnalog' }],
}
const call = (name: string, args: Record<string, unknown>): Call => ({ id: name, name, args })

/** Réponses prévues dans l'ordre (texte ou appels d'outils) ; garde les corps de requête envoyés. */
function transport(replies: { text?: string; calls?: Call[] }[], sent: string[] = []): Transport {
  return { async request(_provider, _url, req) {
    sent.push(req.body!)
    const reply = replies.shift()
    if (!reply) throw new Error('aucune réponse prévue')
    return { status: 200, body: JSON.stringify({ choices: [{ message: { content: reply.text ?? '',
      tool_calls: (reply.calls ?? []).map(c => ({ id: c.id, type: 'function', function: { name: c.name, arguments: JSON.stringify(c.args) } })) } }] }) }
  } }
}
const base = () => ({ connection: { provider: 'builtin' as const, model: 'test' }, system: 'Prompt système', history: [],
  draft: createDraft(createProject('Test'), DEFAULT_SHEET_ID), ctx })
const toolNames = (body: string) => JSON.parse(body).tools.map((t: { function: { name: string } }) => t.function.name)

describe('boucle de l’assistant : liste d’outils stable', () => {
  it('envoie les mêmes outils et le même prompt à chaque étape, sans outil forcé', async () => {
    const sent: string[] = []
    const result = await runTurn({ ...base(), userText: 'Sonorise une conférence : trois micros, une console, deux enceintes.',
      transport: transport([{ calls: [call('search_library', { query: 'console' })] }, { calls: [call('plan_diagram', plan)] }, { calls: [call('propose_system', system)] }], sent) })
    expect(sent).toHaveLength(3)
    for (const body of sent) {
      expect(toolNames(body)).toEqual(TOOL_SPECS.map(t => t.name))
      expect(JSON.parse(body).messages[0]).toEqual({ role: 'system', content: 'Prompt système' })
      expect(JSON.parse(body).tool_choice).toBeUndefined()
    }
    expect(result.toolsUsed).toEqual(['search_library', 'plan_diagram', 'propose_system', 'check_project'])
    expect(result.draft.addedLinks).toHaveLength(5)
  })
  it('ne propose que la documentation pour une question d’usage et refuse un autre outil', async () => {
    const sent: string[] = []
    const result = await runTurn({ ...base(), userText: 'Comment ajouter une feuille ?',
      transport: transport([{ calls: [call('add_equipment', { template_id: 'gen-mic-dyn' })] }, { text: '1. Clique sur « + »' }], sent) })
    expect(toolNames(sent[0])).toEqual(['search_documentation'])
    expect(sent[1]).toContain('Outil indisponible')
    expect(result.draft.addedEquipment).toEqual([])
  })
})

describe('boucle de l’assistant : précisions', () => {
  it('garde la demande initiale pour la réponse à une question', async () => {
    const first = await runTurn({ ...base(), userText: 'Je veux sonoriser une conférence.', transport: transport([{ calls: [ask] }]) })
    expect(first.reply).toBe(ask.args.question)
    expect(first.draft.addedEquipment).toEqual([])
    expect(first.history.at(-1)?.role).toBe('tool')
    const sent: string[] = []
    const second = await runTurn({ ...base(), history: first.history, userText: 'Trois intervenants, deux enceintes.',
      transport: transport([{ calls: [call('plan_diagram', plan)] }, { calls: [call('propose_system', system)] }], sent) })
    expect(JSON.parse(sent[0]).messages.at(-1).content).toBe('Je veux sonoriser une conférence.\nPrécisions : Trois intervenants, deux enceintes.')
    expect(second.draft.addedLinks).toHaveLength(5)
    expect(second.draft.brief?.request).toContain('Je veux sonoriser une conférence.')
  })
  it('ne conserve aucun ajout du tour quand le modèle demande une précision, même dans un lot mixte', async () => {
    const add = call('add_equipment', { template_id: 'gen-console' })
    const result = await runTurn({ ...base(), userText: 'Ajoute une console', transport: transport([{ calls: [add, ask] }]) })
    expect(result.draft.addedEquipment).toEqual([])
    expect(result.history.filter(m => m.role === 'assistant').flatMap(m => m.role === 'assistant' ? m.toolCalls : []).map(c => c.name)).toEqual(['ask_user'])
    expect(JSON.parse(runTool(base().draft, { ...ask, args: { question: '' } }, ctx).content).error).toBeTruthy()
  })
  it('demande une fiche documentée au lieu de construire avec une référence sans connectique', async () => {
    // COS-11 en attente de connectique : cas d'une référence imposée non documentée
    const pendingCtx = { ...ctx, library: LIBRARY.map(t => t.id === 'sanken-cos-11' ? { ...t, ports: [], portStatus: 'pending' as const } : t) }
    const draft = base().draft
    const result = await runTurn({ ...base(), draft, ctx: pendingCtx, userText: 'Une console CL5 avec trois micros Sanken COS-11.',
      transport: transport([{ calls: [call('plan_diagram', { ...plan, roles: [role('desk', 'Yamaha CL5', 'console', 1, true), role('lav', 'Sanken COS-11', 'capture', 3, true)] })] }]) })
    expect(result.toolsUsed).toEqual(['plan_diagram'])
    expect(result.reply).toContain('COS-11')
    expect(result.draft).toBe(draft)
  })
})

describe('boucle de l’assistant : garde-fous', () => {
  it('refuse un appel identique répété sur le même brouillon, puis termine par la question', async () => {
    const read = call('get_template', { template_id: 'gen-console' })
    const sent: string[] = []
    const result = await runTurn({ ...base(), userText: 'Quelles sorties a la console ?', transport: transport([{ calls: [read] }, { calls: [read] }, { calls: [ask] }], sent) })
    expect(sent[1]).not.toContain('Appel identique')
    expect(sent[2]).toContain('Appel identique')
    expect(result.reply).toBe(ask.args.question)
  })
  it('un appel identique déjà refusé rappelle l’erreur, sans proposer de question après le tour de précision', async () => {
    const wrong = call('get_template', { template_id: 'inexistant' })
    const first = await runTurn({ ...base(), userText: 'Quelles sorties a la console ?', transport: transport([{ calls: [ask] }]) })
    const sent: string[] = []
    await runTurn({ ...base(), history: first.history, userText: 'Celle du projet.', transport: transport([{ calls: [wrong] }, { calls: [wrong] }, { text: 'Je ne trouve pas cette fiche.' }], sent) }).catch(() => undefined)
    const repeated = JSON.parse(sent[2]).messages.at(-1).content
    expect(repeated).toContain('refusé ainsi')
    expect(repeated).not.toContain('ask_user')
  })
  it('relance un plan jamais construit, puis abandonne sans rien ajouter', async () => {
    const sent: string[] = []
    const run = runTurn({ ...base(), userText: 'Sonorise une conférence.', transport: transport([
      { calls: [call('plan_diagram', plan)] }, ...Array.from({ length: 3 }, () => ({ text: 'Je vais ajouter les micros.' })),
    ], sent) })
    await expect(run).rejects.toMatchObject({ kind: 'incomplete' })
    expect(sent).toHaveLength(4)
    expect(sent[2]).toContain('Le plan est prêt')
  })
  it('refuse plus de huit appels dans une seule réponse', async () => {
    const calls = Array.from({ length: 9 }, (_, i) => call('search_library', { query: 'micro ' + i }))
    await expect(runTurn({ ...base(), userText: 'Cherche des micros', transport: transport([{ calls }]) })).rejects.toMatchObject({ kind: 'format' })
  })
  it('s’arrête dès que la conversation est annulée', async () => {
    let active = true
    const stop: Transport = { async request() {
      active = false
      return { status: 200, body: JSON.stringify({ choices: [{ message: { content: 'Trop tard' } }] }) }
    } }
    await expect(runTurn({ ...base(), userText: 'Bonjour', transport: stop, isActive: () => active })).rejects.toMatchObject({ kind: 'cancelled' })
  })
  it('ne prend pas une désignation de format vidéo pour une référence imposée', () => {
    const monitor = LIBRARY.find(t => t.family === 'display' && t.status === 'verified')!
    expect(referenceScore({ ...monitor, model: 'Mini Converter Optical Fiber 12G', aliases: [] }, 'Video Assist 7 12G HDR')).toBe(0)
  })
})
