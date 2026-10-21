// Vérification commune : seuls un projet fictif et des équipements génériques sont envoyés.
import { buildSystemPrompt, runTurn, type Connection } from './agent'
import { createDraft } from './tools'
import { nativeTransport } from './transport'
import { GENERIC_LIBRARY } from '../library/generic'
import { createProject, DEFAULT_SHEET_ID } from '../model/project'

export async function testAssistant(connection: Connection, lang: string): Promise<void> {
  const base = createProject('Test AV Diagram')
  const result = await runTurn({
    transport: nativeTransport, connection,
    system: buildSystemPrompt({ lang: lang === 'en' ? 'en' : 'fr', mode: 'expert', projectName: base.name, sheetName: 'Test' }),
    userText: 'Appelle obligatoirement l’outil check_project pour vérifier ce schéma vide, puis confirme en une phrase que la vérification est faite. Ne propose aucun équipement.',
    history: [], draft: createDraft(base, DEFAULT_SHEET_ID),
    ctx: { library: GENERIC_LIBRARY, describe: (issue) => issue.code }, maxSteps: 4,
  })
  if (!result.toolsUsed.includes('check_project')) throw 'tools'
}
