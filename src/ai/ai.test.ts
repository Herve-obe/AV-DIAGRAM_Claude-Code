import { describe, expect, it } from 'vitest'
import { GENERIC_LIBRARY } from '../library/generic'
import { createProject, DEFAULT_SHEET_ID } from '../model/project'
import { AiError, listModels, runTurn, type Transport } from './agent'
import { buildChatRequest, checkKeyShape, classifyError, parseChatResponse, parseModelList, pickRecommended, type ApiRequest } from './providers'
import { createDraft, hasChanges, runTool, searchLibrary, TOOL_SPECS } from './tools'

const ctx = { library: GENERIC_LIBRARY, describe: (i: { code: string }) => i.code }

/** Faux transport : renvoie les réponses prévues dans l'ordre et garde les requêtes reçues. */
function fakeTransport(replies: { status?: number; body: unknown }[]): Transport & { sent: ApiRequest[] } {
  const sent: ApiRequest[] = []
  return {
    sent,
    async request(_p, _b, req) {
      sent.push(req)
      const r = replies.shift()
      if (!r) throw new Error('plus de réponse prévue')
      return { status: r.status ?? 200, body: JSON.stringify(r.body) }
    },
  }
}

const openaiToolCall = (id: string, name: string, args: unknown) => ({
  choices: [{ message: { content: null, tool_calls: [{ id, type: 'function', function: { name, arguments: JSON.stringify(args) } }] } }],
})
const openaiText = (text: string) => ({ choices: [{ message: { content: text } }] })

describe('assistant : formats des fournisseurs', () => {
  it('construit une requête Anthropic avec outils et résultats', () => {
    const req = buildChatRequest('anthropic', 'm', 'sys', [
      { role: 'user', text: 'bonjour' },
      { role: 'assistant', text: '', toolCalls: [{ id: 't1', name: 'get_project', args: {} }] },
      { role: 'tool', results: [{ id: 't1', name: 'get_project', content: '{}' }] },
    ], TOOL_SPECS)
    expect(req.path).toBe('/messages')
    const body = JSON.parse(req.body!)
    expect(body.system).toBe('sys')
    expect(body.tools[0].input_schema).toBeTruthy()
    expect(body.messages[1].content[0]).toMatchObject({ type: 'tool_use', id: 't1' })
    expect(body.messages[2].content[0]).toMatchObject({ type: 'tool_result', tool_use_id: 't1' })
  })

  it('construit une requête OpenAI et lit ses appels d\'outils', () => {
    const req = buildChatRequest('openai', 'm', 'sys', [{ role: 'user', text: 'x' }], TOOL_SPECS)
    const body = JSON.parse(req.body!)
    expect(req.path).toBe('/chat/completions')
    expect(body.messages[0]).toEqual({ role: 'system', content: 'sys' })
    expect(body.tools[0].type).toBe('function')
    const r = parseChatResponse('openai', JSON.stringify(openaiToolCall('c1', 'search_library', { query: 'console' })))
    expect(r.toolCalls).toEqual([{ id: 'c1', name: 'search_library', args: { query: 'console' } }])
  })

  it('lit une réponse Anthropic mêlant texte et outil', () => {
    const r = parseChatResponse('anthropic', JSON.stringify({ content: [{ type: 'text', text: 'Je cherche.' }, { type: 'tool_use', id: 'a', name: 'get_project', input: {} }] }))
    expect(r.text).toBe('Je cherche.')
    expect(r.toolCalls[0].name).toBe('get_project')
  })

  it('liste les modèles et présélectionne le modèle recommandé', () => {
    expect(parseModelList(JSON.stringify({ data: [{ id: 'b' }, { id: 'models/a' }] }))).toEqual(['a', 'b'])
    expect(pickRecommended('anthropic', ['x-haiku', 'x-sonnet'])).toBe('x-sonnet')
    expect(pickRecommended('ollama', ['m1', 'm2'])).toBe('m1')
  })

  it('classe les erreurs et vérifie la forme des clés', () => {
    expect(classifyError(401, '{}')).toBe('auth')
    expect(classifyError(400, '{"error":{"message":"Your credit balance is too low"}}')).toBe('billing')
    expect(classifyError(429, '{"error":{"code":"insufficient_quota"}}')).toBe('quota')
    expect(classifyError(429, '{}')).toBe('rate')
    expect(checkKeyShape('anthropic', 'sk-ant-abc')).toBe('ok')
    expect(checkKeyShape('anthropic', 'sk-abc')).toBe('prefix')
    expect(checkKeyShape('mistral', ' ab c')).toBe('spaces')
    expect(checkKeyShape('openai', '')).toBe('empty')
  })
})

