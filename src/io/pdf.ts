// Export PDF : une planche par feuille du projet (A4 à A0, paysage ou portrait), avec le synoptique, la légende des
// signaux et un cartouche (champs inspirés de l'ISO 7200). Le schéma est capturé en thème clair pour l'impression.
// Filigrane optionnel : incrusté dans l'image du schéma (impossible à retirer sans repeindre l'image) et répété en
// diagonale sur la planche. Protection optionnelle : modification et copie interdites dans les lecteurs PDF.
import { GState, jsPDF } from 'jspdf'
import { toJpeg } from 'html-to-image'
import { SIGNAL_FAMILIES, SIGNAL_STYLE } from '../model/signals'
import type { Project } from '../model/types'
import { exportSettingsOf, sheetLayout, watermarkText, type SheetLayout } from './exportOptions'
import { saveContent, slug } from './files'

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

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/**
 * Incruste un filigrane dans une image : texte répété en diagonale sur toute la surface.
 * Renvoie une nouvelle image (JPEG pour le PDF, PNG pour l'export image).
 */
export async function burnWatermark(dataUrl: string, text: string, opacity: number, mime: 'image/jpeg' | 'image/png' = 'image/jpeg'): Promise<string> {
  if (!text) return dataUrl
  const img = await loadImage(dataUrl)
  const c = document.createElement('canvas')
  c.width = img.naturalWidth
  c.height = img.naturalHeight
  const ctx = c.getContext('2d')
  if (!ctx) return dataUrl
  ctx.drawImage(img, 0, 0)
  const size = Math.max(14, Math.round(Math.min(c.width, c.height) / 22))
  ctx.font = `600 ${size}px Helvetica, Arial, sans-serif`
  ctx.fillStyle = `rgba(40, 40, 40, ${opacity})`
  ctx.textBaseline = 'middle'
  ctx.translate(c.width / 2, c.height / 2)
  ctx.rotate(-Math.PI / 6)
  const step = ctx.measureText(text).width + size * 3
  const diag = Math.hypot(c.width, c.height)
  let row = 0
  for (let y = -diag / 2; y < diag / 2; y += size * 4, row++) {
    // Rangées décalées d'une demi-longueur : pas de colonne vide où recadrer
    for (let x = -diag / 2 - (row % 2) * (step / 2); x < diag / 2; x += step) ctx.fillText(text, x, y)
  }
  return c.toDataURL(mime, 0.92)
}

/** Grand filigrane vectoriel en diagonale sur toute la planche (cartouche et légende compris). */
function drawPageWatermark(doc: jsPDF, text: string, opacity: number, w: number, h: number) {
  const angle = (Math.atan2(h, w) * 180) / Math.PI
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  const at10 = doc.getTextWidth(text) || 1
  // Le texte occupe environ 70 % de la diagonale, sans dépasser une hauteur raisonnable
  const size = Math.min((10 * 0.7 * Math.hypot(w, h)) / at10, Math.min(w, h) * 0.6)
  doc.setFontSize(size)
  const tw = doc.getTextWidth(text)
  const rad = (angle * Math.PI) / 180
  const x = w / 2 - (tw / 2) * Math.cos(rad)
  const y = h / 2 + (tw / 2) * Math.sin(rad)
  doc.setGState(new GState({ opacity }))
  doc.setTextColor(40)
  doc.text(text, x, y, { angle })
  doc.setGState(new GState({ opacity: 1 }))
  doc.setFont('helvetica', 'normal')
}

/** Mot de passe propriétaire aléatoire : personne ne le connaît, les droits restent ceux de l'utilisateur. */
function randomPassword() {
  const b = new Uint8Array(12)
  crypto.getRandomValues(b)
  return [...b].map((x) => x.toString(16).padStart(2, '0')).join('')
}

