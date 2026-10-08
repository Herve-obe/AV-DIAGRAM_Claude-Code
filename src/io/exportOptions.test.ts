import { describe, expect, it } from 'vitest'
import { GState, jsPDF } from 'jspdf'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs'
import * as ops from '../model/project'
import { PAPER_SIZES } from '../model/types'
import { pageSize, sheetLayout, watermarkText } from './exportOptions'
import { svgWatermark } from './files'

describe('export : formats et filigrane', () => {
  it('formats ISO 216 (mm), paysage et portrait', () => {
    expect(pageSize('A4', 'portrait')).toEqual({ w: 210, h: 297 })
    expect(pageSize('A3', 'landscape')).toEqual({ w: 420, h: 297 })
    expect(pageSize('A0', 'landscape')).toEqual({ w: 1189, h: 841 })
  })

  it('disposition : cartouche, légende et schéma tiennent dans la page sans se chevaucher', () => {
    for (const paper of PAPER_SIZES) {
      for (const o of ['landscape', 'portrait'] as const) {
        const l = sheetLayout(paper, o, 12)
        const legendRight = l.legend.x + l.legend.cols * l.legend.colW
        const legendBottom = l.legend.y + 10 + Math.ceil(12 / l.legend.cols) * l.legend.rowH
        // Légende à côté du cartouche, ou au-dessus
        expect(legendRight <= l.titleBlock.x + 1 || legendBottom <= l.titleBlock.y + 1, `${paper} ${o}`).toBe(true)
        expect(l.area.y + l.area.h).toBeLessThanOrEqual(Math.min(l.legend.y, l.titleBlock.y))
        expect(l.titleBlock.x).toBeGreaterThanOrEqual(l.margin)
        expect(l.area.h).toBeGreaterThan(l.h * 0.5)
      }
    }
  })

  it('texte du filigrane : champs du projet, champs vides retirés', () => {
    let p = ops.createProject('Festival')
    p = ops.updateInfo(p, { client: 'Mairie de Lyon', revision: 'B' })
    const d = new Date(2026, 9, 8)
    expect(watermarkText('{client} · {date} · NE PAS DIFFUSER', p, d)).toBe(`Mairie de Lyon · ${d.toLocaleDateString()} · NE PAS DIFFUSER`)
    expect(watermarkText('{client} · CONFIDENTIEL', ops.createProject('X'), d)).toBe('CONFIDENTIEL')
    expect(watermarkText('{project} rév. {revision}', p, d)).toBe('Festival rév. B')
  })

  it('SVG : couche de filigrane ajoutée avant la fin, texte échappé', () => {
    const out = svgWatermark('<svg width="800" height="600"><rect/></svg>', 'A & B <C>', 0.2, 800, 600)
    expect(out.endsWith('</svg>')).toBe(true)
    expect(out).toContain('fill-opacity="0.2"')
    expect(out).toContain('A &#38; B &#60;C&#62;')
    expect(out).not.toContain('<C>')
  })

  it('PDF : format choisi, filigrane transparent et protection lus par un lecteur PDF', async () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', encryption: { ownerPassword: 'x1y2z3', userPermissions: ['print'] } })
    doc.setGState(new GState({ opacity: 0.1 }))
    doc.text('NE PAS DIFFUSER', 40, 200, { angle: 55 })
    const data = new Uint8Array(doc.output('arraybuffer'))
    const pdf = await pdfjs.getDocument({ data, isEvalSupported: false }).promise
    const page = await pdf.getPage(1)
    const vp = page.getViewport({ scale: 1 })
    // A4 portrait : 210 x 297 mm = 595 x 842 points
    expect(Math.round(vp.width)).toBe(595)
    expect(Math.round(vp.height)).toBe(842)
    const text = (await page.getTextContent()).items.map((i) => ('str' in i ? i.str : '')).join('')
    expect(text).toContain('NE PAS DIFFUSER')
    // Droits : impression seulement (ni modification, ni copie)
    const perms = await pdf.getPermissions()
    expect(perms).not.toBeNull()
    expect(perms).toContain(pdfjs.PermissionFlag.PRINT)
    expect(perms).not.toContain(pdfjs.PermissionFlag.MODIFY_CONTENTS)
    expect(perms).not.toContain(pdfjs.PermissionFlag.COPY)
  })
})
