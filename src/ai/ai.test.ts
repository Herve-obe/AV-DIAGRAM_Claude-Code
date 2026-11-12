import { describe, expect, it } from 'vitest'
import { LIBRARY } from '../library'
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
  it('borne une clarification et exige le bon outil sans changer les autres requêtes', () => {
    const options = { requiredTool: 'ask_user', maxTokens: 512 }
    const openai = JSON.parse(buildChatRequest('openai', 'test', '', [], TOOL_SPECS, 'openai', options).body!)
    expect(openai.max_completion_tokens).toBe(512)
    expect(openai.tool_choice).toBe('required')
    expect(openai.tools.map((t: { function: { name: string } }) => t.function.name)).toEqual(['ask_user'])
    const anthropic = JSON.parse(buildChatRequest('anthropic', 'test', '', [], TOOL_SPECS, 'anthropic', options).body!)
    // Claude actuel refuse l'outil forcé : seul l'outil requis est proposé, et la consigne le nomme
    expect(anthropic.max_tokens).toBe(16000)
    expect(anthropic.tool_choice).toBeUndefined()
    expect(anthropic.tools.map((t: { name: string }) => t.name)).toEqual(['ask_user'])
    expect(anthropic.system).toContain("l'outil ask_user")
    expect(() => buildChatRequest('openai', 'test', '', [], [], 'builtin', options)).toThrow('Outil requis indisponible')
  })
  it('utilise la limite de sortie actuelle chez OpenAI sans changer les API compatibles', () => {
    const request = (provider: 'openai' | 'mistral') => JSON.parse(buildChatRequest('openai', 'test', 'sys', [], [], provider).body!)
    expect(request('openai').max_completion_tokens).toBe(2048)
    expect(request('openai').max_tokens).toBeUndefined()
    expect(request('mistral').max_tokens).toBe(2048)
  })
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
    expect(pickRecommended('anthropic', ['claude-3-7-sonnet-20250219', 'claude-haiku-5-5', 'claude-sonnet-4-6', 'claude-sonnet-5', 'claude-sonnet-5-5'])).toBe('claude-sonnet-5-5')
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

  it('ignore les mots vides et fait passer le nom avant la description', () => {
    const capture = LIBRARY.filter(t => t.family === 'capture')
    const ids = searchLibrary(capture, 'micro dynamique avec pied de table', 5).map(r => r.template_id)
    expect(ids[0]).toBe('gen-mic-dyn')
    // Micro serre-tête statique dont la description cite la « plage dynamique »
    expect(ids).not.toContain('dpa-4088')
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

describe('assistant : limites de l’IA locale', () => {
  it('juge complexe une demande de plus de 1 500 caractères ou de plus de 5 contraintes', async () => {
    const { countConstraints, isComplexForLocal } = await import('./limits')
    expect(isComplexForLocal('Ajoute une DI sur la console.')).toBe(false)
    expect(isComplexForLocal('Sonorisation de salle. '.repeat(70))).toBe(true)
    const brief = [
      'Il faut 8 micros HF.', 'Les retours doivent être séparés pour chaque musicien.', 'Pas de micros dans les enceintes de façade.',
      'Le réseau Dante doit être redondant.', 'Uniquement du matériel Yamaha pour les consoles.', 'Au moins deux enregistreurs.',
    ].join('\n')
    expect(countConstraints(brief)).toBe(6)
    expect(isComplexForLocal(brief)).toBe(true)
    expect(isComplexForLocal(brief.split('\n').slice(0, 5).join('\n'))).toBe(false)
  })
})

describe('assistant : connaissance métier', () => {
  it('envoie l’essentiel à l’IA locale et le document complet à l’IA personnelle', async () => {
    const { buildSystemPrompt, metierEssential } = await import('./agent')
    const base = { lang: 'fr' as const, mode: 'expert' as const, projectName: 'P', sheetName: 'F' }
    const essential = metierEssential()
    expect(essential).toContain('+4 dBu')
    expect(essential).toContain('mix-minus')
    expect(essential.length).toBeLessThan(2500)
    const local = buildSystemPrompt({ ...base, knowledge: 'essential' })
    const full = buildSystemPrompt({ ...base, knowledge: 'full' })
    expect(local).toContain(essential)
    expect(local).not.toContain('## 12. Lumière')
    expect(full).toContain('## 12. Lumière (DMX et réseau)')
    expect(full.length).toBeGreaterThan(local.length + 5000)
  })
})

describe('assistant : questions d’usage du logiciel', () => {
  it('répond à « comment ajouter une zone » avec la fiche de procédure, sans outil de construction ni ajout', async () => {
    const t = fakeTransport([{ body: openaiText('1. Clique sur « Zone »…') }])
    const res = await runTurn({
      transport: t, connection: { provider: 'builtin', model: 'qwen3-4b' }, system: 's', history: [],
      userText: 'Comment je fais pour ajouter une zone ?', draft: createDraft(createProject('t'), DEFAULT_SHEET_ID), ctx,
    })
    const body = JSON.parse(t.sent[0].body!)
    expect(body.tools.map((x: { function: { name: string } }) => x.function.name)).toEqual(['search_documentation'])
    expect(body.messages[0].content).toContain('Procédure AV Diagram, Créer une zone')
    expect(body.messages[0].content).toContain('Question d’usage du logiciel')
    expect(res.draft.addedEquipment).toEqual([])
    expect(res.reply).toContain('Zone')
  })
})