export async function exportPdf(project: Project, labels: PdfLabels, shots: SheetShot[]): Promise<boolean> {
  if (!shots.length) return false
  const opts = exportSettingsOf(project)
  const layout = sheetLayout(opts.paper, opts.orientation, SIGNAL_FAMILIES.length)
  const format = opts.paper.toLowerCase()
  const mark = opts.watermark.enabled ? watermarkText(opts.watermark.text, project) : ''
  const doc = new jsPDF({
    orientation: opts.orientation,
    unit: 'mm',
    format,
    ...(opts.protect ? { encryption: { ownerPassword: randomPassword(), userPermissions: ['print' as const] } } : {}),
  })
  doc.setProperties({ title: project.name, subject: mark || project.name, creator: 'AV Diagram', author: project.info?.author ?? '' })
  for (let i = 0; i < shots.length; i++) {
    if (i > 0) doc.addPage(format, opts.orientation)
    const shot = mark ? { ...shots[i], dataUrl: await burnWatermark(shots[i].dataUrl, mark, opts.watermark.opacity) } : shots[i]
    drawSheet(doc, project, labels, shot, `${i + 1} / ${shots.length}`, layout)
    if (mark) drawPageWatermark(doc, mark, opts.watermark.opacity * 0.6, layout.w, layout.h)
  }
  return saveContent(`${slug(project.name)}.pdf`, new Uint8Array(doc.output('arraybuffer')), 'application/pdf')
}

function drawSheet(doc: jsPDF, project: Project, labels: PdfLabels, shot: SheetShot, pageLabel: string, layout: SheetLayout) {
  const { w, h, margin, area, legend } = layout
  const TB = layout.titleBlock

  // Cadre de la planche
  doc.setDrawColor(40)
  doc.setLineWidth(0.5)
  doc.rect(margin / 2, margin / 2, w - margin, h - margin)

  // Synoptique, ajusté dans sa zone
  const ratio = Math.min(area.w / shot.width, area.h / shot.height)
  const imgW = shot.width * ratio
  const imgH = shot.height * ratio
  doc.addImage(shot.dataUrl, 'JPEG', area.x + (area.w - imgW) / 2, area.y + (area.h - imgH) / 2, imgW, imgH)

  // Légende des signaux
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(40)
  doc.text(labels.legend.toUpperCase(), legend.x, legend.y + 4)
  doc.setFont('helvetica', 'normal')
  SIGNAL_FAMILIES.forEach((s, i) => {
    const col = i % legend.cols
    const row = Math.floor(i / legend.cols)
    const x = legend.x + col * legend.colW
    const y = legend.y + 10 + row * legend.rowH
    const st = SIGNAL_STYLE[s]
    doc.setDrawColor(...cssColor(st.color))
    doc.setLineWidth(Math.min(st.width, 3) * 0.35)
    doc.setLineDashPattern(st.dash ? st.dash.split(' ').map((n) => Number(n) * 0.35) : [], 0)
    doc.line(x, y, x + 10, y)
    doc.setLineDashPattern([], 0)
    doc.text(labels.signals[s] ?? s, x + 12, y + 1)
  })

  // Cartouche
  const tx = TB.x
  const ty = TB.y
  const info = project.info ?? {}
  doc.setDrawColor(40)
  doc.setLineWidth(0.4)
  doc.rect(tx, ty, TB.w, TB.h)
  doc.line(tx, ty + 12, tx + TB.w, ty + 12)
  doc.line(tx, ty + 23, tx + TB.w, ty + 23)
  const colW = TB.w / 3
  doc.line(tx + colW, ty + 12, tx + colW, ty + TB.h)
  doc.line(tx + 2 * colW, ty + 12, tx + 2 * colW, ty + TB.h)

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
  doc.text(doc.splitTextToSize(heading, TB.w - 4)[0] ?? '', tx + 2, ty + 9.5)
  doc.setFont('helvetica', 'normal')
  cell(labels.client, info.client ?? '', tx, ty + 12)
  cell(labels.venue, info.venue ?? '', tx + colW, ty + 12)
  cell(labels.author, info.author ?? '', tx + 2 * colW, ty + 12)
  cell(labels.date, new Date().toLocaleDateString(), tx, ty + 23)
  cell(labels.revision, info.revision ?? '', tx + colW, ty + 23)
  cell(labels.sheet, pageLabel, tx + 2 * colW, ty + 23)
  doc.setFontSize(6)
  doc.setTextColor(140)
  doc.text('AV Diagram', tx + TB.w - 2, ty + TB.h + 3.5, { align: 'right' })
}
