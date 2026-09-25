// Routage automatique des liaisons : tracés orthogonaux qui contournent les blocs, puis écartement
// des tronçons superposés en voies parallèles. Module pur (sans React), testé dans model.test.ts.
//
// Méthode :
// 1. Chaque liaison sort de son port par un court segment horizontal (« amorce »).
// 2. On construit une grille « de Hanan » : droites passant par les bords des blocs (avec une marge)
//    et par les amorces. Un plus court chemin (A*) y relie les amorces ; chaque coude est pénalisé,
//    ce qui donne des tracés simples. Les blocs, gonflés de la marge, sont infranchissables.
// 3. Les tronçons de liaisons différentes qui se superposent sont écartés les uns des autres.

export interface Point {
  x: number
  y: number
}
export interface Rect {
  x: number
  y: number
  w: number
  h: number
}
export type Side = 'left' | 'right'
export interface RouteEnd extends Point {
  side: Side
}
export interface RouteRequest {
  id: string
  source: RouteEnd
  target: RouteEnd
}

export interface RoutingOptions {
  /** Distance minimale entre un tracé et un bloc */
  margin: number
  /** Longueur de l'amorce à la sortie d'un port */
  stub: number
  /** Coût d'un coude, en pixels de longueur équivalente */
  bendCost: number
  /** Écart entre deux voies parallèles */
  spacing: number
}

export const DEFAULT_ROUTING: RoutingOptions = { margin: 14, stub: 22, bendCost: 60, spacing: 7 }

const dirX = (s: Side) => (s === 'right' ? 1 : -1)

/** Supprime les points alignés inutiles et les doublons. */
export function simplify(points: Point[]): Point[] {
  const out: Point[] = []
  for (const p of points) {
    const last = out[out.length - 1]
    if (last && last.x === p.x && last.y === p.y) continue
    if (out.length >= 2) {
      const a = out[out.length - 2]
      const b = last
      if ((a.x === b.x && b.x === p.x) || (a.y === b.y && b.y === p.y)) out[out.length - 1] = p
      else out.push(p)
    } else out.push(p)
  }
  return out
}

/** Tracé de secours en trois segments, sans évitement. */
function fallback(s: Point, t: Point): Point[] {
  const mx = Math.round((s.x + t.x) / 2)
  return [s, { x: mx, y: s.y }, { x: mx, y: t.y }, t]
}

/** File de priorité sur tableaux typés (clé réelle, valeur entière). */
class MinHeap {
  private k = new Float64Array(1024)
  private v = new Int32Array(1024)
  size = 0
  clear() {
    this.size = 0
  }
  push(key: number, val: number) {
    if (this.size === this.k.length) {
      const k = new Float64Array(this.size * 2)
      const v = new Int32Array(this.size * 2)
      k.set(this.k)
      v.set(this.v)
      this.k = k
      this.v = v
    }
    const { k, v } = this
    let i = this.size++
    while (i > 0) {
      const p = (i - 1) >> 1
      if (k[p] <= key) break
      k[i] = k[p]
      v[i] = v[p]
      i = p
    }
    k[i] = key
    v[i] = val
  }
  pop(): number {
    const { k, v } = this
    const top = v[0]
    const n = --this.size
    if (n > 0) {
      const key = k[n]
      const val = v[n]
      let i = 0
      for (;;) {
        const l = 2 * i + 1
        if (l >= n) break
        const r = l + 1
        const m = r < n && k[r] < k[l] ? r : l
        if (k[m] >= key) break
        k[i] = k[m]
        v[i] = v[m]
        i = m
      }
      k[i] = key
      v[i] = val
    }
    return top
  }
}

/** Grille partagée par toutes les liaisons d'un même calcul. */
class Grid {
  xs: number[]
  ys: number[]
  /** blocked[i] : le point (ix, iy) est dans un obstacle */
  private blocked: Uint8Array
  /** passage horizontal entre (ix, iy) et (ix+1, iy) interdit */
  private hWall: Uint8Array
  /** passage vertical entre (ix, iy) et (ix, iy+1) interdit */
  private vWall: Uint8Array
  // Tableaux de calcul réutilisés d'un tracé à l'autre ; stamp indique s'ils sont à jour pour le calcul en cours
  private cost: Float64Array
  private prev: Int32Array
  private stamp: Int32Array
  private gen = 0
  private heap = new MinHeap()

