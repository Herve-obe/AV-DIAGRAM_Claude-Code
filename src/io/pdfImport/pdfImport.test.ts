// Import d'un synoptique PDF : extraction (pdf.js, version pour Node) et interprétation.
// Le PDF d'essai est produit par Chromium depuis fixtures/synoptique-externe.html (SVG vectoriel).
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs'
import { LIBRARY } from '../../library'
import { extractPdf } from './extract'
import { interpretPage } from './interpret'

const fixture = new URL('./fixtures/synoptique-externe.pdf', import.meta.url)

describe('import PDF : synoptique d\'un autre logiciel', async () => {
  const pages = await extractPdf(pdfjs as never, new Uint8Array(readFileSync(fixture)))
  const r = interpretPage(pages[0], LIBRARY)
  const eq = (name: string) => r.equipment.find((e) => e.name === name)!
  const port = (e: string, p: string) => eq(e).ports.find((x) => x.name === p)!

  it('cadres avec texte = équipements ; cadre de page et cartouche exclus', () => {
    expect(r.kind).toBe('vector')
    expect(r.equipment.map((e) => e.name).sort()).toEqual(
      ['AMPLI FACE', 'CAM 1', 'CONSOLE FOH', 'MIC 1 Chant', 'MIC 2 Guitare', 'MÉLANGEUR', 'STAGEBOX', 'ÉCRAN RETOUR', 'SYNOPTIQUE AUDIO / VIDÉO'].sort(),
    )
    // Le cartouche est reconnu comme un cadre, mais sans liaison : la fenêtre d'import le décoche
    expect(eq('SYNOPTIQUE AUDIO / VIDÉO').links).toBe(0)
    expect(eq('CONSOLE FOH').model).toBe('Yamaha QL5')
  })

  it('traits entre deux cadres = liaisons, ports nommés d\'après les textes au bord', () => {
    expect(r.links).toHaveLength(7)
    const l = r.links.find((x) => x.ref === 'A001')!
    expect(eq('MIC 1 Chant').ports.map((p) => p.name)).toEqual(['OUT'])
    expect(l.from).toEqual({ eq: eq('MIC 1 Chant').key, port: port('MIC 1 Chant', 'OUT').key })
    expect(l.to).toEqual({ eq: eq('STAGEBOX').key, port: port('STAGEBOX', 'IN 1').key })
    expect(port('STAGEBOX', 'IN 1').direction).toBe('in')
  })

  it('repère, longueur et type de câble lus sur la liaison', () => {
    const d = r.links.find((x) => x.ref === 'D001')!
    expect(d.lengthM).toBe(20)
    expect(d.signal).toBe('audioIp')
    expect(d.signalFrom).toBe('keyword')
    const v = r.links.find((x) => x.ref === 'V001')!
    expect(v.signal).toBe('video')
    expect(v.lengthM).toBe(50)
  })

  it('signal déduit de la couleur du trait quand rien n\'est écrit', () => {
    // PGM OUT -> HDMI IN : orange, comme V001 (SDI)
    const pgm = r.links.find((x) => x.from.port === port('MÉLANGEUR', 'PGM OUT').key)!
    expect(pgm.signal).toBe('video')
    expect(['keyword', 'color']).toContain(pgm.signalFrom)
    // OUT L -> IN A : bleu, comme A001 (rien d'écrit sur A001 : analogique par défaut du domaine audio)
    const outL = r.links.find((x) => x.from.port === port('CONSOLE FOH', 'OUT L').key)!
    expect(outL.signal).toBe('audioAnalog')
  })

  it('familles : d\'après la fiche reconnue ou les mots du cadre', () => {
    expect(eq('CAM 1').family).toBe('camera')
    expect(eq('MÉLANGEUR').family).toBe('videoSwitcher')
    expect(eq('AMPLI FACE').family).toBe('amplification')
    expect(eq('MIC 1 Chant').family).toBe('capture')
  })

  it('textes hors cadres et hors liaisons gardés à part (légende)', () => {
    expect(r.looseText.join(' ')).toContain('Légende')
  })
})

