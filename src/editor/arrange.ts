// Alignement et répartition des blocs sélectionnés (comme dans les logiciels de dessin).
// Module pur : rectangles en entrée, nouvelles positions (coin haut gauche) en sortie.

export interface Box {
  id: string
  x: number
  y: number
  w: number
  h: number
}

export type ArrangeAction =
  | 'left' | 'centerX' | 'right'
  | 'top' | 'centerY' | 'bottom'
  | 'distributeX' | 'distributeY'
  | 'column' | 'row'

/** Écart entre blocs pour « en colonne » et « en ligne », en px du schéma */
export const STACK_GAP = 30

const snap = (v: number) => Math.round(v / 10) * 10

/**
 * Nouvelles positions :
 * - aligner : bords gauches, centres, bords droits (ou hauts, milieux, bas) sur ceux de l'ensemble ;
 * - répartir : écarts égaux entre les blocs, les deux extrêmes restent en place ;
 * - en colonne / en ligne : empilés dans l'ordre (de haut en bas, de gauche à droite), alignés à gauche
 *   ou en haut, écart constant.
 */
export function arrange(boxes: Box[], action: ArrangeAction): Map<string, { x: number; y: number }> {
  const out = new Map<string, { x: number; y: number }>()
  if (boxes.length < 2) return out
  const minX = Math.min(...boxes.map((b) => b.x))
  const maxX = Math.max(...boxes.map((b) => b.x + b.w))
  const minY = Math.min(...boxes.map((b) => b.y))
  const maxY = Math.max(...boxes.map((b) => b.y + b.h))
  const set = (b: Box, x: number, y: number) => out.set(b.id, { x: snap(x), y: snap(y) })
  switch (action) {
    case 'left': for (const b of boxes) set(b, minX, b.y); break
    case 'right': for (const b of boxes) set(b, maxX - b.w, b.y); break
    case 'centerX': for (const b of boxes) set(b, (minX + maxX) / 2 - b.w / 2, b.y); break
    case 'top': for (const b of boxes) set(b, b.x, minY); break
    case 'bottom': for (const b of boxes) set(b, b.x, maxY - b.h); break
    case 'centerY': for (const b of boxes) set(b, b.x, (minY + maxY) / 2 - b.h / 2); break
    case 'distributeX':
    case 'distributeY': {
      const horiz = action === 'distributeX'
      const sorted = [...boxes].sort((a, b) => (horiz ? a.x - b.x : a.y - b.y))
      const total = sorted.reduce((s, b) => s + (horiz ? b.w : b.h), 0)
      const gap = ((horiz ? maxX - minX : maxY - minY) - total) / (sorted.length - 1)
      let at = horiz ? minX : minY
      for (const b of sorted) {
        if (horiz) set(b, at, b.y)
        else set(b, b.x, at)
        at += (horiz ? b.w : b.h) + gap
      }
      break
    }
    case 'column':
    case 'row': {
      const col = action === 'column'
      const sorted = [...boxes].sort((a, b) => (col ? a.y - b.y || a.x - b.x : a.x - b.x || a.y - b.y))
      let at = col ? minY : minX
      for (const b of sorted) {
        if (col) set(b, minX, at)
        else set(b, at, minY)
        at += (col ? b.h : b.w) + STACK_GAP
      }
      break
    }
  }
  return out
}