describe('assistant : outils', () => {
  it('cherche dans la bibliothèque sans tenir compte des accents', () => {
    const r = searchLibrary(GENERIC_LIBRARY, 'micro statique')
    expect(r[0].template_id).toBe('gen-mic-cond')
  })

  it('pose et relie sur un brouillon, sans toucher au projet', () => {
    const base = createProject('t')
    let d = createDraft(base, DEFAULT_SHEET_ID)
    const add = (id: string) => {
      const r = runTool(d, { id: 'x', name: 'add_equipment', args: { template_id: id } }, ctx)
      d = r.draft
      return JSON.parse(r.content).equipment_id as string
    }
    const mic = add('gen-mic-dyn')
    const desk = add('gen-console')
    const r = runTool(d, { id: 'y', name: 'connect_ports', args: { from_equipment_id: mic, from_port_id: 'p1', to_equipment_id: desk, to_port_id: 'p1' } }, ctx)
    d = r.draft
    expect(JSON.parse(r.content).label).toBeTruthy()
    expect(d.addedLinks).toHaveLength(1)
    expect(hasChanges(d)).toBe(true)
    expect(Object.keys(base.equipment)).toHaveLength(0)
    expect(d.project.equipment[desk].position.y).toBeGreaterThan(d.project.equipment[mic].position.y)
  })

  it('refuse un modèle ou un port inconnu, avec un message exploitable', () => {
    const d = createDraft(createProject('t'), DEFAULT_SHEET_ID)
    const r = runTool(d, { id: 'x', name: 'add_equipment', args: { template_id: 'invente' } }, ctx)
    expect(JSON.parse(r.content).error).toMatch(/search_library/)
    expect(r.draft).toBe(d)
  })
})

describe('assistant : boucle', () => {
  it('enchaîne outils et réponse finale (format OpenAI)', async () => {
    const t = fakeTransport([
      { body: openaiToolCall('1', 'add_equipment', { template_id: 'gen-mic-cond', name: 'Voix' }) },
      { body: openaiToolCall('2', 'check_project', {}) },
      { body: openaiText('Micro proposé.') },
    ])
    const tools: string[] = []
    const res = await runTurn({
      transport: t,
      connection: { provider: 'ollama', baseUrl: 'http://localhost:11434/v1', model: 'm' },
      system: 's',
      history: [],
      userText: 'Ajoute un micro statique',
      draft: createDraft(createProject('t'), DEFAULT_SHEET_ID),
      ctx,
      onTool: (n) => tools.push(n),
    })
    expect(res.reply).toBe('Micro proposé.')
    expect(tools).toEqual(['add_equipment', 'check_project'])
    expect(Object.values(res.draft.project.equipment)[0].name).toBe('Voix')
    // user, assistant+outil, résultat, assistant+outil, résultat, réponse
    expect(res.history).toHaveLength(6)
    expect(JSON.parse(t.sent[1].body!).messages.at(-1).role).toBe('tool')
  })

  it('traduit une erreur HTTP en erreur classée', async () => {
    const t = fakeTransport([{ status: 401, body: { error: { message: 'invalid x-api-key' } } }])
    await expect(listModels(t, 'anthropic')).rejects.toMatchObject({ kind: 'auth', message: 'invalid x-api-key' })
  })

  it('s\'arrête après un nombre maximal d\'étapes', async () => {
    const t = fakeTransport(Array.from({ length: 3 }, (_, i) => ({ body: openaiToolCall(String(i), 'get_project', {}) })))
    const run = runTurn({
      transport: t,
      connection: { provider: 'ollama', model: 'm' },
      system: 's',
      history: [],
      userText: 'x',
      draft: createDraft(createProject('t'), DEFAULT_SHEET_ID),
      ctx,
      maxSteps: 3,
    })
    await expect(run).rejects.toBeInstanceOf(AiError)
  })
})

describe('assistant : serveur local géré', () => {
  it('déduit le port de l\'adresse du serveur', async () => {
    const { portOf } = await import('./local')
    expect(portOf('http://localhost:8081/v1')).toBe(8081)
    expect(portOf('http://localhost/v1')).toBe(8080)
    expect(portOf(undefined)).toBe(8080)
  })
})
