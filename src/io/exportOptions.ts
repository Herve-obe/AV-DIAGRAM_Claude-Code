// Options d'export : formats de papier (ISO 216), disposition de la planche (cartouche, historique des
// indices, légende), échelle d'impression et découpage en pages, placement du filigrane. Fonctions
// pures : le dessin (PDF, image, SVG) est fait ailleurs à partir de ces calculs.
import type { Equipment, ExportSettings, PaperSize, Project, WatermarkSettings } from '../model/types'

/** Dimensions ISO 216 en mm, côté court x côté long */
const ISO_A: Record<PaperSize, [number, number]> = {
  A4: [210, 297],
  A3: [297, 420],
  A2: [420, 594],
  A1: [594, 841],
  A0: [841, 1189],
}

/** Taille d'une unité du schéma sur le papier à 100 % (mm) */
export const MM_PER_UNIT = 0.25

export const DEFAULT_EXPORT: ExportSettings = {
  paper: 'A3',
  orientation: 'landscape',
  scaleMode: 'fit',
  printScale: 100,
  watermark: {
    enabled: false,
    text: '{client} · {date} · NE PAS DIFFUSER',
    placement: 'tiled',
    zone: 'diagram',
    size: 'medium',
    color: '#282828',
    opacity: 0.12,
    images: true,
  },
  protection: { enabled: false, allowPrint: true, allowCopy: false, allowModify: false },
}

/** Réglages d'export du projet, complétés par les valeurs par défaut (anciens projets compris). */
export function exportSettingsOf(project: Project): ExportSettings {
  const e = (project.settings.export ?? {}) as Partial<ExportSettings> & { protect?: boolean }
  const { protect, ...rest } = e
  return {
    ...DEFAULT_EXPORT,
    ...rest,
    watermark: { ...DEFAULT_EXPORT.watermark, ...e.watermark },
    // Ancien réglage « protect » (case unique)
    protection: { ...DEFAULT_EXPORT.protection, ...(protect ? { enabled: true } : {}), ...e.protection },
  }
}

/** Taille de la page en mm selon le format et l'orientation. */
export function pageSize(paper: PaperSize, orientation: ExportSettings['orientation']): { w: number; h: number } {
  const [short, long] = ISO_A[paper]
  return orientation === 'landscape' ? { w: long, h: short } : { w: short, h: long }
}

/**
 * Texte du filigrane avec les champs du projet ; les champs vides et leurs séparateurs disparaissent.
 * recipient : export nominatif ; si le texte n'a pas de champ {recipient}, le nom est ajouté à la fin.
 */
export function watermarkText(template: string, project: Project, date = new Date(), recipient?: string): string {
  const info = project.info ?? {}
  const values: Record<string, string> = {
    client: info.client ?? '',
    project: project.name,
    date: date.toLocaleDateString(),
    revision: info.revision ?? '',
    number: info.docNumber ?? '',
    recipient: recipient ?? '',
  }
  const withRecipient = recipient && !template.includes('{recipient}') ? `${template} · {recipient}` : template
  return withRecipient
    .replace(/\{(client|project|date|revision|number|recipient)\}/g, (_, k: string) => values[k])
    .split('·')
    .map((s) => s.trim())
    .filter(Boolean)
    .join(' · ')
    .trim()
}

// ---------- Planche ----------

/** Cartouche : 180 mm de large au plus (tient sur la largeur d'un A4) */
export const TITLE_BLOCK = { w: 180, h: 48 }
/** Historique des indices au-dessus du cartouche : en-tête + 4 lignes au plus */
const REV_ROW = 5
export const MAX_REVISIONS = 4

export interface SheetLayout {
  w: number
  h: number
  margin: number
  titleBlock: { x: number; y: number; w: number; h: number }
  /** Historique des indices (hauteur 0 s'il n'y en a pas) */
  revisions: { x: number; y: number; w: number; h: number; rows: number }
  legend: { x: number; y: number; cols: number; colW: number; rowH: number }
  /** Zone du synoptique */
  area: { x: number; y: number; w: number; h: number }
}

/**
 * Disposition d'une planche : cartouche en bas à droite, historique des indices au-dessus ; légende à
 * gauche si la place suffit, sinon au-dessus ; le synoptique occupe le reste.
 */
