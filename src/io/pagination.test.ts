import { describe, expect, it } from 'vitest'
import { exportSettingsOf, renderedBounds, sheetBounds, sheetsToExport, sheetLayout, tileRef, tilesFor } from './exportOptions'
import { createProject } from '../model/project'
import { buildTemplate } from '../library/templates'

describe('canevas à pages fixes', () => {
  const area = sheetLayout('A3', 'landscape', 12).area
  it('montre une page vide et conserve l’origine quand un bloc dépasse', () => {
    const empty = tilesFor(null, area, 100)
    expect(empty).toMatchObject({ x: 0, y: 0, cols: 1, rows: 1, tileW: 1600, tileH: 900 })
    expect(tilesFor({ x: 1550, y: 20, w: 100, h: 100 }, area, 100)).toMatchObject({ x: 0, y: 0, cols: 2, rows: 1, tileW: 1600 })
    expect(tilesFor({ x: 1500, y: 20, w: 100, h: 100 }, area, 100).cols).toBe(1)
  })
  it('étend la grille à gauche et en haut, sans changer la taille des pages', () => {
    expect(tilesFor({ x: -20, y: -20, w: 100, h: 100 }, area, 100)).toMatchObject({ x: -1600, y: -900, cols: 2, rows: 2 })
    expect(tileRef(26, 0)).toBe('AA1')
  })
  it('retire les trois pages vides quand tout le dessin est déplacé dans une seule page voisine', () => {
    const before = tilesFor({ x: -40, y: -60, w: 1100, h: 700 }, area, 100)
    expect(before.cols * before.rows).toBe(4)
    const moved = tilesFor({ x: 1700, y: 1000, w: 1100, h: 700 }, area, 100)
    expect(moved).toMatchObject({ x: 1600, y: 900, cols: 1, rows: 1, tileW: 1600, tileH: 900 })
    expect(tilesFor({ x: 100, y: 100, w: 1100, h: 700 }, area, 100)).toMatchObject({ x: 0, y: 0, cols: 1, rows: 1 })
    expect(tilesFor(null, area, 100)).toMatchObject({ x: 0, y: 0, cols: 1, rows: 1 })
  })
  it('retire aussi l’origine vide quand le contenu est entièrement dans les coordonnées négatives', () => {
    expect(tilesFor({ x: -1500, y: -800, w: 1200, h: 600 }, area, 100)).toMatchObject({ x: -1600, y: -900, cols: 1, rows: 1 })
    expect(tilesFor({ x: 1600, y: 900, w: 1600, h: 900 }, area, 100)).toMatchObject({ x: 1600, y: 900, cols: 1, rows: 1 })
  })
  it('place les deux vues du modèle TV dans une page A3 chacune, cadres compris', () => {
    const p = buildTemplate('tvStudio', 'TV')
    expect(p.sheets).toHaveLength(2)
    expect(Object.keys(p.equipment)).toHaveLength(11)
    expect(Object.keys(p.links)).toHaveLength(10)
    for (const sheet of p.sheets!) {
      const bounds = sheetBounds(p, sheet.id, p.sheets![0].id)!
      expect(bounds.x).toBeGreaterThanOrEqual(40)
      expect(bounds.y).toBeGreaterThanOrEqual(40)
      expect(tilesFor(bounds, area, 100)).toMatchObject({ x: 0, y: 0, cols: 1, rows: 1 })
    }
  })
  it('conserve les anciens fichiers et privilégie plusieurs pages pour les nouveaux', () => {
    const p = createProject('A3')
    expect(exportSettingsOf(p).scaleMode).toBe('tile')
    expect(exportSettingsOf({ ...p, settings: { ...p.settings, export: { ...exportSettingsOf(p), scaleMode: 'page' } } }).scaleMode).toBe('fit')
  })
  it('utilise les mesures des éléments visibles, y compris les groupes', () => {
    expect(renderedBounds([
      { position: { x: 1550, y: 0 }, measured: { width: 120, height: 80 } },
      { hidden: true, position: { x: 9000, y: 0 }, measured: { width: 500, height: 500 } },
    ])).toEqual({ x: 1550, y: 0, w: 120, h: 80 })
  })
  it('conserve dans le PDF une vue générale composée uniquement de groupes repliés', () => {
    const p = { ...createProject('Groupes'), sheets: [
      { id: 'overview', name: 'Vue générale' },
      { id: 'detail', name: 'Scène', parentId: 'overview', groupPosition: { x: 1520, y: 30 } },
    ] }
    expect(sheetBounds(p, 'overview', 'overview')).toMatchObject({ x: 1520, y: 30 })
    expect(sheetsToExport(p, 'overview').map(s => s.id)).toContain('overview')
  })
})
