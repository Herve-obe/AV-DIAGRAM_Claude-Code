// Fournisseurs d'IA et formats d'échange (cahier des charges, section 12.5).
// Deux formats suffisent : l'API Messages d'Anthropic, et l'API « chat completions » d'OpenAI,
// que reprennent Gemini (point d'accès compatible), Mistral, Ollama, LM Studio et le serveur llama.cpp.
// Ce module est pur : il construit les requêtes et lit les réponses, sans accès réseau.

export type ProviderId = 'anthropic' | 'openai' | 'gemini' | 'mistral' | 'compatible' | 'ollama' | 'lmstudio' | 'llamacpp'
export type ApiFormat = 'anthropic' | 'openai'

export interface ProviderInfo {
  id: ProviderId
  /** Nom affiché (marque du fournisseur ou du logiciel) */
  label: string
  api: ApiFormat
  /** Option A (serveur sur l'ordinateur) ou option B (compte en ligne) */
  kind: 'local' | 'account'
  /** Adresse par défaut, modifiable pour les serveurs locaux et « compatible OpenAI » */
  defaultBaseUrl?: string
  /** Page de la console où créer une clé API */
  keyUrl?: string
  /** Préfixe attendu de la clé, pour une vérification de forme (indicative) */
  keyPrefix?: string
  /** Mot à rechercher dans la liste des modèles pour présélectionner un modèle recommandé */
  recommend?: string
}

// Adresses et pages de console relevées le 2026-09-25, à revérifier à chaque version (section 12.6).
export const PROVIDERS: ProviderInfo[] = [
  { id: 'anthropic', label: 'Claude (Anthropic)', api: 'anthropic', kind: 'account', keyUrl: 'https://console.anthropic.com/settings/keys', keyPrefix: 'sk-ant-', recommend: 'sonnet' },
  { id: 'openai', label: 'ChatGPT (OpenAI)', api: 'openai', kind: 'account', keyUrl: 'https://platform.openai.com/api-keys', keyPrefix: 'sk-' },
  { id: 'gemini', label: 'Gemini (Google)', api: 'openai', kind: 'account', keyUrl: 'https://aistudio.google.com/apikey', keyPrefix: 'AIza' },
  { id: 'mistral', label: 'Mistral', api: 'openai', kind: 'account', keyUrl: 'https://console.mistral.ai/api-keys' },
  { id: 'compatible', label: 'Autre (compatible OpenAI)', api: 'openai', kind: 'account', defaultBaseUrl: 'https://' },
  { id: 'ollama', label: 'Ollama', api: 'openai', kind: 'local', defaultBaseUrl: 'http://localhost:11434/v1' },
  { id: 'lmstudio', label: 'LM Studio', api: 'openai', kind: 'local', defaultBaseUrl: 'http://localhost:1234/v1' },
  { id: 'llamacpp', label: 'llama.cpp (llama-server)', api: 'openai', kind: 'local', defaultBaseUrl: 'http://localhost:8080/v1' },
]

export const providerInfo = (id: ProviderId): ProviderInfo => PROVIDERS.find((p) => p.id === id) ?? PROVIDERS[0]

/** Vérification de forme d'une clé : vide, espaces, préfixe inattendu. */
export function checkKeyShape(id: ProviderId, key: string): 'ok' | 'empty' | 'spaces' | 'prefix' {
  const k = key.trim()
  if (!k) return 'empty'
  if (/\s/.test(k)) return 'spaces'
  const prefix = providerInfo(id).keyPrefix
  if (prefix && !k.startsWith(prefix)) return 'prefix'
  return 'ok'
}

// ---------- Conversation, dans un format neutre ----------

export interface ToolCall {
  id: string
  name: string
  args: Record<string, unknown>
}

export type ChatMessage =
  | { role: 'user'; text: string }
  | { role: 'assistant'; text: string; toolCalls: ToolCall[] }
  | { role: 'tool'; results: { id: string; name: string; content: string }[] }

export interface ToolSpec {
  name: string
  description: string
  /** Schéma JSON des paramètres */
  parameters: Record<string, unknown>
}

export interface ApiRequest {
  method: 'GET' | 'POST'
  path: '/messages' | '/chat/completions' | '/models'
  body?: string
}

export interface ModelReply {
  text: string
  toolCalls: ToolCall[]
}

const MAX_TOKENS = 2048

