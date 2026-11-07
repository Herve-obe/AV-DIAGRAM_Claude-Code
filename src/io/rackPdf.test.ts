import { describe, expect, it } from 'vitest'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs'
import i18n from '../i18n'
import { LIBRARY_BY_ID } from '../library/generic'
import { installModule } from '../model/modules'
import * as ops from '../model/project'
import { addRack, mountEquipment } from '../model/racks'
import { PAPER_SIZES } from '../model/types'
import { useTitleBlock } from '../store/titleBlockStore'
import { exportSettingsOf, pageSize } from './exportOptions'
import { pdfLabels } from './exportPdfUi'
import { buildPdf } from './pdf'
import { rackSheets } from './rackPdf'

const t = i18n.t.bind(i18n)
function fixture() {
  const host = ops.addEquipment(ops.createProject('Exemple baies'), LIBRARY_BY_ID.get('gen-modular-chassis')!, { x: 0, y: 0 })
  const installed = installModule(host.project, host.id, 'slot1', LIBRARY_BY_ID.get('gen-module-audio')!).project
  const rack = addRack(installed, { heightU: 47, depthMm: 600, maxWeightKg: 50 })
  let p = mountEquipment(rack.project, host.id, rack.id, 46).project
  const rear = ops.addEquipment(p, LIBRARY_BY_ID.get('gen-processor')!, { x: 200, y: 0 })
  p = ops.updateEquipment(rear.project, rear.id, { rackU: 1, name: 'Arrière bas' })
  return mountEquipment(p, rear.id, rack.id, 1, 'rear').project
}

describe('PDF des baies', () => {
  it('trace les deux faces, les plages de U et la liste des cartes sans image', async () => {
    const project = fixture(), original = JSON.stringify(project), opts = exportSettingsOf(project)
    const shots = rackSheets(project, opts, {}, t)
    expect(shots.length).toBeGreaterThan(2)
    expect(shots.every(s => s.draw && !s.dataUrl)).toBe(true)
    const pdf = await buildPdf({ project, opts, info: { author: 'Régie', revision: 'A' }, template: useTitleBlock.getState().template, labels: pdfLabels(t), date: new Date('2026-10-18T12:00:00Z') }, shots)
    const task = pdfjs.getDocument({ data: pdf.bytes, useSystemFonts: true })
    const doc = await task.promise
    expect(doc.numPages).toBe(shots.length)
    const texts: string[] = []
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i)
      const content = await page.getTextContent()
      texts.push(content.items.filter(x => 'str' in x).map(x => x.str).join(' '))
      const ops = await page.getOperatorList()
      expect(ops.fnArray).not.toContain(pdfjs.OPS.paintImageXObject)
    }
    expect(texts[0]).toContain('Avant')
    expect(texts[0]).toContain('Arrière')
    expect(texts.join(' ')).toContain('Arrière bas')
    expect(texts.at(-1)).toContain('Carte audio (exemple)')
    expect(JSON.stringify(project)).toBe(original)
    await task.destroy()
  })
  it('garde toutes les unités en plages contiguës pour chaque format et orientation', () => {
    const p = fixture()
    for (const paper of PAPER_SIZES) for (const orientation of ['portrait', 'landscape'] as const) {
      const opts = { ...exportSettingsOf(p), paper, orientation }
      const shots = rackSheets(p, opts, {}, t).filter(s => s.name.includes(' · U '))
      const ranges = shots.map(s => s.name.match(/U (\d+)–(\d+)$/)!.slice(1).map(Number))
      expect(ranges[0][0]).toBe(47)
      expect(ranges.at(-1)![1]).toBe(1)
      ranges.slice(1).forEach((r, i) => expect(r[0]).toBe(ranges[i][1] - 1))
      expect(pageSize(paper, orientation).w).toBeGreaterThan(0)
    }
  })
  it('applique le filigrane aux élévations vectorielles', async () => {
    const project = fixture(), opts = exportSettingsOf(project)
    opts.watermark = { ...opts.watermark, enabled: true, text: 'ESSAI BAIES', zone: 'diagram' }
    const shots = rackSheets(project, opts, {}, t)
    const pdf = await buildPdf({ project, opts, info: {}, template: useTitleBlock.getState().template, labels: pdfLabels(t), date: new Date() }, shots)
    const task = pdfjs.getDocument({ data: pdf.bytes, useSystemFonts: true })
    const doc = await task.promise
    const content = await (await doc.getPage(1)).getTextContent()
    expect(content.items.filter(x => 'str' in x).map(x => x.str).join(' ')).toContain('ESSAI BAIES')
    await task.destroy()
  })
})
