import { describe, expect, it, vi } from 'vitest'
import type { Edge, InternalNode, Node } from '@xyflow/react'
import { createProject } from '../model/project'
import { drawingBounds, endOf } from './EdgeRouter'
import { fitToPage } from './PageGrid'

type Handle = { id: string; x: number; y: number; width: number; height: number; position: 'left' | 'right' | 'top' | 'bottom' }

/** Nœud interne minimal : position absolue (50, 100) et poignées mesurées. */
function internal(handles: Handle[], source: Handle[] = []): InternalNode<Node> {
  return {
    id: 'n', position: { x: 50, y: 100 }, data: {},
    internals: { positionAbsolute: { x: 50, y: 100 }, handleBounds: { source, target: handles } },
  } as unknown as InternalNode<Node>
}

describe('endOf : point d’attache d’un câble sur une poignée', () => {
  const h = (position: Handle['position']): Handle => ({ id: 'p', x: 10, y: 20, width: 8, height: 6, position })

  it('à gauche : bord extérieur gauche, au milieu de la hauteur', () => {
    expect(endOf(internal([h('left')]), 'p')).toEqual({ x: 60, y: 123, side: 'left' })
  })

  it('à droite : bord extérieur droit', () => {
    expect(endOf(internal([], [h('right')]), 'p')).toEqual({ x: 68, y: 123, side: 'right' })
  })

  it('en haut et en bas (bloc pivoté) : milieu du bord extérieur', () => {
    expect(endOf(internal([h('top')]), 'p')).toEqual({ x: 64, y: 120, side: 'top' })
    expect(endOf(internal([h('bottom')]), 'p')).toEqual({ x: 64, y: 126, side: 'bottom' })
  })

  it('renvoie null sans nœud, sans mesure ou pour une poignée inconnue', () => {
    expect(endOf(undefined, 'p')).toBeNull()
    expect(endOf({ internals: { positionAbsolute: { x: 0, y: 0 } } } as unknown as InternalNode<Node>, 'p')).toBeNull()
    expect(endOf(internal([h('left')]), 'autre')).toBeNull()
    expect(endOf(internal([h('left')]), null)).toBeNull()
  })
})

describe('drawingBounds : encombrement du dessin', () => {
  const node = (id: string, x: number, y: number, w: number, h: number, hidden = false) => ({ id, position: { x, y }, data: {}, measured: { width: w, height: h }, hidden }) as Node
  const empty = { routes: new Map(), labels: new Map() }

  it('vaut null pour un schéma vide', () => {
    expect(drawingBounds([], [], empty)).toBeNull()
  })

  it('englobe les blocs visibles et ignore les blocs masqués', () => {
    const b = drawingBounds([node('a', 0, 0, 100, 50), node('b', 300, 200, 100, 50), node('c', 5000, 5000, 100, 100, true)], [], empty)
    expect(b).toEqual({ x: 0, y: 0, w: 400, h: 250 })
  })

  it('un détour de câble qui sort des blocs agrandit l’encombrement, sauf si la liaison est masquée', () => {
    const nodes = [node('a', 0, 0, 100, 50)]
    const routes = new Map([['e1', [{ x: 100, y: 25 }, { x: 600, y: 25 }, { x: 600, y: 400 }]], ['e2', [{ x: 9000, y: 9000 }]]])
    const edges = [{ id: 'e1', source: 'a', target: 'b' }, { id: 'e2', source: 'a', target: 'b', hidden: true }] as Edge[]
    const b = drawingBounds(nodes, edges, { routes, labels: new Map() })!
    expect(b.x + b.w).toBeGreaterThanOrEqual(600)
    expect(b.y + b.h).toBeGreaterThanOrEqual(400)
    expect(b.x + b.w).toBeLessThan(9000)
  })

  it('l’étiquette d’une liaison compte seulement si elle est affichée (cochée, sélectionnée ou en alerte)', () => {
    const nodes = [node('a', 0, 0, 100, 50)]
    const routes = new Map([['e1', [{ x: 100, y: 25 }]]])
    const labels = new Map([['e1', { x: 2000, y: 25 }]])
    const mk = (extra: Partial<Edge>, data: object) => [{ id: 'e1', source: 'a', target: 'b', data: { label: 'AN-001', ...data }, ...extra }] as Edge[]
    const width = (edges: Edge[]) => drawingBounds(nodes, edges, { routes, labels })!.w
    expect(width(mk({}, {}))).toBeLessThan(200)
    expect(width(mk({}, { showLabel: true }))).toBeGreaterThan(1900)
    expect(width(mk({ selected: true }, {}))).toBeGreaterThan(1900)
    expect(width(mk({}, { severity: 'error' }))).toBeGreaterThan(1900)
  })

})

describe('fitToPage : recadrage sur les pages (touche F)', () => {
  it('recadre sur un nombre entier de pages qui englobe le dessin', () => {
    const fitBounds = vi.fn()
    const nodes = [{ id: 'a', position: { x: 100, y: 200 }, data: {}, measured: { width: 300, height: 120 } }] as Node[]
    fitToPage({ fitBounds, getNodes: () => nodes, getEdges: () => [] } as never, createProject('P'), 0)
    expect(fitBounds).toHaveBeenCalledOnce()
    const [box, opts] = fitBounds.mock.calls[0]
    expect(box.x).toBeLessThanOrEqual(100)
    expect(box.y).toBeLessThanOrEqual(200)
    expect(box.x + box.width).toBeGreaterThanOrEqual(400)
    expect(box.y + box.height).toBeGreaterThanOrEqual(320)
    expect(opts).toMatchObject({ duration: 0 })
  })
})
