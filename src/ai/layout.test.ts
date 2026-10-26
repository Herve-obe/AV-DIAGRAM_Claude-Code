import { describe, expect, it } from 'vitest'
import { buildTemplate } from '../library/templates'
import { GENERIC_LIBRARY } from '../library/generic'
import { addAnnotation, addEquipment, addSheet, DEFAULT_SHEET_ID, isProject } from '../model/project'
import { diagramBlockSize } from '../model/diagramLayout'
import { exportSettingsOf, sheetLayout, tilesFor } from '../io/exportOptions'
import { SIGNAL_FAMILIES } from '../model/signals'
import { createDraft, hasChanges, runTool } from './tools'
import { localLayoutRequest, runTurn, type Transport } from './agent'

const ctx = { library: GENERIC_LIBRARY, describe: (i: { code: string }) => i.code }
const request = { id: 'layout', name: 'rearrange_diagram', args: { scope: 'current_sheet', target: 'single_page' } }
const noModel: Transport = { request: async () => { throw new Error('Aucun appel au modèle attendu') } }

describe('réorganisation du schéma existant', () => {
  it('reconnaît une page lisible unique en français et en anglais', () => {
    for (const text of ['Adapte sur une seule page', 'Make this fit on one readable page', 'Range sur une page unique']) expect(localLayoutRequest(text)?.target).toBe('single_page')
  })
  it.each([
    'Adapte ce schéma pour qu’il tienne sur une seule page',
    'Range ça sur une feuille, sans toucher aux câbles',
    'Make the current diagram fit on one readable page',
    'Optimise la mise en page en A2',
    'Réorganise uniquement les éléments sélectionnés',
  ])('traite localement la commande : %s', async userText => {
    const project = buildTemplate('concert', 'Test')
    const result = await runTurn({ draft: createDraft(project, DEFAULT_SHEET_ID), ctx: { ...ctx, selectedEquipment: Object.keys(project.equipment) }, transport: noModel, history: [],
      connection: { provider: 'builtin', model: 'test' }, system: '', userText })
    expect(result.toolsUsed).toEqual(['rearrange_diagram'])
    expect(hasChanges(result.draft)).toBe(true)
    expect(Object.keys(result.draft.project.equipment)).toEqual(Object.keys(project.equipment))
    expect(result.draft.addedEquipment).toHaveLength(0)
    expect(result.draft.addedLinks).toHaveLength(0)
  })

  it.each(['Comment faire tenir mon schéma sur une page ?', 'Ne réorganise pas cette page', 'Ne pas réorganiser cette page', 'Pas de réorganisation de la page', 'Sans optimiser la mise en page', 'Ajoute deux caméras et optimise la mise en page', 'Génère une conférence', 'Fais un schéma de conférence'])('laisse la demande au modèle : %s', text => {
    expect(localLayoutRequest(text)).toBeUndefined()
  })

  it('garde appareils, patch, notes et autres feuilles, et propose des pages imprimables', () => {
    let project = buildTemplate('concert', 'Concert')
    const other = addSheet(project, 'Autre feuille'); project = other.project
    const external = addEquipment(project, GENERIC_LIBRARY.find(t => t.id === 'gen-mic-dyn')!, { x: -200, y: 99 }, { sheetId: other.id }); project = external.project
    const note = addAnnotation(project, { kind: 'note', sheetId: DEFAULT_SHEET_ID, position: { x: 7000, y: -400 }, size: { w: 400, h: 100 }, text: 'Note à conserver\nCanal 1 → enregistrement' }); project = note.project
    const frame = addAnnotation(project, { kind: 'frame', sheetId: DEFAULT_SHEET_ID, position: { x: 8000, y: 0 }, size: { w: 300, h: 200 }, text: 'Cadre libre' }); project = frame.project
    const firstLink = Object.keys(project.links)[0]
    project = { ...project, links: { ...project.links, [firstLink]: { ...project.links[firstLink], bendX: 9999, bendY: -9999 } } }
    const original = JSON.stringify(project), draft = createDraft(project, DEFAULT_SHEET_ID)
    const result = runTool(draft, request, ctx)
    expect(JSON.parse(result.content).error).toBeUndefined()
    expect(hasChanges(result.draft)).toBe(true)
    expect(result.draft.rearrangedEquipment).toHaveLength(13)
    expect(result.draft.layout?.choices.some(c => c.valid && c.pages === 1)).toBe(true)
    for (const choice of result.draft.layout!.choices.filter(c => c.valid)) {
      const p = choice.project
      expect(Object.keys(p.links)).toEqual(Object.keys(project.links))
      for (const [id, l] of Object.entries(project.links)) {
        expect(p.links[id]).toEqual({ ...l, bendX: undefined, bendY: undefined })
      }
      expect(p.equipment[external.id]).toBe(project.equipment[external.id])
      expect(p.annotations![note.id].text).toBe(project.annotations![note.id].text)
      expect(p.annotations![frame.id].text).toBe('Cadre libre')
      expect(isProject(JSON.parse(JSON.stringify(p)))).toBe(true)
      const opts = exportSettingsOf(p)
      const { tileW, tileH } = tilesFor(null, sheetLayout(choice.paper, opts.orientation, SIGNAL_FAMILIES.length).area, 100)
      const boxes = result.draft.rearrangedEquipment!.map(id => ({ ...p.equipment[id].position, ...diagramBlockSize(p, p.equipment[id]) }))
      for (const b of boxes) {
        expect(Math.floor(b.x / tileW)).toBe(Math.floor((b.x + b.w - .01) / tileW))
        expect(Math.floor(b.y / tileH)).toBe(Math.floor((b.y + b.h - .01) / tileH))
      }
      boxes.forEach((a, i) => boxes.slice(i + 1).forEach(b => expect(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y).toBe(true)))
      for (const id of result.draft.rearrangedEquipment!) expect(p.equipment[id].ports).toBe(project.equipment[id].ports)
    }
    expect(JSON.stringify(project)).toBe(original)
  })

  it('respecte la sélection, les formats imposés et les droits', () => {
    const project = buildTemplate('concert', 'Concert'), ids = Object.keys(project.equipment)
    const draft = createDraft(project, DEFAULT_SHEET_ID)
    const selected = runTool(draft, { ...request, args: { scope: 'selection', target: 'readable', paper: 'A3' } }, { ...ctx, selectedEquipment: [ids[0]] })
    expect(selected.draft.rearrangedEquipment).toEqual([ids[0]])
    for (const id of ids.slice(1)) expect(selected.draft.project.equipment[id]).toBe(project.equipment[id])
    expect(selected.draft.layout!.choices[selected.draft.layout!.selected].paper).toBe('A3')
    expect(runTool(draft, request, { ...ctx, allowed: () => false }).draft).toBe(draft)
    expect(runTool(draft, { ...request, args: { ...request.args, paper: 'A9' } }, ctx).draft).toBe(draft)
  })
})