export function sheetLayout(paper: PaperSize, orientation: ExportSettings['orientation'], legendItems: number, revisions = 0): SheetLayout {
  const { w, h } = pageSize(paper, orientation)
  const margin = paper === 'A4' ? 8 : 10
  const tbW = Math.min(TITLE_BLOCK.w, w - 2 * margin)
  const titleBlock = { x: w - margin - tbW, y: h - margin - TITLE_BLOCK.h, w: tbW, h: TITLE_BLOCK.h }
  const revRows = Math.min(revisions, MAX_REVISIONS)
  const revH = revRows ? (revRows + 1) * REV_ROW : 0
  const revisionsBox = { x: titleBlock.x, y: titleBlock.y - revH, w: tbW, h: revH, rows: revRows }
  const blockTop = revisionsBox.y
  const colW = 42
  const rowH = 7
  const beside = Math.floor((w - 2 * margin - tbW - 6) / colW)
  if (beside >= 3) {
    const rows = Math.ceil(legendItems / beside)
    const legendH = 10 + rows * rowH
    const bandTop = Math.min(blockTop, h - margin - legendH)
    return {
      w, h, margin, titleBlock, revisions: revisionsBox,
      legend: { x: margin, y: h - margin - legendH, cols: beside, colW, rowH },
      area: { x: margin, y: margin, w: w - 2 * margin, h: bandTop - margin - 4 },
    }
  }
  const cols = Math.max(1, Math.floor((w - 2 * margin) / colW))
  const rows = Math.ceil(legendItems / cols)
  const legendH = 10 + rows * rowH
  const legendY = blockTop - 4 - legendH
  return {
    w, h, margin, titleBlock, revisions: revisionsBox,
    legend: { x: margin, y: legendY, cols, colW, rowH },
    area: { x: margin, y: margin, w: w - 2 * margin, h: legendY - margin - 4 },
  }
}

// ---------- Échelle et pages ----------

export interface Bounds {
  x: number
  y: number
  w: number
  h: number
}

/** Encombrement approximatif d'un bloc (en-tête et rangées de ports), en unités du schéma */
export function estimateBlock(eq: Pick<Equipment, 'ports' | 'rotation'>): { w: number; h: number } {
  const ins = eq.ports.filter((p) => p.direction === 'in').length
  const outs = eq.ports.length - ins
  const rows = Math.max(ins, outs)
  const vertical = eq.rotation === 90 || eq.rotation === 270
  return vertical ? { w: Math.max(200, rows * 70), h: 120 } : { w: 240, h: 64 + rows * 20 }
}

/** Contenu d'une feuille (blocs et notes), avec une petite marge ; null si la feuille est vide. */
export function sheetBounds(project: Project, sheetId: string, defaultSheetId: string, measured?: Map<string, { w: number; h: number }>): Bounds | null {
  const boxes: Bounds[] = []
  for (const eq of Object.values(project.equipment)) {
    if ((eq.sheetId ?? defaultSheetId) !== sheetId) continue
    const size = measured?.get(eq.id) ?? estimateBlock(eq)
    boxes.push({ x: eq.position.x, y: eq.position.y, w: size.w, h: size.h })
  }
  for (const a of Object.values(project.annotations ?? {})) {
    if ((a.sheetId ?? defaultSheetId) !== sheetId) continue
    boxes.push({ x: a.position.x, y: a.position.y, w: a.size?.w ?? 200, h: a.size?.h ?? 80 })
  }
  if (!boxes.length) return null
  const pad = 30
  const x = Math.min(...boxes.map((b) => b.x)) - pad
  const y = Math.min(...boxes.map((b) => b.y)) - pad
  const r = Math.max(...boxes.map((b) => b.x + b.w)) + pad
  const b = Math.max(...boxes.map((b) => b.y + b.h)) + pad
  return { x, y, w: r - x, h: b - y }
}

/** Pages d'une feuille en taille fixe : grille de tuiles de la taille de la zone du schéma. */
export function tilesFor(bounds: Bounds, area: { w: number; h: number }, printScale: number): { cols: number; rows: number; tileW: number; tileH: number } {
  const mmPerUnit = (MM_PER_UNIT * printScale) / 100
  const tileW = area.w / mmPerUnit
  const tileH = area.h / mmPerUnit
  return { cols: Math.max(1, Math.ceil(bounds.w / tileW - 1e-6)), rows: Math.max(1, Math.ceil(bounds.h / tileH - 1e-6)), tileW, tileH }
}

