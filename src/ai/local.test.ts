import { describe, expect, it } from 'vitest'
import { GENERIC_LIBRARY } from '../library/generic'
import { addEquipment, createProject, DEFAULT_SHEET_ID } from '../model/project'
import { boundedHistory } from './agent'
import { searchDocumentation } from './knowledge'
import { recommendedModel, type LocalModel } from './local'
import { buildChatRequest } from './providers'
import { createDraft, runTool } from './tools'

const ctx = { library: GENERIC_LIBRARY, describe: (i: { code: string }) => i.code }
const call = (name: string, args = {}) => ({ id: 'test', name, args })

describe('assistant local : sources et limites', () => {
  it('trouve des chapitres avec source, sans dépendre d’un service ni des accents', () => {
    const hits = searchDocumentation('sauvegardes automatiques')
    expect(hits.length).toBeGreaterThan(0)
    expect(hits.length).toBeLessThanOrEqual(3)
    expect(hits.some((h) => h.excerpt.includes('Save Back Up'))).toBe(true)
    expect(hits.every((h) => h.source.startsWith('Manuel AV Diagram, '))).toBe(true)
    expect(searchDocumentation('!!!')).toEqual([])
    expect(searchDocumentation('zzzzinconnu')).toEqual([])
  })
  it('borne chaque extrait et expose la recherche au modèle', () => {
    const d = createDraft(createProject('test'), DEFAULT_SHEET_ID)
    const r = JSON.parse(runTool(d, call('search_documentation', { query: 'baies' }), ctx).content)
    expect(r.results.length).toBeGreaterThan(0)
    expect(r.results.every((h: { excerpt: string }) => h.excerpt.length <= 1400)).toBe(true)
  })
  it('choisit un modèle adapté au repère de mémoire et replie sur le plus petit si inconnu', () => {
    const models = [{ id: 'small', size: 2, minimum_ram_gb: 8 }, { id: 'large', size: 5, minimum_ram_gb: 16 }] as LocalModel[]
    expect(recommendedModel(models, 0)?.id).toBe('small')
    expect(recommendedModel(models, 12 * 1024 ** 3)?.id).toBe('small')
    expect(recommendedModel(models, 32 * 1024 ** 3)?.id).toBe('large')
  })
  it('désactive la réflexion longue seulement pour le moteur embarqué', () => {
    const local = JSON.parse(buildChatRequest('openai', 'm', 's', [], [], true).body!)
    expect(local.chat_template_kwargs.enable_thinking).toBe(false)
    expect(local.parallel_tool_calls).toBe(false)
    expect(JSON.parse(buildChatRequest('openai', 'm', 's', [], []).body!).chat_template_kwargs).toBeUndefined()
  })
  it('garde les paires appels/résultats et limite les anciens échanges', () => {
    const h = boundedHistory([
      { role: 'user', text: 'ancien' },
      { role: 'assistant', text: '', toolCalls: [{ id: '1', name: 'get_project', args: {} }] },
      { role: 'tool', results: [{ id: '1', name: 'get_project', content: 'x'.repeat(50000) }] },
      { role: 'user', text: 'nouveau' },
    ])
    expect(h).toEqual([{ role: 'user', text: 'nouveau' }])
  })
  it('refuse une action non autorisée dès la préparation', () => {
    const d = createDraft(createProject('test'), DEFAULT_SHEET_ID)
    const r = runTool(d, call('add_equipment', { template_id: 'gen-mic-dyn' }), { ...ctx, allowed: () => false })
    expect(r.draft).toBe(d)
    expect(JSON.parse(r.content).error).toContain('droits')
  })
  it('ne propose aucune liaison incompatible', () => {
    const a = addEquipment(createProject('test'), GENERIC_LIBRARY.find(t => t.id === 'gen-mic-dyn')!, { x: 0, y: 0 })
    const b = addEquipment(a.project, GENERIC_LIBRARY.find(t => t.id === 'gen-mic-dyn')!, { x: 300, y: 0 })
    const d = createDraft(b.project, DEFAULT_SHEET_ID)
    const r = runTool(d, call('connect_ports', { from_equipment_id: a.id, from_port_id: 'p1', to_equipment_id: b.id, to_port_id: 'p1' }), ctx)
    expect(r.draft).toBe(d)
    expect(JSON.parse(r.content).error).toContain('incompatible')
  })
  it('lit les gros schémas par pages explicites', () => {
    const tpl = GENERIC_LIBRARY.find(t => t.id === 'gen-mic-dyn')!
    let project = createProject('grand')
    for (let n = 0; n < 32; n++) project = addEquipment(project, tpl, { x: 0, y: n * 50 }).project
    const draft = createDraft(project, DEFAULT_SHEET_ID)
    const first = JSON.parse(runTool(draft, call('get_project'), ctx).content)
    const next = JSON.parse(runTool(draft, call('get_project', { offset: first.next_offset }), ctx).content)
    expect(first.equipment_total).toBe(32); expect(first.equipment).toHaveLength(25)
    expect(next.equipment).toHaveLength(7); expect(next.next_offset).toBeNull()
  })
  it('permet de lire les sorties situées après les nombreuses entrées d’une stagebox', () => {
    const base = GENERIC_LIBRARY.find(t => t.id === 'gen-console')!
    const ports = Array.from({ length: 56 }, (_, i) => ({ ...base.ports[0], id: `p${i}`, name: `${i < 32 ? 'IN' : 'OUT'} ${i < 32 ? i + 1 : i - 31}`, direction: i < 32 ? 'in' as const : 'out' as const }))
    const eq = addEquipment(createProject('test'), { ...base, ports }, { x: 0, y: 0 })
    const draft = createDraft(eq.project, DEFAULT_SHEET_ID)
    const first = JSON.parse(runTool(draft, call('get_equipment', { equipment_id: eq.id }), ctx).content)
    expect(first.ports_total).toBe(56); expect(first.next_offset).toBe(16)
    const outputs = JSON.parse(runTool(draft, call('get_equipment', { equipment_id: eq.id, offset: 32 }), ctx).content)
    expect(outputs.ports[0].direction).toBe('out'); expect(outputs.ports[0].name).toBe('OUT 1')
  })
  it('refuse un identifiant hérité du prototype comme un équipement inconnu', () => {
    const draft = createDraft(createProject('test'), DEFAULT_SHEET_ID)
    const r = runTool(draft, call('get_equipment', { equipment_id: '__proto__' }), ctx)
    expect(JSON.parse(r.content).error).toContain('inconnu')
  })
})
