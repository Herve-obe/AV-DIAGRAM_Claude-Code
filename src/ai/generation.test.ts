import { describe, expect, it } from 'vitest'
import { LIBRARY } from '../library'
import { createProject, DEFAULT_SHEET_ID } from '../model/project'
import { requestedCounts, runTurn, type Transport } from './agent'
import { createDraft, referenceScore, runTool } from './tools'

const ctx = { library: LIBRARY, describe: (i: { code: string }) => i.code }
const short = 'Génère un plateau 5 caméras Panasonic P2 reliées à un Tricaster'
const full = 'Génère un plateau TV avec 5 caméra Panasonic P2 reliées à un mélangeur Tricaster. Une console audio CL5 sur laquelle sont reliés des micros Sanken cos11 en HF avec des Sennheiser EW112 G4. La sortie master de la console audio est envoyée au Tricaster'
const ask = { id: 'ask', name: 'ask_user', args: { question: 'Quel est le modèle exact des caméras Panasonic P2 ?' } }
const video = { id: 'video', name: 'propose_video_studio', args: { camera_template_id: 'panasonic-ag-hpx371e', camera_count: 5, video_switcher_template_id: 'newtek-tricaster-2-elite' } }
function transport(replies: { text?: string; calls?: { id: string; name: string; args: Record<string, unknown> }[] }[], sent: string[] = []): Transport {
  return { async request(_provider, _url, req) {
    sent.push(req.body!)
    const reply = replies.shift()
    if (!reply) throw new Error('aucune réponse prévue')
    return { status: 200, body: JSON.stringify({ choices: [{ message: { content: reply.text ?? '',
      tool_calls: (reply.calls ?? []).map(c => ({ id: c.id, type: 'function', function: { name: c.name, arguments: JSON.stringify(c.args) } })) } }] }) }
  } }
}
const base = () => ({ connection: { provider: 'builtin' as const, model: 'test' }, system: '', history: [],
  draft: createDraft(createProject('Test'), DEFAULT_SHEET_ID), ctx })