  constructor(xs: number[], ys: number[], obstacles: Rect[]) {
    this.xs = xs
    this.ys = ys
    const nx = xs.length
    const ny = ys.length
    this.blocked = new Uint8Array(nx * ny)
    this.hWall = new Uint8Array(nx * ny)
    this.vWall = new Uint8Array(nx * ny)
    this.cost = new Float64Array(nx * ny * 4)
    this.prev = new Int32Array(nx * ny * 4)
    this.stamp = new Int32Array(nx * ny * 4)
    // Marquage bloc par bloc : seuls les points et passages couverts sont parcourus
    const first = (v: number[], min: number) => {
      let lo = 0
      let hi = v.length
      while (lo < hi) {
        const mid = (lo + hi) >> 1
        if (v[mid] <= min) lo = mid + 1
        else hi = mid
      }
      return lo
    }
    for (const r of obstacles) {
      const x0 = r.x
      const x1 = r.x + r.w
      const y0 = r.y
      const y1 = r.y + r.h
      // Lignes strictement à l'intérieur du bloc
      const iy0 = first(ys, y0)
      const ix0 = first(xs, x0)
      for (let iy = iy0; iy < ny && ys[iy] < y1; iy++) {
        for (let ix = ix0; ix < nx && xs[ix] < x1; ix++) this.blocked[iy * nx + ix] = 1
        // Passage horizontal dont le milieu est dans le bloc
        for (let ix = Math.max(0, ix0 - 1); ix < nx - 1 && xs[ix] < x1; ix++) {
          const m = (xs[ix] + xs[ix + 1]) / 2
          if (m > x0 && m < x1) this.hWall[iy * nx + ix] = 1
        }
      }
      for (let ix = ix0; ix < nx && xs[ix] < x1; ix++) {
        for (let iy = Math.max(0, iy0 - 1); iy < ny - 1 && ys[iy] < y1; iy++) {
          const m = (ys[iy] + ys[iy + 1]) / 2
          if (m > y0 && m < y1) this.vWall[iy * nx + ix] = 1
        }
      }
    }
  }

  /** Plus court chemin avec pénalité de coude. Directions : 0 droite, 1 gauche, 2 bas, 3 haut. */
  path(from: Point, fromDir: number, to: Point, toDir: number, bendCost: number): Point[] | null {
    const { xs, ys } = this
    const nx = xs.length
    const sx = xs.indexOf(from.x)
    const sy = ys.indexOf(from.y)
    const tx = xs.indexOf(to.x)
    const ty = ys.indexOf(to.y)
    if (sx < 0 || sy < 0 || tx < 0 || ty < 0) return null
    const { cost, prev, stamp } = this
    const gen = ++this.gen
    const costOf = (s: number) => (stamp[s] === gen ? cost[s] : Infinity)
    const heap = this.heap
    heap.clear()
    const h = (ix: number, iy: number) => Math.abs(xs[ix] - xs[tx]) + Math.abs(ys[iy] - ys[ty])
    if (sx === tx && sy === ty) return [from]
    const start = (sy * nx + sx) * 4 + fromDir
    cost[start] = 0
    prev[start] = -1
    stamp[start] = gen
    heap.push(h(sx, sy), start)
    const DX = [1, -1, 0, 0]
    const DY = [0, 0, 1, -1]
    let goal = -1
    while (heap.size) {
      const s = heap.pop()
      const dir = s & 3
      const cell = s >> 2
      const ix = cell % nx
      const iy = (cell - ix) / nx
      // La pénalité d'arrivée hors de l'axe du port est déjà comptée : le premier état atteint est le meilleur
      if (ix === tx && iy === ty) {
        goal = s
        break
      }
      const c = cost[s]
      for (let d = 0; d < 4; d++) {
        // Pas de demi-tour
        if ((d ^ 1) === dir && d >> 1 === dir >> 1) continue
        const jx = ix + DX[d]
        const jy = iy + DY[d]
        if (jx < 0 || jy < 0 || jx >= nx || jy >= ys.length) continue
        if (this.blocked[jy * nx + jx] && !(jx === tx && jy === ty)) continue
        if (d === 0 && this.hWall[iy * nx + ix]) continue
        if (d === 1 && this.hWall[iy * nx + jx]) continue
        if (d === 2 && this.vWall[iy * nx + ix]) continue
        if (d === 3 && this.vWall[jy * nx + ix]) continue
        const step = Math.abs(xs[jx] - xs[ix]) + Math.abs(ys[jy] - ys[iy])
        let nc = c + step + (d !== dir ? bendCost : 0)
        if (jx === tx && jy === ty && d !== toDir) nc += bendCost
        const ns = (jy * nx + jx) * 4 + d
        if (nc < costOf(ns)) {
          cost[ns] = nc
          prev[ns] = s
          stamp[ns] = gen
          heap.push(nc + h(jx, jy), ns)
        }
      }
    }
    if (goal < 0) return null
    const pts: Point[] = []
    for (let s = goal; s >= 0; s = prev[s]) {
      const cell = s >> 2
      const ix = cell % nx
      pts.push({ x: xs[ix], y: ys[(cell - ix) / nx] })
    }
    return pts.reverse()
  }
}