export function buildChatRequest(api: ApiFormat, model: string, system: string, messages: ChatMessage[], tools: ToolSpec[]): ApiRequest {
  if (api === 'anthropic') {
    const body = {
      model,
      max_tokens: MAX_TOKENS,
      system,
      ...(tools.length ? { tools: tools.map((t) => ({ name: t.name, description: t.description, input_schema: t.parameters })) } : {}),
      messages: messages.map((m) => {
        if (m.role === 'user') return { role: 'user', content: m.text }
        if (m.role === 'assistant') {
          const content: unknown[] = []
          if (m.text) content.push({ type: 'text', text: m.text })
          for (const c of m.toolCalls) content.push({ type: 'tool_use', id: c.id, name: c.name, input: c.args })
          return { role: 'assistant', content }
        }
        return { role: 'user', content: m.results.map((r) => ({ type: 'tool_result', tool_use_id: r.id, content: r.content })) }
      }),
    }
    return { method: 'POST', path: '/messages', body: JSON.stringify(body) }
  }
  const out: unknown[] = [{ role: 'system', content: system }]
  for (const m of messages) {
    if (m.role === 'user') out.push({ role: 'user', content: m.text })
    else if (m.role === 'assistant') {
      out.push({
        role: 'assistant',
        content: m.text || null,
        ...(m.toolCalls.length
          ? { tool_calls: m.toolCalls.map((c) => ({ id: c.id, type: 'function', function: { name: c.name, arguments: JSON.stringify(c.args) } })) }
          : {}),
      })
    } else for (const r of m.results) out.push({ role: 'tool', tool_call_id: r.id, content: r.content })
  }
  const body = {
    model,
    max_tokens: MAX_TOKENS,
    messages: out,
    // Pas de liste d'outils vide : certains serveurs compatibles la refusent
    ...(tools.length ? { tools: tools.map((t) => ({ type: 'function', function: { name: t.name, description: t.description, parameters: t.parameters } })) } : {}),
  }
  return { method: 'POST', path: '/chat/completions', body: JSON.stringify(body) }
}

function parseArgs(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === 'object') return raw as Record<string, unknown>
  if (typeof raw === 'string') {
    try {
      const v = JSON.parse(raw)
      return v && typeof v === 'object' ? v : {}
    } catch {
      return {}
    }
  }
  return {}
}

/** Lit la réponse d'un modèle. Lève une erreur si le corps n'a pas la forme attendue. */
export function parseChatResponse(api: ApiFormat, body: string): ModelReply {
  const data = JSON.parse(body)
  if (api === 'anthropic') {
    if (!Array.isArray(data?.content)) throw new Error('réponse inattendue')
    const text = data.content.filter((b: { type: string }) => b.type === 'text').map((b: { text: string }) => b.text).join('\n')
    const toolCalls = data.content
      .filter((b: { type: string }) => b.type === 'tool_use')
      .map((b: { id: string; name: string; input: unknown }) => ({ id: b.id, name: b.name, args: parseArgs(b.input) }))
    return { text, toolCalls }
  }
  const msg = data?.choices?.[0]?.message
  if (!msg) throw new Error('réponse inattendue')
  const toolCalls = (msg.tool_calls ?? []).map((c: { id?: string; function: { name: string; arguments: unknown } }, i: number) => ({
    id: c.id || `call_${i}`,
    name: c.function.name,
    args: parseArgs(c.function.arguments),
  }))
  return { text: typeof msg.content === 'string' ? msg.content : '', toolCalls }
}

/** Identifiants des modèles proposés par le fournisseur (GET /models, même forme chez tous). */
export function parseModelList(body: string): string[] {
  const data = JSON.parse(body)
  const list: { id?: string }[] = Array.isArray(data?.data) ? data.data : Array.isArray(data?.models) ? data.models : []
  return list.map((m) => (m.id ?? '').replace(/^models\//, '')).filter(Boolean).sort()
}

/** Modèle présélectionné : celui qui contient le mot recommandé, sinon le premier. */
export function pickRecommended(id: ProviderId, models: string[]): string | undefined {
  const word = providerInfo(id).recommend
  return (word && models.find((m) => m.includes(word))) || models[0]
}

export type ApiErrorKind = 'auth' | 'billing' | 'quota' | 'rate' | 'model' | 'server' | 'other'

/** Classe une erreur HTTP pour afficher un message clair (section 12.2, étape 4). */
export function classifyError(status: number, body: string): ApiErrorKind {
  const b = body.toLowerCase()
  if (b.includes('credit balance') || b.includes('billing') || b.includes('payment')) return 'billing'
  if (b.includes('insufficient_quota') || b.includes('quota')) return 'quota'
  if (status === 401 || status === 403) return 'auth'
  if (status === 402) return 'billing'
  if (status === 429) return 'rate'
  if (status === 404) return 'model'
  if (status >= 500) return 'server'
  return 'other'
}

/** Message d'erreur du fournisseur, s'il en donne un. */
export function errorMessage(body: string): string {
  try {
    const d = JSON.parse(body)
    const m = d?.error?.message ?? d?.error ?? d?.message
    return typeof m === 'string' ? m : ''
  } catch {
    return body.slice(0, 200)
  }
}
