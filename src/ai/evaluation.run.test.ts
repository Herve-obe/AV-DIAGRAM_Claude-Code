// Lanceur de la batterie d'évaluation (docs/ia/evaluation). Ignoré par « npm test » : il appelle un vrai modèle.
// Chaque cas est joué sur un projet vide ; une question de l'assistant reçoit une réponse type, puis le schéma est noté.
//
// IA locale (serveur lancé par scripts/test-local-ai.py) :
//   AVD_EVAL=1 AVD_LOCAL_AI_TEST_URL=http://127.0.0.1:PORT/v1 AVD_LOCAL_AI_TEST_TOKEN=... npx vitest run src/ai/evaluation.run.test.ts
// IA personnelle (facturée par le fournisseur : à lancer en connaissance de cause) :
//   AVD_EVAL=1 AVD_EVAL_PROVIDER=anthropic AVD_EVAL_MODEL=claude-sonnet-5-5 AVD_EVAL_KEY=... npx vitest run src/ai/evaluation.run.test.ts
// Options : AVD_EVAL_CASES=id1,id2 (sous-ensemble), AVD_EVAL_RUNS=3 (répétitions), AVD_EVAL_OUT=fichier.json.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { request as httpRequest } from 'node:http'
import { request as httpsRequest } from 'node:https'
import { describe, expect, it } from 'vitest'
import { LIBRARY } from '../library'
import { createProject, DEFAULT_SHEET_ID } from '../model/project'
import { checkProject } from '../model/rules'
import { AiError, buildSystemPrompt, runTurn, type Transport } from './agent'
import { gradeCase, overallScore, type CaseGrade, type EvalCase } from './evaluation'
import { providerInfo, type ProviderId } from './providers'
import { createDraft } from './tools'

const env = process.env
const provider = (env.AVD_EVAL_PROVIDER ?? 'builtin') as ProviderId
const local = provider === 'builtin'
const baseUrl = local ? env.AVD_LOCAL_AI_TEST_URL : env.AVD_EVAL_BASEURL ?? {
  anthropic: 'https://api.anthropic.com/v1', openai: 'https://api.openai.com/v1', mistral: 'https://api.mistral.ai/v1',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/openai',
}[provider as string]
const key = local ? env.AVD_LOCAL_AI_TEST_TOKEN : env.AVD_EVAL_KEY
const model = env.AVD_EVAL_MODEL ?? (local ? 'qwen3-4b' : '')
const enabled = env.AVD_EVAL === '1' && !!baseUrl && !!key && !!model

// Transport de test : mêmes chemins que src-tauri/src/ai.rs, sans passer par l'application.
// node:http(s) plutôt que fetch : fetch de Node coupe une réponse dont les en-têtes tardent plus de cinq minutes.
const transport: Transport = { request(_p, _b, req) {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (provider === 'anthropic') { headers['x-api-key'] = key!; headers['anthropic-version'] = '2023-06-01' }
  else headers.authorization = 'Bearer ' + key
  const url = new URL(baseUrl + req.path)
  const send = url.protocol === 'https:' ? httpsRequest : httpRequest
  return new Promise((resolve, reject) => {
    const r = send(url, { method: req.method, headers }, res => {
      const chunks: Buffer[] = []
      res.on('data', c => chunks.push(Buffer.from(c)))
      res.on('end', () => resolve({ status: res.statusCode ?? 500, body: Buffer.concat(chunks).toString('utf8') }))
      res.on('error', reject)
    })
    r.setTimeout(1_200_000, () => r.destroy(new Error('délai de réponse dépassé (20 minutes)')))
    r.on('error', reject)
    r.end(req.body)
  })
} }

const dir = new URL('../../docs/ia/evaluation/cas/', import.meta.url)
const wanted = env.AVD_EVAL_CASES?.split(',').map(s => s.trim())
const cases: EvalCase[] = readdirSync(dir).filter(f => f.endsWith('.json')).map(f => JSON.parse(readFileSync(new URL(f, dir), 'utf8')))
  .filter((c: EvalCase) => !wanted || wanted.includes(c.id))
const FOLLOW_UP = 'Fais des hypothèses raisonnables, annonce-les, et propose le schéma complet.'

describe.skipIf(!enabled)(`batterie d'évaluation : ${provider} ${model}`, () => {
  it('joue chaque cas et enregistre les notes', async () => {
    const runs = Number(env.AVD_EVAL_RUNS ?? 1)
    const results: { id: string; difficulte: EvalCase['difficulte']; run: number; grade: CaseGrade; questions: string[]; reply: string; ruleErrors: number; error?: string }[] = []
    const out = env.AVD_EVAL_OUT ?? new URL(`../../docs/ia/evaluation/resultats/${new Date().toISOString().slice(0, 10)}-${provider}-${model.replace(/[^\w.-]/g, '_')}.json`, import.meta.url).pathname
    mkdirSync(out.replace(/[^/]+$/, ''), { recursive: true })
    // Écriture après chaque cas : une batterie interrompue garde ses premiers résultats
    const save = () => writeFileSync(out, JSON.stringify({ provider, model, date: new Date().toISOString(), global: overallScore(results.map(r => ({ grade: r.grade, difficulte: r.difficulte }))), results }, null, 1))
    for (const c of cases) for (let run = 1; run <= runs; run++) {
      const project = createProject(c.titre)
      const system = buildSystemPrompt({ lang: 'fr', mode: 'expert', projectName: c.titre, sheetName: 'Feuille 1',
        knowledge: providerInfo(provider).kind === 'local' ? 'essential' : 'full' })
      const ctx = { library: LIBRARY, describe: (i: { code: string }) => i.code, lang: 'fr' as const }
      const connection = { provider, baseUrl, model }
      const questions: string[] = []
      try {
        let res = await runTurn({ transport, connection, system, history: [], userText: c.demande, draft: createDraft(project, DEFAULT_SHEET_ID), ctx })
        // L'assistant a posé une question : une seule relance avec une réponse type
        if (!res.draft.addedEquipment.length && (res.toolsUsed.includes('ask_user') || /\?\s*$/.test(res.reply.trim()))) {
          questions.push(res.reply)
          res = await runTurn({ transport, connection, system, history: res.history, userText: FOLLOW_UP, draft: res.draft, ctx })
        }
        const produced = res.draft.project
        results.push({ id: c.id, difficulte: c.difficulte, run, grade: gradeCase(c, produced), questions, reply: res.reply,
          ruleErrors: checkProject(produced).filter(i => i.severity === 'error').length })
      } catch (e) {
        results.push({ id: c.id, difficulte: c.difficulte, run, grade: { id: c.id, automatic: [], forJudge: c.exigences, score: 0 }, questions, reply: '', ruleErrors: 0, error: e instanceof AiError ? `${e.kind}${e.message ? ' : ' + e.message : ''}` : String(e) })
      }
      save()
    }
    expect(results.length).toBe(cases.length * runs)
  }, 6 * 60 * 60_000)
})