interface Seg {
  route: number
  /** Indice du premier point du segment dans le tracé */
  i: number
  fixed: number
  lo: number
  hi: number
}

/**
 * Écarte les segments superposés : pour chaque droite (même x pour les verticaux, même y pour les
 * horizontaux), les segments de tracés différents qui se chevauchent reçoivent chacun une voie.
 * Les amorces (premier et dernier segment) gardent la hauteur de leur port.
 */
export function nudge(routes: Point[][], spacing: number, maxShift: number): Point[][] {
  const out = routes.map((r) => r.map((p) => ({ ...p })))
  for (const vertical of [true, false]) {
    const byLine = new Map<number, Seg[]>()
    out.forEach((pts, route) => {
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i]
        const b = pts[i + 1]
        const isV = a.x === b.x && a.y !== b.y
        const isH = a.y === b.y && a.x !== b.x
        if (vertical ? !isV : !isH) continue
        // Amorces horizontales : fixées à la hauteur du port
        if (!vertical && (i === 0 || i === pts.length - 2)) continue
        const fixed = vertical ? a.x : a.y
        const lo = vertical ? Math.min(a.y, b.y) : Math.min(a.x, b.x)
        const hi = vertical ? Math.max(a.y, b.y) : Math.max(a.x, b.x)
        const list = byLine.get(fixed) ?? []
        list.push({ route, i, fixed, lo, hi })
        byLine.set(fixed, list)
      }
    })
    for (const segs of byLine.values()) {
      if (segs.length < 2) continue
      segs.sort((a, b) => a.lo - b.lo)
      // Groupes de segments qui se chevauchent (de proche en proche)
      const clusters: Seg[][] = []
      let cur: Seg[] = []
      let end = -Infinity
      for (const s of segs) {
        if (cur.length && s.lo >= end) {
          clusters.push(cur)
          cur = []
          end = -Infinity
        }
        cur.push(s)
        end = Math.max(end, s.hi)
      }
      if (cur.length) clusters.push(cur)
      for (const cl of clusters) {
        const routesIn = [...new Set(cl.map((s) => s.route))]
        if (routesIn.length < 2) continue
        // Ordre des voies : selon la position de l'autre extrémité, pour limiter les croisements
        const key = (r: number) => {
          const pts = out[r]
          return vertical ? pts[pts.length - 1].y + pts[0].y / 1000 : pts[pts.length - 1].x + pts[0].x / 1000
        }
        routesIn.sort((a, b) => key(a) - key(b))
        const step = Math.min(spacing, (2 * maxShift) / (routesIn.length - 1))
        routesIn.forEach((r, k) => {
          const shift = Math.round((k - (routesIn.length - 1) / 2) * step)
          if (!shift) return
          for (const s of cl.filter((x) => x.route === r)) {
            const pts = out[r]
            if (vertical) {
              pts[s.i].x = s.fixed + shift
              pts[s.i + 1].x = s.fixed + shift
            } else {
              pts[s.i].y = s.fixed + shift
              pts[s.i + 1].y = s.fixed + shift
            }
          }
        })
      }
    }
  }
  return out
}

/** Calcule le tracé de toutes les liaisons. */
export function routeAll(obstacles: Rect[], requests: RouteRequest[], opts: RoutingOptions = DEFAULT_ROUTING): Map<string, Point[]> {
  const result = new Map<string, Point[]>()
  if (!requests.length) return result
  const m = opts.margin
  const inflated = obstacles.map((r) => ({ x: r.x - m, y: r.y - m, w: r.w + 2 * m, h: r.h + 2 * m }))
  const stubs = requests.map((r) => ({
    s: { x: Math.round(r.source.x + dirX(r.source.side) * opts.stub), y: Math.round(r.source.y) },
    t: { x: Math.round(r.target.x + dirX(r.target.side) * opts.stub), y: Math.round(r.target.y) },
  }))
  const xsSet = new Set<number>()
  const ysSet = new Set<number>()
  for (const r of inflated) {
    xsSet.add(Math.round(r.x))
    xsSet.add(Math.round(r.x + r.w))
    ysSet.add(Math.round(r.y))
    ysSet.add(Math.round(r.y + r.h))
  }
  for (const { s, t } of stubs) {
    xsSet.add(s.x)
    xsSet.add(t.x)
    ysSet.add(s.y)
    ysSet.add(t.y)
  }
  // Couloirs au milieu des espaces entre blocs : tracés plus aérés
  const addMid = (set: Set<number>) => {
    const v = [...set].sort((a, b) => a - b)
    for (let i = 0; i < v.length - 1; i++) if (v[i + 1] - v[i] > 4 * m) set.add(Math.round((v[i] + v[i + 1]) / 2))
  }
  addMid(xsSet)
  addMid(ysSet)
  const xs = [...xsSet].sort((a, b) => a - b)
  const ys = [...ysSet].sort((a, b) => a - b)
  const grid = new Grid(xs, ys, inflated)

  const raw: Point[][] = requests.map((r, k) => {
    const { s, t } = stubs[k]
    const sDir = r.source.side === 'right' ? 0 : 1
    // Arrivée sur l'amorce cible en allant vers le port
    const tDir = r.target.side === 'right' ? 1 : 0
    const mid = grid.path(s, sDir, t, tDir, opts.bendCost) ?? fallback(s, t)
    return simplify([{ x: r.source.x, y: r.source.y }, ...mid, { x: r.target.x, y: r.target.y }])
  })
  const nudged = nudge(raw, opts.spacing, m - 2)
  requests.forEach((r, k) => result.set(r.id, simplify(nudged[k])))
  return result
}