describe('import PDF : construction', async () => {
  const { buildImport, defaultChoices } = await import('./build')
  const ops = await import('../../model/project')
  const { LIBRARY_INDEX } = await import('../../library')
  const pages = await extractPdf(pdfjs as never, new Uint8Array(readFileSync(fixture)))
  const r = interpretPage(pages[0], LIBRARY)

  it('nouvelle feuille, cartouche décoché, liaisons et repères d\'origine', () => {
    const choices = defaultChoices(r, 'synoptique-externe.pdf')
    const before = ops.createProject('Essai')
    const out = buildImport(before, r, choices, LIBRARY_INDEX)
    expect(out.equipment).toBe(8)
    expect(out.links).toBe(7)
    const eqs = Object.values(out.project.equipment).filter((e) => e.sheetId === out.sheetId)
    expect(eqs.map((e) => e.name)).not.toContain('SYNOPTIQUE AUDIO / VIDÉO')
    const d001 = Object.values(out.project.links).find((l) => l.notes?.includes('D001'))!
    expect(d001.lengthM).toBe(20)
    // Le projet de départ n'est pas modifié
    expect(Object.keys(before.equipment)).toHaveLength(0)
  })

  it('signal choisi dans la fenêtre : reporté sur la liaison et ses ports', () => {
    const choices = defaultChoices(r, 'x.pdf')
    const l = r.links.find((x) => x.ref === 'A001')!
    choices.links[l.key].signal = 'audioDigital'
    // Micro sans fiche : le port dessiné prend le signal choisi
    choices.equipment[l.from.eq].useTemplate = false
    const out = buildImport(ops.createProject('Essai'), r, choices, LIBRARY_INDEX)
    const link = Object.values(out.project.links).find((x) => x.notes?.includes('A001'))!
    const src = out.project.equipment[link.source.equipmentId].ports.find((x) => x.id === link.source.portId)!
    expect(src.signal).toBe('audioDigital')
    // Stagebox avec sa fiche : le port du constructeur garde son signal
    const dst = out.project.equipment[link.target.equipmentId].ports.find((x) => x.id === link.target.portId)!
    expect(dst.name).toBe('INPUT 1')
    expect(dst.signal).toBe('audioAnalog')
  })
})

describe('import PDF : ports rattachés à la fiche', async () => {
  const { buildImport, defaultChoices } = await import('./build')
  const ops = await import('../../model/project')
  const { LIBRARY_INDEX } = await import('../../library')
  const pages = await extractPdf(pdfjs as never, new Uint8Array(readFileSync(fixture)))
  const r = interpretPage(pages[0], LIBRARY)

  it('« IN 1 » du dessin = « Input 1 » de la fiche : pas de port en double', () => {
    const stage = r.equipment.find((e) => e.name === 'STAGEBOX')!
    expect(stage.match).toBeDefined()
    const out = buildImport(ops.createProject('Essai'), r, defaultChoices(r, 'x.pdf'), LIBRARY_INDEX)
    const eq = Object.values(out.project.equipment).find((e) => e.name === 'STAGEBOX')!
    const tpl = LIBRARY_INDEX.get(stage.match!.templateId)!
    expect(eq.ports.length).toBe(tpl.ports.length)
  })
})

describe('import PDF : page sans tracé', () => {
  it('page faite d\'une image : signalée, rien d\'inventé', () => {
    const r = interpretPage({ index: 1, width: 800, height: 600, texts: [{ str: 'LÉGENDE', x: 10, y: 10, w: 40, h: 8 }], rects: [], segments: [], images: 1 }, LIBRARY)
    expect(r.kind).toBe('raster')
    expect(r.equipment).toHaveLength(0)
  })
})