/** Échelle (en %) à laquelle une feuille tient sur une page. */
export function fitScale(bounds: Bounds, area: { w: number; h: number }): number {
  return Math.min(area.w / (bounds.w * MM_PER_UNIT), area.h / (bounds.h * MM_PER_UNIT)) * 100
}

/** Repère d'une page dans l'assemblage : colonne en lettre, rangée en chiffre (A1, B1, A2...). */
export const tileRef = (col: number, row: number) => `${String.fromCharCode(65 + (col % 26))}${row + 1}`

// ---------- Filigrane ----------

export interface WatermarkItem {
  x: number
  y: number
  /** Degrés, sens trigonométrique (texte qui monte vers la droite) */
  angle: number
  size: number
  align: 'center' | 'left' | 'right'
}

const SIZE_FACTOR: Record<WatermarkSettings['size'], number> = { small: 0.6, medium: 1, large: 1.6 }

/** Largeur approximative d'un texte (Helvetica gras) : 0,6 fois la taille par caractère */
export const approxWidth = (text: string, size: number) => text.length * size * 0.6

/**
 * Position des textes du filigrane dans un rectangle w x h (unités quelconques, y vers le bas).
 * Les points sont le milieu (align center) ou l'extrémité (right) de la ligne de base.
 */
export function watermarkLayout(w: number, h: number, text: string, placement: WatermarkSettings['placement'], size: WatermarkSettings['size']): WatermarkItem[] {
  const k = SIZE_FACTOR[size]
  const short = Math.min(w, h)
  switch (placement) {
    case 'tiled': {
      const s = (short / 22) * k
      const step = approxWidth(text, s) + s * 3
      const diag = Math.hypot(w, h)
      const a = (30 * Math.PI) / 180
      const items: WatermarkItem[] = []
      let row = 0
      // Grille tournée de 30° autour du centre, rangées décalées d'une demi-longueur
      for (let v = -diag / 2; v < diag / 2; v += s * 4, row++) {
        for (let u = -diag / 2 - (row % 2) * (step / 2); u < diag / 2; u += step) {
          const x = w / 2 + u * Math.cos(a) + v * Math.sin(a)
          const y = h / 2 - u * Math.sin(a) + v * Math.cos(a)
          if (x < -step / 2 || x > w + step / 2 || y < -step / 2 || y > h + step / 2) continue
          items.push({ x, y, angle: 30, size: s, align: 'center' })
        }
      }
      return items
    }
    case 'diagonal': {
      const angle = (Math.atan2(h, w) * 180) / Math.PI
      const s = Math.min((0.7 * Math.hypot(w, h)) / Math.max(1, text.length * 0.6), short * 0.4) * Math.min(k, 1.2)
      return [{ x: w / 2, y: h / 2 + s / 3, angle, size: s, align: 'center' }]
    }
    case 'top':
    case 'bottom': {
      const s = Math.min((short / 30) * k, (0.9 * w) / Math.max(1, text.length * 0.6))
      return [{ x: w / 2, y: placement === 'top' ? s * 1.6 : h - s * 0.9, angle: 0, size: s, align: 'center' }]
    }
    case 'corner': {
      const s = Math.min((short / 40) * k, (0.6 * w) / Math.max(1, text.length * 0.6))
      return [{ x: w - s, y: h - s, angle: 0, size: s, align: 'right' }]
    }
  }
}

// ---------- Protection ----------

export type ProtectionLevel = 'none' | 'deterrent' | 'strong'

/**
 * Niveau réel de protection d'un export :
 * none : aucune ; deterrent : droits appliqués par les lecteurs, levables par un outil (pas de mot de
 * passe d'ouverture) ; strong : contenu chiffré illisible sans le mot de passe d'ouverture.
 */
export function protectionLevel(p: ExportSettings['protection'], openPassword: string): ProtectionLevel {
  if (!p.enabled) return 'none'
  return openPassword ? 'strong' : 'deterrent'
}

/** Destinataires d'un export nominatif : un nom par ligne, sans doublon ni ligne vide. */
export function recipientsOf(ws: WatermarkSettings): string[] {
  if (!ws.enabled) return []
  return [...new Set((ws.recipients ?? []).map((r) => r.trim()).filter(Boolean))]
}