/** Chemin SVG à coins arrondis. */
export function toSvgPath(points: Point[], radius = 6): string {
  if (points.length < 2) return ''
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i - 1]
    const c = points[i]
    const n = points[i + 1]
    const r = Math.min(radius, Math.hypot(c.x - p.x, c.y - p.y) / 2, Math.hypot(n.x - c.x, n.y - c.y) / 2)
    const ax = c.x - Math.sign(c.x - p.x) * r
    const ay = c.y - Math.sign(c.y - p.y) * r
    const bx = c.x + Math.sign(n.x - c.x) * r
    const by = c.y + Math.sign(n.y - c.y) * r
    d += ` L ${ax} ${ay} Q ${c.x} ${c.y} ${bx} ${by}`
  }
  const last = points[points.length - 1]
  return `${d} L ${last.x} ${last.y}`
}

/** Position de l'étiquette : milieu du plus long segment (horizontal de préférence). */
export function labelPoint(points: Point[]): Point {
  let best = { len: -1, x: points[0]?.x ?? 0, y: points[0]?.y ?? 0 }
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]
    const b = points[i + 1]
    const len = Math.abs(b.x - a.x) * 1.2 + Math.abs(b.y - a.y)
    if (len > best.len) best = { len, x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
  }
  return { x: best.x, y: best.y }
}

/**
 * Place les étiquettes de câble sans chevauchement : pour chaque tracé, on essaie plusieurs points
 * le long des segments (horizontaux et longs d'abord) et on garde le premier qui ne touche ni une
 * étiquette déjà placée ni un bloc. À défaut, milieu du plus long segment.
 */
export function placeLabels(routes: Map<string, Point[]>, sizes: Map<string, { w: number; h: number }>, obstacles: Rect[]): Map<string, Point> {
  const placed: Rect[] = []
  const out = new Map<string, Point>()
  const hits = (r: Rect, list: Rect[]) => list.some((o) => r.x < o.x + o.w && r.x + r.w > o.x && r.y < o.y + o.h && r.y + r.h > o.y)
  for (const [id, pts] of routes) {
    const size = sizes.get(id)
    if (!size || pts.length < 2) continue
    const segs = pts.slice(0, -1).map((a, i) => {
      const b = pts[i + 1]
      const horizontal = a.y === b.y
      return { a, b, horizontal, len: Math.abs(b.x - a.x) + Math.abs(b.y - a.y) }
    })
    segs.sort((s, t) => Number(t.horizontal) - Number(s.horizontal) || t.len - s.len)
    let chosen: Point | null = null
    for (const s of segs) {
      const need = s.horizontal ? size.w + 8 : size.h + 8
      if (s.len < need) continue
      for (const f of [0.5, 0.3, 0.7, 0.15, 0.85]) {
        const p = { x: s.a.x + (s.b.x - s.a.x) * f, y: s.a.y + (s.b.y - s.a.y) * f }
        const box = { x: p.x - size.w / 2 - 2, y: p.y - size.h / 2 - 2, w: size.w + 4, h: size.h + 4 }
        if (!hits(box, placed) && !hits(box, obstacles)) {
          chosen = p
          placed.push(box)
          break
        }
      }
      if (chosen) break
    }
    if (!chosen) {
      chosen = labelPoint(pts)
      placed.push({ x: chosen.x - size.w / 2, y: chosen.y - size.h / 2, w: size.w, h: size.h })
    }
    out.set(id, chosen)
  }
  return out
}
