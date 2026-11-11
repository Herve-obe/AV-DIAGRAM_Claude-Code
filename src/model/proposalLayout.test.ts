import { describe, expect, it } from 'vitest'
import { GENERIC_LIBRARY, LIBRARY_BY_ID } from '../library/generic'
import { sheetLayout, tilesFor, exportSettingsOf } from './exportOptions'
import * as ops from './project'
import { SIGNAL_FAMILIES } from './signals'
import { diagramBlockSize } from './diagramLayout'
import { proposalLayouts } from './proposalLayout'
import { createDraft, runTool } from '../ai/tools'

describe('mise en page des propositions IA', () => {
  // Proposition construite comme par l'assistant : plan (note de besoin) puis système câblé
  const production = (base = ops.createProject('Conférence')) => {
    const ctx = { library: GENERIC_LIBRARY, describe: (i: { code: string }) => i.code }
    const role = (ref: string, query: string, family: string, count: number) => ({ ref, query, family, count, required_model: false })
    const planned = runTool(createDraft(base, ops.DEFAULT_SHEET_ID), { id: 'plan', name: 'plan_diagram', args: {
      goal: 'Sonoriser une conférence', roles: [role('mic', 'Micro dynamique', 'capture', 3), role('desk', 'Console numérique', 'console', 1), role('speaker', 'Enceinte amplifiée', 'speaker', 2)],
      constraints: ['Pas de micros dans les enceintes'], assumptions: ['Références génériques proposées à confirmer.'], questions: [],
    } }, ctx).draft
    return runTool(planned, { id: 'system', name: 'propose_system', args: {
      equipment: [{ ref: 'mic', template_id: 'gen-mic-dyn', count: 3 }, { ref: 'desk', template_id: 'gen-console' }, { ref: 'speaker', template_id: 'gen-speaker-active', count: 2 }],
      connections: [{ from: 'mic', to: 'desk', signal: 'audioAnalog' }, { from: 'desk', to: 'speaker', signal: 'audioAnalog' }],
    } }, ctx).draft
  }

  it('range le cahier des charges dans les pages imprimables, notes entières et patch conservé', () => {
    const draft = production(), original = JSON.stringify(draft.project)
    const layouts = proposalLayouts(draft.base, draft.project, draft.addedEquipment, draft.sheetId)
    expect(layouts[0].paper).toBe('A3')
    expect(layouts.some(c => c.valid && c.pages === 1)).toBe(true)
    for (const choice of layouts.filter(c => c.valid)) {
      const p = choice.project, opts = exportSettingsOf(p)
      const { tileW, tileH } = tilesFor(null, sheetLayout(choice.paper, opts.orientation, SIGNAL_FAMILIES.length).area, 100)
      const boxes = [...draft.addedEquipment.map(id => ({ ...p.equipment[id].position, ...diagramBlockSize(p, p.equipment[id]) })),
        ...Object.values(p.annotations ?? {}).map(a => ({ ...a.position, ...a.size }))]
      for (const b of boxes) {
        expect(Math.floor(b.x / tileW)).toBe(Math.floor((b.x + b.w - 0.01) / tileW))
        expect(Math.floor(b.y / tileH)).toBe(Math.floor((b.y + b.h - 0.01) / tileH))
      }
      const eq = boxes.slice(0, draft.addedEquipment.length)
      eq.forEach((a, i) => eq.slice(i + 1).forEach(b => expect(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y).toBe(true)))
      const text = (project: typeof p) => Object.values(project.annotations ?? {}).filter(a => a.kind === 'note').map(a => a.text).join('').replace(/\s/g, '')
      expect(text(p)).toBe(text(draft.project))
      expect(p.links).toBe(draft.project.links)
      expect(ops.isProject(JSON.parse(JSON.stringify(p)))).toBe(true)
    }
    expect(JSON.stringify(draft.project)).toBe(original)
  })

  it('préserve l’existant et les réglages d’export hors format, y compris les autres feuilles', () => {
    const old = ops.addEquipment(ops.createProject('Existant'), LIBRARY_BY_ID.get('gen-mic-dyn')!, { x: 400, y: 100 })
    const base = ops.addAnnotation(old.project, { kind: 'frame', sheetId: ops.DEFAULT_SHEET_ID, position: { x: 350, y: 50 }, size: { w: 900, h: 500 }, text: 'À conserver' }).project
    const draft = production(base)
    const layouts = proposalLayouts(base, draft.project, draft.addedEquipment, draft.sheetId)
    for (const choice of layouts) {
      expect(choice.project.equipment[old.id]).toBe(base.equipment[old.id])
      for (const a of Object.values(base.annotations!)) expect(choice.project.annotations![a.id]).toBe(a)
      expect(exportSettingsOf(choice.project)).toEqual({ ...exportSettingsOf(base), paper: choice.paper })
      expect(draft.addedEquipment.every(id => choice.project.equipment[id].position.x >= 1600)).toBe(true)
    }
  })

  it('propose de grands formats pour un bloc trop large, sans le réduire ni supprimer ses ports', () => {
    const base = ops.createProject('Grand bloc')
    const added = ops.addEquipment(base, LIBRARY_BY_ID.get('gen-mic-dyn')!, { x: 0, y: 0 }, { name: 'Équipement '.repeat(45) })
    const choices = proposalLayouts(base, added.project, [added.id], ops.DEFAULT_SHEET_ID)
    expect(choices[0].valid).toBe(false)
    expect(choices.some(c => c.valid)).toBe(true)
    expect(choices.every(c => c.project.equipment[added.id].ports === added.project.equipment[added.id].ports)).toBe(true)
  })
})