describe('demandes de génération naturelles et précisions', () => {
  it('reconnaît les quantités et les noms de mélangeurs sans exiger le mot vidéo', () => {
    expect(Object.fromEntries(requestedCounts(short, LIBRARY))).toEqual({ camera: 5, videoSwitcher: 1 })
    expect(Object.fromEntries(requestedCounts(full, LIBRARY))).toEqual({ camera: 5, console: 1, videoSwitcher: 1 })
    expect(Object.fromEntries(requestedCounts('2 micros et 2 ensembles HF', LIBRARY))).toEqual({ capture: 2, wireless: 2 })
    expect(requestedCounts('une console lumière', LIBRARY).has('console')).toBe(false)
    const special = { ...LIBRARY.find(t => t.id === 'newtek-tricaster-2-elite')!, model: 'Mix (X)+', aliases: [] }
    expect(requestedCounts('un Mix (X)+', [special]).get('videoSwitcher')).toBe(1)
  })
  it('refuse une simple annonce de recherche sans proposition, même avec reliées et sans le mot schéma', async () => {
    await expect(runTurn({ ...base(), userText: short, transport: transport(Array.from({ length: 3 }, () => ({ text: 'Je vais rechercher le TriCaster puis ajouter les caméras.' }))) })).rejects.toMatchObject({ kind: 'incomplete' })
  })
  it('prépare cinq caméras et cinq câbles, sans ajouter une console non demandée', async () => {
    const sent: string[] = []
    const result = await runTurn({ ...base(), userText: short, transport: transport([{ calls: [video] }, { text: 'Proposition prête.' }], sent) })
    expect(result.draft.addedEquipment).toHaveLength(6)
    expect(result.draft.addedLinks).toHaveLength(5)
    expect(Object.values(result.draft.project.equipment).filter(e => e.family === 'camera').every(e => e.templateId === 'panasonic-ag-hpx371e')).toBe(true)
    expect(Object.values(result.draft.project.equipment).some(e => e.family === 'console')).toBe(false)
    const tools = JSON.parse(sent[0]).tools.map((t: { function: { name: string } }) => t.function.name)
    expect(tools).toContain('propose_video_studio')
    expect(tools).not.toContain('propose_diagram')
    expect(JSON.parse(sent[0]).messages[0].content).toContain('panasonic-ag-hpx371e')
  })
  it('demande une précision et garde la demande initiale pour la réponse suivante', async () => {
    const first = await runTurn({ ...base(), userText: short, transport: transport([{ text: 'Je vais chercher.' }, { calls: [ask] }]) })
    expect(first.reply).toBe(ask.args.question)
    expect(first.draft.addedEquipment).toEqual([])
    expect(first.history.at(-1)?.role).toBe('tool')
    const second = await runTurn({ ...base(), history: first.history, userText: 'Ce sont des AG-HPX371E.', transport: transport([{ calls: [video] }, { text: 'Proposition prête.' }]) })
    expect(second.draft.addedEquipment).toHaveLength(6)
    expect(second.draft.addedLinks).toHaveLength(5)
  })
  it('conserve la partie microphones/HF de la demande au lieu de la traiter comme un plateau standard', async () => {
    const sent: string[] = []
    const result = await runTurn({ ...base(), userText: full, transport: transport([{ calls: [{ ...ask, args: { question: 'Combien de micros HF et quelle terminaison pour les COS-11 ? Leur connectique est à documenter.' } }] }], sent) })
    const request = JSON.parse(sent[0])
    expect(request.messages[0].content).toContain('sanken-cos-11')
    expect(request.messages[0].content).toContain('pending')
    const tools = request.tools.map((t: { function: { name: string } }) => t.function.name)
    expect(tools).toEqual(['ask_user'])
    expect(request.tool_choice).toBe('required')
    expect(request.max_tokens).toBe(512)
    expect(request.messages[0].content.length).toBeLessThan(3000)
    expect(result.draft.addedEquipment).toEqual([])
    expect(result.reply).toContain('COS-11')
  })
  it('ne conserve aucun ajout du tour quand le modèle demande une précision, même dans un lot mixte', async () => {
    const add = { id: 'add', name: 'add_equipment', args: { template_id: 'yamaha-cl5' } }
    const result = await runTurn({ ...base(), userText: 'Ajoute une console CL5', transport: transport([{ calls: [add, ask] }]) })
    expect(result.draft.addedEquipment).toEqual([])
    expect(result.history.filter(m => m.role === 'assistant').flatMap(m => m.role === 'assistant' ? m.toolCalls : []).map(c => c.name)).toEqual(['ask_user'])
    expect(JSON.parse(runTool(base().draft, { ...ask, args: { question: '' } }, ctx).content).error).toBeTruthy()
    expect(JSON.parse(runTool(base().draft, { ...video, args: { ...video.args, audio_console_template_id: 'inconnue' } }, ctx).content).error).toBeTruthy()
  })
  it('interrompt une boucle de recherche identique par une question ciblée', async () => {
    for (const read of [
      { id: 'read', name: 'get_template', args: { template_id: 'newtek-tricaster-2-elite' } },
      { ...video, args: { ...video.args, camera_template_id: 'absente' } },
      { ...video, args: { ...video.args, camera_count: 3 } },
    ]) {
      const sent: string[] = []
      const result = await runTurn({ ...base(), userText: short, transport: transport([{ calls: [read] }, { calls: [read] }, { calls: [ask] }], sent) })
      const last = JSON.parse(sent[2])
      expect(last.tools.map((t: { function: { name: string } }) => t.function.name)).toEqual(['ask_user'])
      expect(last.max_tokens).toBe(512)
      expect(result.reply).toBe(ask.args.question)
      expect(result.draft.addedEquipment).toEqual([])
    }
  })
  it('ne réduit pas un plateau avec un équipement supplémentaire à son seul câblage standard', async () => {
    const monitor = LIBRARY.find(t => t.family === 'display' && t.status === 'verified')!
    const sent: string[] = []
    await runTurn({ ...base(), userText: short + ' et un moniteur ' + monitor.model, transport: transport([{ calls: [ask] }], sent) })
    const request = JSON.parse(sent[0])
    expect(request.tools.map((t: { function: { name: string } }) => t.function.name)).not.toContain('propose_video_studio')
    expect(request.messages[0].content).toContain(monitor.id)
    expect(referenceScore({ ...monitor, model: 'Mini Converter Optical Fiber 12G', aliases: [] }, 'Video Assist 7 12G HDR')).toBe(0)
  })
})
