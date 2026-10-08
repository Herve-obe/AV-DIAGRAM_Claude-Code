import { describe, expect, it } from 'vitest'
import { GState, jsPDF } from 'jspdf'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs'
import * as ops from '../model/project'
import { PAPER_SIZES } from '../model/types'
import { DEFAULT_EXPORT, approxWidth, exportSettingsOf, fitScale, pageSize, sheetLayout, tileRef, tilesFor, watermarkLayout, watermarkText } from './exportOptions'
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
        expect(l.titleBlock.w).toBeLessThanOrEqual(180)
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
    const ws = { ...DEFAULT_EXPORT.watermark, enabled: true, opacity: 0.2 }
    const out = svgWatermark('<svg width="800" height="600"><rect/></svg>', 'A & B <C>', ws, 800, 600)
    expect(out.endsWith('</svg>')).toBe(true)
    expect(out).toContain('fill-opacity="0.2"')
    expect(out).toContain('A &#38; B &#60;C&#62;')
    expect(out).not.toContain('<C>')
  })

  it('filigrane : chaque position reste dans la zone', () => {
    for (const placement of ['tiled', 'diagonal', 'top', 'bottom', 'corner'] as const) {
      const items = watermarkLayout(400, 220, 'MAIRIE DE LYON · NE PAS DIFFUSER', placement, 'medium')
      expect(items.length, placement).toBeGreaterThan(0)
      if (placement !== 'tiled') {
        for (const it of items) {
          expect(it.x).toBeGreaterThanOrEqual(0)
          expect(it.x).toBeLessThanOrEqual(400)
          expect(it.y).toBeGreaterThan(0)
          expect(it.y).toBeLessThanOrEqual(220)
          // Texte horizontal : il tient dans la largeur
          if (it.angle === 0) expect(approxWidth('MAIRIE DE LYON · NE PAS DIFFUSER', it.size)).toBeLessThanOrEqual(400)
        }
      }
    }
    // Mosaïque : toute la zone couverte (au moins un texte dans chaque quart)
    const tiled = watermarkLayout(400, 220, 'NE PAS DIFFUSER', 'tiled', 'medium')
    for (const [qx, qy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
      expect(tiled.some((it) => it.x >= qx * 200 && it.x < (qx + 1) * 200 && it.y >= qy * 110 && it.y < (qy + 1) * 110)).toBe(true)
    }
  })

  it('taille fixe : nombre de pages selon le format ; mise à l\'échelle : réduction', () => {
    // Schéma de 2000 x 1000 unités : 500 x 250 mm à 100 %
    const bounds = { x: 0, y: 0, w: 2000, h: 1000 }
    const a3 = sheetLayout('A3', 'landscape', 12).area
    const a4 = sheetLayout('A4', 'landscape', 12).area
    const t3 = tilesFor(bounds, a3, 100)
    const t4 = tilesFor(bounds, a4, 100)
    expect(t3.cols * t3.rows).toBeGreaterThan(1)
    expect(t4.cols * t4.rows).toBeGreaterThan(t3.cols * t3.rows)
    expect(tilesFor(bounds, a3, 50).cols * tilesFor(bounds, a3, 50).rows).toBe(1)
    expect(fitScale(bounds, a4)).toBeLessThan(fitScale(bounds, a3))
    expect(tileRef(1, 0)).toBe('B1')
  })

  it('anciens réglages (« protect ») repris', () => {
    const p = ops.updateSettings(ops.createProject('X'), { export: { paper: 'A4', protect: true } as never })
    const s = exportSettingsOf(p)
    expect(s.paper).toBe('A4')
    expect(s.protection.enabled).toBe(true)
    expect(s.watermark.placement).toBe('tiled')
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
