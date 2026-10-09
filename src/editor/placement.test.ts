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
