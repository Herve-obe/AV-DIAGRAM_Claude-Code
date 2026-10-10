import { describe, expect, it } from 'vitest'
import { freeSpot } from './placement'

describe('placement des blocs ajoutés par double-clic', () => {
  it('garde la position quand la place est libre', () => {
    expect(freeSpot({ x: 0, y: 0 }, { w: 200, h: 100 }, [])).toEqual({ x: 0, y: 0 })
  })
  it('se range à droite des blocs déjà posés, côte à côte', () => {
    const rects = [{ x: 0, y: 0, w: 200, h: 100 }, { x: 240, y: 0, w: 200, h: 100 }]
    expect(freeSpot({ x: 0, y: 0 }, { w: 200, h: 100 }, rects)).toEqual({ x: 480, y: 0 })
  })
  it('ignore les blocs placés sur une autre ligne', () => {
    expect(freeSpot({ x: 0, y: 0 }, { w: 200, h: 100 }, [{ x: 0, y: 400, w: 200, h: 100 }])).toEqual({ x: 0, y: 0 })
  })
})

describe('alignement et répartition', () => {
  const boxes = [
    { id: 'a', x: 0, y: 0, w: 100, h: 50 },
    { id: 'b', x: 300, y: 110, w: 200, h: 80 },
    { id: 'c', x: 120, y: 400, w: 100, h: 50 },
  ]
  it('aligne les bords et les centres sur ceux de l\'ensemble', async () => {
    const { arrange } = await import('./arrange')
    expect([...arrange(boxes, 'left').values()].map((p) => p.x)).toEqual([0, 0, 0])
    expect(arrange(boxes, 'right').get('a')!.x).toBe(400)
    expect(arrange(boxes, 'centerX').get('b')!.x).toBe(150)
    expect(arrange(boxes, 'top').get('c')!.y).toBe(0)
  })
  it('répartit avec des écarts égaux et empile en colonne', async () => {
    const { arrange, STACK_GAP } = await import('./arrange')
    const d = arrange(boxes, 'distributeY')
    // hauteur totale 450, blocs 180 : deux écarts de 135
    expect(d.get('a')!.y).toBe(0)
    expect(d.get('b')!.y).toBe(190)
    expect(d.get('c')!.y).toBe(400)
    const c = arrange(boxes, 'column')
    expect(c.get('b')!.y).toBe(50 + STACK_GAP)
    expect(new Set([...c.values()].map((p) => p.x))).toEqual(new Set([0]))
  })
})
