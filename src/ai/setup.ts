// Vérification commune : seuls un projet fictif et des équipements génériques sont envoyés.
import type { TFunction } from 'i18next'
import { AiError, send, type Connection } from './agent'
import { buildChatRequest, parseChatResponse, providerInfo } from './providers'
import { createDraft, runTool, TOOL_SPECS } from './tools'
import { nativeTransport } from './transport'
import { GENERIC_LIBRARY } from '../library/generic'
import { createProject, DEFAULT_SHEET_ID } from '../model/project'

export async function testAssistant(connection: Connection, lang: string): Promise<void> {
  const base = createProject('Test AV Diagram')
  const api = providerInfo(connection.provider).api
  // Un appel réel suffit : attendre une conclusion libre peut faire boucler le petit modèle.
  const body = await send(nativeTransport, connection.provider, connection.baseUrl, buildChatRequest(api, connection.model,
    lang === 'en' ? 'Call check_project once to check the empty test diagram. Do not add equipment.' : 'Appelle check_project une seule fois pour vérifier le schéma de test vide. Aucun ajout.',
    [{ role: 'user', text: lang === 'en' ? 'Check the test diagram.' : 'Vérifie le schéma de test.' }], TOOL_SPECS, connection.provider,
    { requiredTool: 'check_project', maxTokens: connection.provider === 'builtin' ? 128 : undefined }))
  let reply
  try { reply = parseChatResponse(api, body) } catch { throw new AiError('format', body.slice(0, 200)) }
  const call = reply.toolCalls[0]
  if (reply.toolCalls.length !== 1 || call.name !== 'check_project' || Object.keys(call.args).length) throw 'tools'
  runTool(createDraft(base, DEFAULT_SHEET_ID), call, { library: GENERIC_LIBRARY, describe: issue => issue.code })
}

/** Même diagnostic dans les parcours intégré, serveur local externe et compte API. */
export function assistantErrorText(t: TFunction, error: unknown): string {
  if (typeof error === 'string') {
    const known = t(`ai.local.error.${error}`, { defaultValue: '' })
    if (known) return known
  }
  const kind = error instanceof AiError ? error.kind : 'network'
  const detail = error instanceof Error ? error.message : typeof error === 'string' ? error : ''
  return `${t(`ai.error.${kind}`)}${detail ? ` (${detail})` : ''}`
}
