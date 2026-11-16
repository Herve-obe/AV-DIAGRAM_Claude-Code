/** Types géométriques communs au canevas, au routage, à la mise en page et aux imports. */

export interface Point {
  x: number
  y: number
}

/** Rectangle aligné sur les axes : coin haut gauche, largeur et hauteur */
export interface Rect {
  x: number
  y: number
  w: number
  h: number
}
