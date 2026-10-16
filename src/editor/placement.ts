// Placement d'un bloc ajouté sans glisser (double-clic, Entrée dans la bibliothèque) : à partir du
// centre de la vue, le bloc est décalé vers la droite tant qu'il chevauche un bloc existant, pour que
// les ajouts successifs se rangent côte à côte au lieu de s'empiler.

export interface Rect { x: number; y: number; w: number; h: number }

/** Taille supposée d'un bloc pas encore dessiné (sa taille réelle dépend de ses ports) */
export const NEW_BLOCK_SIZE = { w: 220, h: 140 }

const snap = (v: number) => Math.round(v / 10) * 10

export function freeSpot(start: { x: number; y: number }, size: { w: number; h: number }, rects: Rect[], gap = 40): { x: number; y: number } {
  let x = snap(start.x)
  const y = snap(start.y)
  for (let i = 0; i < 500; i++) {
    const hit = rects.find((r) => x < r.x + r.w + gap && x + size.w + gap > r.x && y < r.y + r.h + gap && y + size.h + gap > r.y)
    if (!hit) return { x, y }
    x = snap(hit.x + hit.w + gap)
  }
  return { x, y }
}
