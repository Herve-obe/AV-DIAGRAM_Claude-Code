// Activé seulement par scripts/test-local-ai.py : vrai modèle, serveur éphémère sur le poste, projet fictif.
import { describe, expect, it } from 'vitest'
import { GENERIC_LIBRARY } from '../library/generic'
import { createProject, DEFAULT_SHEET_ID } from '../model/project'
import { buildSystemPrompt, runTurn, type Transport } from './agent'
import { createDraft } from './tools'

const address = process.env.AVD_LOCAL_AI_TEST_URL
const token = process.env.AVD_LOCAL_AI_TEST_TOKEN
const transport: Transport = { async request(provider, _base, req) {
  if (!address || !/^http:\/\/127\.0\.0\.1:\d+\/v1$/.test(address) || provider !== 'builtin') throw new Error('serveur de test local requis')
  const response = await fetch(address + req.path, { method: req.method, headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: req.body })
  return { status: response.status, body: await response.text() }
} }

describe.skipIf(!address)('IA locale réelle Qwen3 4B', () => {
  it('vérifie un projet fictif puis prépare un ajout sans modifier la source', async () => {
    const base = createProject('Essai IA locale')
    const system = buildSystemPrompt({ lang: 'fr', mode: 'expert', projectName: base.name, sheetName: 'Test' })
    const check = await runTurn({ transport, connection: { provider: 'builtin', model: 'qwen3-4b' }, system,
      history: [], userText: 'Appelle obligatoirement check_project pour vérifier le schéma vide. Aucun ajout. Confirme ensuite en une phrase.',
      draft: createDraft(base, DEFAULT_SHEET_ID), ctx: { library: GENERIC_LIBRARY, describe: (i) => i.code }, maxSteps: 5 })
    expect(check.toolsUsed).toContain('check_project')
    const add = await runTurn({ transport, connection: { provider: 'builtin', model: 'qwen3-4b' }, system,
      history: [], userText: 'Propose exactement un micro dynamique générique pour la voix. Cherche dans la bibliothèque, puis appelle add_equipment avec le modèle trouvé. Ne crée aucune liaison. Termine après avoir vérifié le projet.',
      draft: createDraft(base, DEFAULT_SHEET_ID), ctx: { library: GENERIC_LIBRARY, describe: (i) => i.code }, maxSteps: 8 })
    expect(add.toolsUsed).toContain('search_library')
    expect(add.toolsUsed).toContain('add_equipment')
    expect(add.draft.addedEquipment).toHaveLength(1)
    expect(Object.keys(base.equipment)).toHaveLength(0)
    expect(Object.values(add.draft.project.equipment)[0].templateId).toBe('gen-mic-dyn')
    expect(add.draft.addedLinks).toHaveLength(0)
    console.log(JSON.stringify({ model: 'qwen3-4b', check: check.toolsUsed, proposal: add.toolsUsed, reply: add.reply }))
  }, 600000)
})
