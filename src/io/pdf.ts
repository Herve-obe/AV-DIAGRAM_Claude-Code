// Export PDF : une planche A3 paysage par feuille du projet, avec le synoptique, la légende des signaux et un cartouche
// (champs inspirés de l'ISO 7200). Le schéma est capturé en thème clair pour l'impression.
import { jsPDF } from 'jspdf'
import { toJpeg } from 'html-to-image'
import { SIGNAL_FAMILIES, SIGNAL_STYLE } from '../model/signals'
import type { Project } from '../model/types'
import { saveContent, slug } from './files'

const PAGE = { w: 420, h: 297, margin: 10 } // A3 paysage, en mm
const TITLE_BLOCK = { w: 170, h: 34 }

/** Capture le canevas en forçant temporairement le thème clair. */
export async function captureCanvasLight(): Promise<{ dataUrl: string; width: number; height: number } | null> {
  const el = document.querySelector<HTMLElement>('.react-flow')
  if (!el) return null
  const root = document.documentElement
  const previous = root.dataset.theme
  root.dataset.theme = 'light'
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
  try {
    const filter = (node: HTMLElement) =>
      !['react-flow__minimap', 'react-flow__controls', 'react-flow__attribution'].some((c) => node.classList?.contains(c))
    // JPEG haute qualité : fichier léger, traits nets sur fond blanc
    const dataUrl = await toJpeg(el, { backgroundColor: '#ffffff', filter, pixelRatio: 2.5, quality: 0.92 })
    return { dataUrl, width: el.clientWidth, height: el.clientHeight }
  } finally {
    if (previous) root.dataset.theme = previous
    else delete root.dataset.theme
  }
}

/** Résout une variable CSS (ex. var(--sig-video)) en couleur RGB, en thème clair. */
function cssColor(varExpr: string): [number, number, number] {
  const name = varExpr.replace(/^var\((--[^)]+)\)$/, '$1')
  const probe = document.createElement('span')
  probe.style.color = `var(${name})`
  document.body.appendChild(probe)
  const rgb = getComputedStyle(probe).color.match(/\d+/g)?.map(Number) ?? [0, 0, 0]
  probe.remove()
  return [rgb[0], rgb[1], rgb[2]]
}

export interface PdfLabels {
  title: string
  client: string
  venue: string
  author: string
  date: string
  revision: string
  sheet: string
  legend: string
  signals: Record<string, string>
}

export interface SheetShot {
  name: string
  dataUrl: string
  width: number
  height: number
}

export async function exportPdf(project: Project, labels: PdfLabels, shots: SheetShot[]): Promise<boolean> {
  if (!shots.length) return false
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' })
  shots.forEach((shot, i) => {
    if (i > 0) doc.addPage('a3', 'landscape')
    drawSheet(doc, project, labels, shot, `${i + 1} / ${shots.length}`)
  })
  return saveContent(`${slug(project.name)}.pdf`, new Uint8Array(doc.output('arraybuffer')), 'application/pdf')
}

function drawSheet(doc: jsPDF, project: Project, labels: PdfLabels, shot: SheetShot, pageLabel: string) {
  const { w, h, margin } = PAGE

  // Cadre de la planche
  doc.setDrawColor(40)
  doc.setLineWidth(0.5)
  doc.rect(margin / 2, margin / 2, w - margin, h - margin)

  // Synoptique, ajusté dans la zone au-dessus du cartouche
  const areaW = w - 2 * margin
  const areaH = h - 2 * margin - TITLE_BLOCK.h - 4
  const ratio = Math.min(areaW / shot.width, areaH / shot.height)
  const imgW = shot.width * ratio
  const imgH = shot.height * ratio
  doc.addImage(shot.dataUrl, 'JPEG', margin + (areaW - imgW) / 2, margin + (areaH - imgH) / 2, imgW, imgH)

  // Légende des signaux (bas gauche)
  const legendY = h - margin - TITLE_BLOCK.h
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(40)
  doc.text(labels.legend.toUpperCase(), margin, legendY + 4)
  doc.setFont('helvetica', 'normal')
  SIGNAL_FAMILIES.forEach((s, i) => {
    const col = i % 5
    const row = Math.floor(i / 5)
    const x = margin + col * 42
    const y = legendY + 10 + row * 7
    const st = SIGNAL_STYLE[s]
    doc.setDrawColor(...cssColor(st.color))
    doc.setLineWidth(Math.min(st.width, 3) * 0.35)
    doc.setLineDashPattern(st.dash ? st.dash.split(' ').map((n) => Number(n) * 0.35) : [], 0)
    doc.line(x, y, x + 10, y)
    doc.setLineDashPattern([], 0)
    doc.text(labels.signals[s] ?? s, x + 12, y + 1)
  })

  // Cartouche (bas droite)
  const tx = w - margin - TITLE_BLOCK.w
  const ty = h - margin - TITLE_BLOCK.h
  const info = project.info ?? {}
  doc.setDrawColor(40)
  doc.setLineWidth(0.4)
  doc.rect(tx, ty, TITLE_BLOCK.w, TITLE_BLOCK.h)
  doc.line(tx, ty + 12, tx + TITLE_BLOCK.w, ty + 12)
  doc.line(tx, ty + 23, tx + TITLE_BLOCK.w, ty + 23)
  const colW = TITLE_BLOCK.w / 3
  doc.line(tx + colW, ty + 12, tx + colW, ty + TITLE_BLOCK.h)
  doc.line(tx + 2 * colW, ty + 12, tx + 2 * colW, ty + TITLE_BLOCK.h)

  const cell = (label: string, value: string, x: number, y: number) => {
    doc.setFontSize(6)
    doc.setTextColor(110)
    doc.text(label.toUpperCase(), x + 2, y + 3.5)
    doc.setFontSize(9)
    doc.setTextColor(20)
    doc.text(doc.splitTextToSize(value || '-', colW - 4)[0] ?? '', x + 2, y + 8.5)
  }
  doc.setFontSize(6)
  doc.setTextColor(110)
  doc.text(labels.title.toUpperCase(), tx + 2, ty + 3.5)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(20)
  const heading = shot.name ? `${project.name} · ${shot.name}` : project.name
  doc.text(doc.splitTextToSize(heading, TITLE_BLOCK.w - 4)[0] ?? '', tx + 2, ty + 9.5)
  doc.setFont('helvetica', 'normal')
  cell(labels.client, info.client ?? '', tx, ty + 12)
  cell(labels.venue, info.venue ?? '', tx + colW, ty + 12)
  cell(labels.author, info.author ?? '', tx + 2 * colW, ty + 12)
  cell(labels.date, new Date().toLocaleDateString(), tx, ty + 23)
  cell(labels.revision, info.revision ?? '', tx + colW, ty + 23)
  cell(labels.sheet, pageLabel, tx + 2 * colW, ty + 23)
  doc.setFontSize(6)
  doc.setTextColor(140)
  doc.text('AV Diagram', tx + TITLE_BLOCK.w - 2, ty + TITLE_BLOCK.h + 3.5, { align: 'right' })
}
