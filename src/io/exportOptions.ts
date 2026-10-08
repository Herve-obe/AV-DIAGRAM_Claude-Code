// Options d'export : formats de papier (ISO 216), disposition de la planche, texte du filigrane.
import type { ExportSettings, PaperSize, Project } from '../model/types'

/** Dimensions ISO 216 en mm, côté court x côté long */
const ISO_A: Record<PaperSize, [number, number]> = {
  A4: [210, 297],
  A3: [297, 420],
  A2: [420, 594],
  A1: [594, 841],
  A0: [841, 1189],
}

export const DEFAULT_EXPORT: ExportSettings = {
  paper: 'A3',
  orientation: 'landscape',
  watermark: { enabled: false, text: '{client} · {date} · NE PAS DIFFUSER', opacity: 0.12 },
  protect: false,
}

export function exportSettingsOf(project: Project): ExportSettings {
  const e = project.settings.export
  return { ...DEFAULT_EXPORT, ...e, watermark: { ...DEFAULT_EXPORT.watermark, ...e?.watermark } }
}

/** Taille de la page en mm selon le format et l'orientation. */
export function pageSize(paper: PaperSize, orientation: ExportSettings['orientation']): { w: number; h: number } {
  const [short, long] = ISO_A[paper]
  return orientation === 'landscape' ? { w: long, h: short } : { w: short, h: long }
}

/** Texte du filigrane avec les champs du projet ; les champs vides et leurs séparateurs disparaissent. */
export function watermarkText(template: string, project: Project, date = new Date()): string {
  const info = project.info ?? {}
  const values: Record<string, string> = {
    client: info.client ?? '',
    project: project.name,
    date: date.toLocaleDateString(),
    revision: info.revision ?? '',
  }
  return template
    .replace(/\{(client|project|date|revision)\}/g, (_, k: string) => values[k])
    .split('·')
    .map((s) => s.trim())
    .filter(Boolean)
    .join(' · ')
    .trim()
}

export interface SheetLayout {
  w: number
  h: number
  margin: number
  /** Cartouche, en bas à droite */
  titleBlock: { x: number; y: number; w: number; h: number }
  /** Légende des signaux : origine et nombre de colonnes */
  legend: { x: number; y: number; cols: number; colW: number; rowH: number }
  /** Zone du synoptique */
  area: { x: number; y: number; w: number; h: number }
}

/**
 * Disposition d'une planche : cartouche en bas à droite ; légende à sa gauche si la place suffit,
 * sinon au-dessus (A4 portrait, A3 portrait) ; le synoptique occupe le reste.
 */
export function sheetLayout(paper: PaperSize, orientation: ExportSettings['orientation'], legendItems: number): SheetLayout {
  const { w, h } = pageSize(paper, orientation)
  const margin = paper === 'A4' ? 8 : 10
  const tbW = Math.min(170, w - 2 * margin)
  const tbH = 34
  const colW = 42
  const rowH = 7
  const beside = Math.floor((w - 2 * margin - tbW - 6) / colW)
  const titleBlock = { x: w - margin - tbW, y: h - margin - tbH, w: tbW, h: tbH }
  if (beside >= 3) {
    const rows = Math.ceil(legendItems / beside)
    const legendH = 10 + rows * rowH
    const bandH = Math.max(tbH, legendH)
    return {
      w, h, margin, titleBlock,
      legend: { x: margin, y: h - margin - bandH, cols: beside, colW, rowH },
      area: { x: margin, y: margin, w: w - 2 * margin, h: h - 2 * margin - bandH - 4 },
    }
  }
  const cols = Math.max(1, Math.floor((w - 2 * margin) / colW))
  const rows = Math.ceil(legendItems / cols)
  const legendH = 10 + rows * rowH
  const legendY = titleBlock.y - 4 - legendH
  return {
    w, h, margin, titleBlock,
    legend: { x: margin, y: legendY, cols, colW, rowH },
    area: { x: margin, y: margin, w: w - 2 * margin, h: legendY - margin - 4 },
  }
}
