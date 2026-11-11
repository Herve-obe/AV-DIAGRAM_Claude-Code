import { describe, expect, it } from 'vitest'

describe('routage des liaisons', () => {
  const crosses = (pts: { x: number; y: number }[], r: { x: number; y: number; w: number; h: number }) =>
    pts.slice(0, -1).some((a, i) => {
      const b = pts[i + 1]
      // Échantillonnage du segment
      for (let k = 0; k <= 20; k++) {
        const x = a.x + ((b.x - a.x) * k) / 20
        const y = a.y + ((b.y - a.y) * k) / 20
        if (x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h) return true
      }
      return false
    })

  it('contourne un bloc placé entre deux équipements, avec des segments orthogonaux', async () => {
    const { routeAll } = await import('./routing')
    const a = { x: 0, y: 0, w: 100, h: 100 }
    const mid = { x: 250, y: -20, w: 100, h: 140 }
    const b = { x: 500, y: 0, w: 100, h: 100 }
    const r = routeAll([a, mid, b], [{ id: 'l', source: { x: 100, y: 50, side: 'right' }, target: { x: 500, y: 50, side: 'left' } }])
    const pts = r.get('l')!
    expect(pts[0]).toEqual({ x: 100, y: 50 })
    expect(pts[pts.length - 1]).toEqual({ x: 500, y: 50 })
    expect(crosses(pts, mid)).toBe(false)
    for (let i = 0; i < pts.length - 1; i++) expect(pts[i].x === pts[i + 1].x || pts[i].y === pts[i + 1].y).toBe(true)
  })

  it('va droit quand rien ne gêne', async () => {
    const { routeAll } = await import('./routing')
    const r = routeAll([{ x: 0, y: 0, w: 100, h: 100 }, { x: 300, y: 0, w: 100, h: 100 }], [
      { id: 'l', source: { x: 100, y: 40, side: 'right' }, target: { x: 300, y: 40, side: 'left' } },
    ])
    expect(r.get('l')).toEqual([{ x: 100, y: 40 }, { x: 300, y: 40 }])
  })

  it('relie des ports en haut et en bas (bloc pivoté) par des amorces verticales', async () => {
    const { routeAll } = await import('./routing')
    const a = { x: 0, y: 0, w: 100, h: 60 }
    const b = { x: 300, y: 200, w: 100, h: 60 }
    const r = routeAll([a, b], [{ id: 'v', source: { x: 50, y: 60, side: 'bottom' }, target: { x: 350, y: 200, side: 'top' } }])
    const pts = r.get('v')!
    expect(pts[0]).toEqual({ x: 50, y: 60 })
    expect(pts[pts.length - 1]).toEqual({ x: 350, y: 200 })
    // Sortie vers le bas, arrivée par le haut
    expect(pts[1].x).toBe(50)
    expect(pts[1].y).toBeGreaterThan(60)
    expect(pts[pts.length - 2].x).toBe(350)
    expect(pts[pts.length - 2].y).toBeLessThan(200)
    expect(crosses(pts, a) || crosses(pts, b)).toBe(false)
    for (let i = 0; i < pts.length - 1; i++) expect(pts[i].x === pts[i + 1].x || pts[i].y === pts[i + 1].y).toBe(true)
  })

  it('contourne le bloc de départ quand la sortie est du mauvais côté (bloc retourné)', async () => {
    const { routeAll } = await import('./routing')
    const a = { x: 0, y: 0, w: 100, h: 60 }
    const b = { x: 300, y: 0, w: 100, h: 60 }
    // Sortie à gauche du bloc A alors que la cible est à droite : le tracé doit faire le tour
    const r = routeAll([a, b], [{ id: 'f', source: { x: 0, y: 30, side: 'left' }, target: { x: 300, y: 30, side: 'left' } }])
    const pts = r.get('f')!
    expect(pts[1].x).toBeLessThan(0)
    expect(crosses(pts, { x: a.x + 1, y: a.y + 1, w: a.w - 2, h: a.h - 2 })).toBe(false)
  })

  it('place les étiquettes sans chevauchement', async () => {
    const { placeLabels } = await import('./routing')
    const routes = new Map([
      ['a', [{ x: 0, y: 0 }, { x: 300, y: 0 }]],
      ['b', [{ x: 0, y: 8 }, { x: 300, y: 8 }]],
    ])
    const size = { w: 80, h: 16 }
    const at = placeLabels(routes, new Map([['a', size], ['b', size]]), [])
    const a = at.get('a')!
    const b = at.get('b')!
    const overlap = Math.abs(a.x - b.x) < size.w && Math.abs(a.y - b.y) < size.h
    expect(overlap).toBe(false)
  })

  it('écarte deux tronçons verticaux superposés', async () => {
    const { nudge } = await import('./routing')
    const routes = [
      [{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 50, y: 100 }, { x: 100, y: 100 }],
      [{ x: 0, y: 20 }, { x: 50, y: 20 }, { x: 50, y: 120 }, { x: 100, y: 120 }],
    ]
    const out = nudge(routes, 8, 12)
    expect(out[0][1].x).not.toBe(out[1][1].x)
    expect(Math.abs(out[0][1].x - out[1][1].x)).toBe(8)
    // Les amorces gardent la hauteur des ports
    expect(out[0][0].y).toBe(0)
    expect(out[1][3].y).toBe(120)
  })
})

describe('voies ordonnées dans les couloirs', () => {
  /** Croisements entre segments verticaux et horizontaux de tracés différents */
  const crossings = (routes: { x: number; y: number }[][]) => {
    let n = 0
    const segs = routes.map((r) => r.slice(1).map((b, i) => [r[i], b] as const))
    for (let i = 0; i < segs.length; i++) for (let j = 0; j < segs.length; j++) {
      if (i === j) continue
      for (const [a, b] of segs[i]) for (const [c, d] of segs[j]) {
        if (a.x !== b.x || c.y !== d.y) continue
        const [y0, y1] = [Math.min(a.y, b.y), Math.max(a.y, b.y)]
        const [x0, x1] = [Math.min(c.x, d.x), Math.max(c.x, d.x)]
        if (a.x > x0 && a.x < x1 && c.y > y0 && c.y < y1) n++
      }
    }
    return n
  }
  it('sept micros en colonne vers sept entrées : aucune liaison ne se croise, et un coude manuel est respecté', async () => {
    const { routeAll } = await import('./routing')
    const obstacles = [...Array.from({ length: 7 }, (_, k) => ({ x: 100 + k * 25, y: k * 70, w: 140, h: 50 })), { x: 700, y: 0, w: 220, h: 420 }]
    const requests = Array.from({ length: 7 }, (_, k) => ({
      id: `l${k}`,
      source: { x: 240 + k * 25, y: k * 70 + 40, side: 'right' as const },
      target: { x: 700, y: 40 + k * 18, side: 'left' as const },
    }))
    const routes = routeAll(obstacles, requests)
    expect(crossings([...routes.values()])).toBe(0)
    const bent = routeAll(obstacles, [{ ...requests[3], bendX: 500 }])
    expect(bent.get('l3')!.some((p) => p.x === 500)).toBe(true)
  })
})
