// Boucle de l'assistant : le modèle répond ou appelle des outils ; les résultats lui sont renvoyés
// jusqu'à une réponse finale. Le transport (réseau, via la partie native) est injecté, ce qui permet
// de tester la boucle sans réseau.
import {
  buildChatRequest,
  classifyError,
  errorMessage,
  parseChatResponse,
  parseModelList,
  providerInfo,
  type ApiErrorKind,
  type ApiRequest,
  type ChatMessage,
  type ProviderId,
} from './providers'
import { runTool, TOOL_SPECS, type Draft, type ToolContext } from './tools'

export interface Transport {
  request(provider: ProviderId, baseUrl: string | undefined, req: ApiRequest): Promise<{ status: number; body: string }>
}

export interface Connection {
  provider: ProviderId
  baseUrl?: string
  model: string
}

export type AiErrorKind = ApiErrorKind | 'network' | 'format' | 'steps'

export class AiError extends Error {
  kind: AiErrorKind
  constructor(kind: AiErrorKind, detail: string) {
    super(detail)
    this.kind = kind
  }
}

async function send(transport: Transport, provider: ProviderId, baseUrl: string | undefined, req: ApiRequest): Promise<string> {
  let res: { status: number; body: string }
  try {
    res = await transport.request(provider, baseUrl, req)
  } catch (e) {
    throw new AiError('network', e instanceof Error ? e.message : String(e))
  }
  if (res.status >= 400) throw new AiError(classifyError(res.status, res.body), errorMessage(res.body) || `HTTP ${res.status}`)
  return res.body
}

/** Liste des modèles : sert aussi de test de connexion (clé, facturation, serveur local joignable). */
export async function listModels(transport: Transport, provider: ProviderId, baseUrl?: string): Promise<string[]> {
  const body = await send(transport, provider, baseUrl, { method: 'GET', path: '/models' })
  try {
    return parseModelList(body)
  } catch {
    throw new AiError('format', body.slice(0, 200))
  }
}

export interface PromptContext {
  lang: 'fr' | 'en'
  mode: 'beginner' | 'expert'
  projectName: string
  sheetName: string
}

export function buildSystemPrompt(c: PromptContext): string {
  return [
    "Tu es l'assistant d'AV Diagram, logiciel de synoptiques d'installations audiovisuelles (son, vidéo, réseau, intercom).",
    `Projet ouvert : « ${c.projectName} ». Feuille affichée : « ${c.sheetName} ».`,
    c.lang === 'fr' ? 'Réponds en français, en tutoyant, de façon claire et concise.' : 'Answer in English, clearly and concisely.',
    c.mode === 'beginner'
      ? "L'utilisateur débute : explique le rôle de chaque liaison et les notions en une phrase simple."
      : "L'utilisateur est expérimenté : va à l'essentiel, vocabulaire technique.",
    'Règles impératives :',
    "- N'invente jamais un équipement ni une caractéristique (ports, niveaux, puissance). Utilise uniquement les outils : search_library et get_template pour la bibliothèque, get_project et get_equipment pour le schéma.",
    "- Si une information n'est ni dans la bibliothèque ni dans le schéma, dis que tu ne sais pas.",
    "- Quand tu cites une caractéristique d'un modèle, indique sa source (champ sources de get_template) ; une fiche au statut « generic » n'a pas de source constructeur.",
    '- Pour modifier le schéma, utilise add_equipment et connect_ports : ce sont des propositions que l\'utilisateur validera. Ne dis pas que c\'est fait, dis que c\'est proposé.',
    '- Après des propositions, lance check_project et signale les alertes du moteur de règles.',
    "- Ne supprime rien et ne modifie pas l'existant : tu ne peux qu'ajouter.",
    'Repères métier : niveau ligne professionnel +4 dBu (1,228 V eff.), grand public -10 dBV ; un micro statique demande le fantôme 48 V ; un flux numérique point à point (AES3, SDI) ne se dédouble pas sans distributeur.',
  ].join('\n')
}

export interface TurnResult {
  history: ChatMessage[]
  draft: Draft
  reply: string
  /** Noms des outils appelés pendant le tour, dans l'ordre */
  toolsUsed: string[]
}

/** Un tour de conversation : message de l'utilisateur, appels d'outils éventuels, réponse finale. */
export async function runTurn(opts: {
  transport: Transport
  connection: Connection
  system: string
  history: ChatMessage[]
  userText: string
  draft: Draft
  ctx: ToolContext
  maxSteps?: number
  onTool?: (name: string) => void
}): Promise<TurnResult> {
  const { transport, connection, system, ctx } = opts
  const api = providerInfo(connection.provider).api
  const history: ChatMessage[] = [...opts.history, { role: 'user', text: opts.userText }]
  let draft = opts.draft
  const toolsUsed: string[] = []
  for (let step = 0; step < (opts.maxSteps ?? 12); step++) {
    const body = await send(transport, connection.provider, connection.baseUrl, buildChatRequest(api, connection.model, system, history, TOOL_SPECS))
    let reply
    try {
      reply = parseChatResponse(api, body)
    } catch {
      throw new AiError('format', body.slice(0, 200))
    }
    history.push({ role: 'assistant', text: reply.text, toolCalls: reply.toolCalls })
    if (!reply.toolCalls.length) return { history, draft, reply: reply.text, toolsUsed }
    const results = reply.toolCalls.map((call) => {
      opts.onTool?.(call.name)
      toolsUsed.push(call.name)
      const r = runTool(draft, call, ctx)
      draft = r.draft
      return { id: call.id, name: call.name, content: r.content }
    })
    history.push({ role: 'tool', results })
  }
  throw new AiError('steps', '')
}

/** Dernière étape de la configuration : une question simple, sans outils, pour vérifier que le modèle répond. */
export async function testChat(transport: Transport, connection: Connection, question: string): Promise<string> {
  const api = providerInfo(connection.provider).api
  const body = await send(transport, connection.provider, connection.baseUrl, buildChatRequest(api, connection.model, 'Réponds en une phrase.', [{ role: 'user', text: question }], []))
  try {
    return parseChatResponse(api, body).text
  } catch {
    throw new AiError('format', body.slice(0, 200))
  }
}
