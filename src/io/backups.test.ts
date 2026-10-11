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
  it('feuille ajustée : un petit schéma reste à 100 %, un grand fait grandir la feuille, centrée, cartouche compris', async () => {
    const { fittedPage } = await import('./exportOptions')
    const small = fittedPage({ paper: 'A3', orientation: 'landscape' }, 0, { x: 100, y: 100, w: 300, h: 200 })
    expect(small.scale).toBe(100)
    expect(small.area.x + small.area.w / 2).toBeCloseTo(250)
    // Stagebox 32 entrées (environ 700 unités de haut) : la feuille grandit, l'échelle baisse
    const big = fittedPage({ paper: 'A3', orientation: 'landscape' }, 0, { x: 0, y: 0, w: 260, h: 1100 })
    expect(big.scale).toBeLessThan(100)
    expect(big.area.h).toBeGreaterThanOrEqual(1100)
    expect(big.area.w / big.area.h).toBeCloseTo(small.area.w / small.area.h)
    // Le cartouche reste sur la feuille, hors de la zone de dessin
    expect(big.titleBlock.y + big.titleBlock.h).toBeLessThanOrEqual(big.sheet.y + big.sheet.h + 1e-6)
    expect(big.titleBlock.y).toBeGreaterThanOrEqual(big.area.y + big.area.h - 1e-6)
  })
})
