// Couleurs des fichiers produits (PDF, SVG, DXF, draw.io). Module pur, sans dépendance. Les
// variables CSS de styles/tokens.css ne s'appliquent pas dans ces fichiers : ils sont ouverts hors
// de l'application et imprimés sur papier blanc, quel que soit le thème. Toutes les couleurs fixes
// des exports sont donc réunies ici.
// Les couleurs des signaux, elles, restent des variables CSS résolues en thème clair (io/pdf.ts).

export const PRINT_COLORS = {
  /** Papier : fond de la capture du schéma et des plans SVG, remplissage des équipements d'un plan */
  paper: '#ffffff',
  /** Couleur par défaut du filigrane */
  watermark: '#282828',
  /** Liaison sans signal reconnu (échange draw.io, Visio) */
  neutralEdge: '#666666',
  /** Trait attribué aux contours d'un DXF pour le moteur de reconnaissance de l'import PDF */
  cadStroke: '#000000',

  /** Niveaux de gris jsPDF, de 0 (noir) à 255 (blanc), des planches PDF (cartouche, légende, baies, plans) */
  gray: {
    /** Valeurs du cartouche et de l'historique, contour renforcé du cartouche */
    ink: 20,
    /** Texte des planches dessinées (baies, plans d'implantation) */
    text: 30,
    /** Cadre de la planche, traits du cartouche, titre de la légende, équipements sur un plan */
    line: 40,
    /** Titre complémentaire du cartouche */
    subtitle: 60,
    /** Coordonnées du propriétaire légal */
    detail: 70,
    /** Repère d'assemblage d'une page découpée */
    tile: 90,
    /** Libellés des cellules du cartouche et en-têtes de l'historique */
    label: 110,
    /** Mention « AV Diagram » sous le cartouche */
    signature: 140,
    /** Graduations d'une baie, contour et fond d'un plan */
    grid: 160,
  },

  /** Élévation de baie (PDF) */
  rack: {
    /** Remplissage d'un équipement monté, en RVB */
    fill: [238, 242, 247],
    /** Contour d'un équipement monté */
    stroke: '#455a70',
    /** Contour d'un équipement mal monté (hauteur, face ou chevauchement) */
    invalid: '#c22525',
  },

  /** Plan d'implantation (SVG) */
  plan: {
    /** Contour d'un équipement */
    equipmentStroke: '#24364b',
    /** Fond de plan (DXF importé) et contour de la salle */
    background: '#89909a',
    /** Textes du plan et noms des équipements */
    text: '#41464d',
  },
} as const
