import { describe, expect, it } from 'vitest'
import { backupName, backupsToDelete } from './backups'

describe('sauvegardes tournantes', () => {
  it('nomme les sauvegardes dans l\'ordre chronologique', () => {
    expect(backupName('concert', new Date(2026, 9, 10, 14, 5, 3))).toBe('concert_2026-10-10_14-05-03.avd')
  })
  it('ne garde que les plus récentes, sans toucher aux autres fichiers', () => {
    const names = [
      'concert_2026-10-10_14-00-00.avd', 'concert_2026-10-10_14-10-00.avd', 'concert_2026-10-10_14-05-00.avd',
      'concert-2_2026-10-10_14-00-00.avd', 'notes.txt', 'concert.avd',
    ]
    expect(backupsToDelete(names, 'concert', 2)).toEqual(['concert_2026-10-10_14-00-00.avd'])
    expect(backupsToDelete(names, 'concert', 10)).toEqual([])
  })
})

describe('feuille dessinée sur le canevas (mode page)', () => {
  it('la zone de dessin commence à l\'origine et suit l\'échelle d\'impression', async () => {
    const { pageFrame } = await import('./exportOptions')
    const f100 = pageFrame({ paper: 'A3', orientation: 'landscape', printScale: 100 })
    const f50 = pageFrame({ paper: 'A3', orientation: 'landscape', printScale: 50 })
    expect(f100.area.x).toBe(0)
    expect(f100.area.y).toBe(0)
    // 1 unité = 0,25 mm à 100 % : la feuille A3 paysage (420 mm) fait 1680 unités
    expect(Math.round(f100.sheet.w)).toBe(1680)
    expect(Math.round(f50.sheet.w)).toBe(3360)
    expect(f100.titleBlock.x + f100.titleBlock.w).toBeLessThanOrEqual(f100.sheet.x + f100.sheet.w)
  })
  it('un modèle de départ est ramené dans la feuille, à une échelle où il tient', async () => {
    const { fitProjectToPage, pageFrame, sheetBounds } = await import('./exportOptions')
    const { buildSampleProject } = await import('../library/sample')
    const { DEFAULT_SHEET_ID } = await import('../model/project')
    const r = fitProjectToPage(buildSampleProject(), 'A4', 'landscape', DEFAULT_SHEET_ID)
    const f = pageFrame({ paper: 'A4', orientation: 'landscape', printScale: r.printScale })
    const b = sheetBounds(r.project, DEFAULT_SHEET_ID, DEFAULT_SHEET_ID)!
    expect(r.printScale).toBeLessThanOrEqual(100)
    expect(b.x).toBeGreaterThanOrEqual(0)
    expect(b.x + b.w).toBeLessThanOrEqual(f.area.w)
    expect(b.y + b.h).toBeLessThanOrEqual(f.area.h)
  })
})
