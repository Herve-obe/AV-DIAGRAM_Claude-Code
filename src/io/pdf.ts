// Export PDF : une planche par feuille du projet (ou par page en taille fixe), au format A4 à A0, avec le
// synoptique, la légende des signaux, l'historique des indices et un cartouche aux champs inspirés de
// l'ISO 7200:2004 (propriétaire légal, numéro d'identification, titre, type de document, statut, date
// d'émission, établi par, approuvé par, indice, langue, feuille). Le schéma est capturé en thème clair.
// Filigrane paramétrable (texte, position, zone, taille, couleur, opacité) ; protection AES-256 faite par
// l'application de bureau (src-tauri/src/pdfsec.rs).
import { invoke } from '@tauri-apps/api/core'
import { GState, jsPDF } from 'jspdf'
import { toJpeg } from 'html-to-image'
import { SIGNAL_FAMILIES, SIGNAL_STYLE } from '../model/signals'
import type { ExportSettings, Project, ProjectInfo, WatermarkSettings } from '../model/types'
import type { TitleBlockTemplate } from '../store/titleBlockStore'
import { MAX_REVISIONS, recipientsOf, sheetLayout, watermarkLayout, watermarkText, type SheetLayout } from './exportOptions'
import { saveContent, saveMany, slug } from './files'

/** Nombre maximal de pixels d'une capture : limite des canevas de WebKit (macOS), avec une marge */
const MAX_PIXELS = 15_000_000

/** Capture le canevas en forçant temporairement le thème clair. */
export async function captureCanvasLight(pixelRatio = 2.5): Promise<{ dataUrl: string; width: number; height: number } | null> {
  const el = document.querySelector<HTMLElement>('.react-flow')
  if (!el) return null
  const root = document.documentElement
  const previous = root.dataset.theme
  root.dataset.theme = 'light'
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
  try {
    const filter = (node: HTMLElement) =>
      !['react-flow__minimap', 'react-flow__controls', 'react-flow__attribution', 'page-grid'].some((c) => node.classList?.contains(c))
    const ratio = Math.min(pixelRatio, Math.sqrt(MAX_PIXELS / Math.max(1, el.clientWidth * el.clientHeight)))
    // JPEG haute qualité : fichier léger, traits nets sur fond blanc
    const dataUrl = await toJpeg(el, { backgroundColor: '#ffffff', filter, pixelRatio: ratio, quality: 0.92 })
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

const hexRgb = (hex: string): [number, number, number] => {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex)
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [40, 40, 40]
}

/** Libellés traduits du cartouche et de la légende */
export interface PdfLabels {
  legend: string
  signals: Record<string, string>
  owner: string
  title: string
  client: string
  venue: string
  eventDate: string
  author: string
  approver: string
  docType: string
  status: string
  statuses: Record<string, string>
  docNumber: string
  revision: string
  issueDate: string
  language: string
  sheet: string
  classification: string
  techRef: string
  revisions: { index: string; date: string; description: string; by: string }
}

export interface SheetShot {
  name: string
  dataUrl: string
  width: number
  height: number
  /** Taille fixe : page de l'assemblage (ex. B1) */
  tile?: string
}

/** Mots de passe saisis à l'export (jamais enregistrés) */
export interface ExportPasswords {
  open: string
  owner: string
}

export interface ExportContext {
  project: Project
  info: ProjectInfo
  template: TitleBlockTemplate
  opts: ExportSettings
  labels: PdfLabels
  /** Date d'émission : date du poste au moment de l'export */
  date: Date
  passwords?: ExportPasswords
}

// ---------- Filigrane ----------

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/** Dessine le filigrane sur un canevas (image du schéma, export PNG). */
function drawWatermarkCanvas(ctx: CanvasRenderingContext2D, w: number, h: number, text: string, ws: WatermarkSettings) {
  ctx.save()
  ctx.globalAlpha = ws.opacity
  ctx.fillStyle = ws.color
  ctx.textBaseline = 'alphabetic'
  for (const it of watermarkLayout(w, h, text, ws.placement, ws.size)) {
    ctx.save()
    ctx.font = `600 ${it.size}px Helvetica, Arial, sans-serif`
    ctx.textAlign = it.align
    ctx.translate(it.x, it.y)
    ctx.rotate((-it.angle * Math.PI) / 180)
    ctx.fillText(text, 0, 0)
    ctx.restore()
  }
  ctx.restore()
}

/** Incruste le filigrane dans une image : il fait partie des pixels, impossible à retirer sans retouche. */
export async function burnWatermark(dataUrl: string, text: string, ws: WatermarkSettings, mime: 'image/jpeg' | 'image/png' = 'image/jpeg'): Promise<string> {
  if (!text) return dataUrl
  const img = await loadImage(dataUrl)
  const c = document.createElement('canvas')
  c.width = img.naturalWidth
  c.height = img.naturalHeight
  const ctx = c.getContext('2d')
  if (!ctx) return dataUrl
  ctx.drawImage(img, 0, 0)
  drawWatermarkCanvas(ctx, c.width, c.height, text, ws)
  return c.toDataURL(mime, 0.92)
}

const PT_PER_MM = 72 / 25.4

/** Filigrane vectoriel sur la planche entière (cartouche compris). */
function drawWatermarkPdf(doc: jsPDF, text: string, ws: WatermarkSettings, w: number, h: number) {
  doc.setFont('helvetica', 'bold')
  doc.setGState(new GState({ opacity: ws.opacity }))
  doc.setTextColor(...hexRgb(ws.color))
  for (const it of watermarkLayout(w, h, text, ws.placement, ws.size)) {
    doc.setFontSize(it.size * PT_PER_MM)
    const tw = doc.getTextWidth(text)
    const shift = it.align === 'center' ? tw / 2 : it.align === 'right' ? tw : 0
    const rad = (it.angle * Math.PI) / 180
    doc.text(text, it.x - shift * Math.cos(rad), it.y + shift * Math.sin(rad), { angle: it.angle })
  }
  doc.setGState(new GState({ opacity: 1 }))
  doc.setFont('helvetica', 'normal')
}

// ---------- Planche ----------

/** Construit le PDF (un destinataire au plus) et renvoie son contenu et son nom de fichier. */
export async function buildPdf(ctx: ExportContext, shots: SheetShot[], recipient?: string): Promise<{ name: string; bytes: Uint8Array }> {
  const { project, opts } = ctx
  const revisions = ctx.info.revisions ?? []
  const layout = sheetLayout(opts.paper, opts.orientation, SIGNAL_FAMILIES.length, revisions.length)
  const format = opts.paper.toLowerCase()
  const ws = opts.watermark
  const mark = ws.enabled ? watermarkText(ws.text, { ...project, info: ctx.info }, ctx.date, recipient) : ''
  const doc = new jsPDF({ orientation: opts.orientation, unit: 'mm', format })
  doc.setProperties({
    title: [ctx.info.docNumber, project.name].filter(Boolean).join(' · '),
    subject: ctx.info.subtitle ?? project.name,
    author: ctx.info.author ?? '',
    keywords: [ctx.info.classification, mark].filter(Boolean).join(' · '),
    creator: 'AV Diagram',
  })
  for (let i = 0; i < shots.length; i++) {
    if (i > 0) doc.addPage(format, opts.orientation)
    const shot = mark && ws.zone === 'diagram' ? { ...shots[i], dataUrl: await burnWatermark(shots[i].dataUrl, mark, ws) } : shots[i]
    drawSheet(doc, ctx, shot, i + 1, shots.length, layout)
    if (mark && ws.zone === 'sheet') drawWatermarkPdf(doc, mark, ws, layout.w, layout.h)
  }
  let bytes: Uint8Array = new Uint8Array(doc.output('arraybuffer'))
  if (opts.protection.enabled) bytes = await protectPdf(bytes, opts.protection, ctx.passwords)
  const name = slug([ctx.info.docNumber, project.name, recipient].filter(Boolean).join(' '))
  return { name: `${name}.pdf`, bytes }
}

/**
 * Exporte la planche : un fichier, ou un fichier par destinataire (filigrane nominatif) enregistrés
 * dans un dossier choisi. Renvoie le nombre de fichiers écrits.
 */
export async function exportPdf(ctx: ExportContext, shots: SheetShot[]): Promise<number> {
  if (!shots.length) return 0
  const recipients = recipientsOf(ctx.opts.watermark)
  if (!recipients.length) {
    const { name, bytes } = await buildPdf(ctx, shots)
    return (await saveContent(name, bytes, 'application/pdf')) ? 1 : 0
  }
  const files = []
  for (const r of recipients) {
    const { name, bytes } = await buildPdf(ctx, shots, r)
    files.push({ name, content: bytes, mime: 'application/pdf' })
  }
  return saveMany(files)
}

/** Chiffrement AES-256 par l'application de bureau ; le PDF ne quitte pas le poste. */
async function protectPdf(bytes: Uint8Array, p: ExportSettings['protection'], pw?: ExportPasswords): Promise<Uint8Array<ArrayBuffer>> {
  const out = await invoke<ArrayBuffer>('pdf_protect', bytes, {
    headers: {
      'x-user-password': encodeURIComponent(pw?.open ?? ''),
      'x-owner-password': encodeURIComponent(pw?.owner ?? ''),
      'x-allow-print': p.allowPrint ? '1' : '0',
      'x-allow-copy': p.allowCopy ? '1' : '0',
      'x-allow-modify': p.allowModify ? '1' : '0',
    },
  })
  return new Uint8Array(out)
}

function drawSheet(doc: jsPDF, ctx: ExportContext, shot: SheetShot, page: number, pages: number, layout: SheetLayout) {
  const { w, h, margin, area, legend } = layout
  const { labels } = ctx

  // Cadre de la planche
  doc.setDrawColor(40)
  doc.setLineWidth(0.5)
  doc.rect(margin / 2, margin / 2, w - margin, h - margin)

  // Synoptique : en taille fixe la capture a exactement la forme de la zone ; sinon elle est centrée
  const ratio = Math.min(area.w / shot.width, area.h / shot.height)
  const imgW = shot.width * ratio
  const imgH = shot.height * ratio
  doc.addImage(shot.dataUrl, 'JPEG', area.x + (area.w - imgW) / 2, area.y + (area.h - imgH) / 2, imgW, imgH)
  if (shot.tile) {
    // Repère d'assemblage dans le coin de la zone
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(90)
    doc.text(shot.tile, area.x + 2, area.y + 5)
    doc.setFont('helvetica', 'normal')
  }

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

  drawRevisions(doc, ctx, layout)
  drawTitleBlock(doc, ctx, layout, shot, `${page} / ${pages}`)
}

/** Cellule du cartouche : libellé en petit, valeur dessous (tronquée à la largeur). */
function cell(doc: jsPDF, label: string, value: string, x: number, y: number, w: number, h: number) {
  doc.setDrawColor(40)
  doc.setLineWidth(0.25)
  doc.rect(x, y, w, h)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(5)
  doc.setTextColor(110)
  doc.text(label.toUpperCase(), x + 1.2, y + 2.6)
  doc.setFontSize(8)
  doc.setTextColor(20)
  doc.text(doc.splitTextToSize(value || '-', w - 2.4)[0] ?? '', x + 1.2, y + h - 2)
}

function drawTitleBlock(doc: jsPDF, ctx: ExportContext, layout: SheetLayout, shot: SheetShot, pageLabel: string) {
  const { labels, info, template } = ctx
  const { x, y, w, h } = layout.titleBlock
  const L = 40
  const R = w - L
  const rx = x + L

  // Colonne gauche : logo et propriétaire légal
  const logoH = 32
  doc.setDrawColor(40)
  doc.setLineWidth(0.25)
  doc.rect(x, y, L, logoH)
  if (template.logo) {
    try {
      const p = doc.getImageProperties(template.logo)
      const k = Math.min((L - 4) / p.width, (logoH - 4) / p.height)
      doc.addImage(template.logo, x + (L - p.width * k) / 2, y + (logoH - p.height * k) / 2, p.width * k, p.height * k)
    } catch {
      // logo illisible : case laissée vide
    }
  }
  doc.rect(x, y + logoH, L, h - logoH)
  doc.setFontSize(5)
  doc.setTextColor(110)
  doc.text(labels.owner.toUpperCase(), x + 1.2, y + logoH + 2.6)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(20)
  doc.text(doc.splitTextToSize(info.owner || template.owner || '-', L - 2.4)[0] ?? '', x + 1.2, y + logoH + 7)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(5.5)
  doc.setTextColor(70)
  if (template.ownerDetail) doc.text(doc.splitTextToSize(template.ownerDetail, L - 2.4).slice(0, 2), x + 1.2, y + logoH + 10.5)

  // Titre et titre complémentaire
  const rowT = 14
  const row = (h - rowT) / 4
  const subtitle = [info.subtitle, shot.name].filter(Boolean).join(' · ')
  doc.rect(rx, y, R, rowT)
  doc.setFontSize(5)
  doc.setTextColor(110)
  doc.text(labels.title.toUpperCase(), rx + 1.2, y + 2.6)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(20)
  doc.text(doc.splitTextToSize(ctx.project.name, R - 2.4)[0] ?? '', rx + 1.2, y + 8)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(60)
  if (subtitle) doc.text(doc.splitTextToSize(subtitle, R - 2.4)[0] ?? '', rx + 1.2, y + 12.2)

  const y2 = y + rowT
  cell(doc, labels.client, info.client ?? '', rx, y2, 55, row)
  cell(doc, labels.venue, info.venue ?? '', rx + 55, y2, 50, row)
  cell(doc, labels.eventDate, info.eventDate ?? '', rx + 105, y2, R - 105, row)

  const y3 = y2 + row
  cell(doc, labels.author, info.author ?? '', rx, y3, 35, row)
  cell(doc, labels.approver, info.approver ?? '', rx + 35, y3, 35, row)
  cell(doc, labels.docType, info.docType ?? '', rx + 70, y3, 35, row)
  cell(doc, labels.status, info.status ? labels.statuses[info.status] ?? '' : '', rx + 105, y3, R - 105, row)

  const y4 = y3 + row
  cell(doc, labels.docNumber, info.docNumber ?? '', rx, y4, 45, row)
  cell(doc, labels.revision, info.revision ?? '', rx + 45, y4, 17, row)
  cell(doc, labels.issueDate, ctx.date.toLocaleDateString(), rx + 62, y4, 28, row)
  cell(doc, labels.language, info.language ?? '', rx + 90, y4, 15, row)
  cell(doc, labels.sheet, shot.tile ? `${pageLabel} (${shot.tile})` : pageLabel, rx + 105, y4, R - 105, row)

  const y5 = y4 + row
  cell(doc, labels.classification, info.classification ?? '', rx, y5, 70, row)
  cell(doc, labels.techRef, info.techRef ?? '', rx + 70, y5, R - 70, row)

  // Contour renforcé, par-dessus les cellules
  doc.setDrawColor(20)
  doc.setLineWidth(0.6)
  doc.rect(x, y, w, h)
  doc.setFontSize(5)
  doc.setTextColor(140)
  doc.text('AV Diagram', x + w, y + h + 3, { align: 'right' })
}

/** Historique des indices, du plus récent (en haut) au plus ancien, avec l'en-tête contre le cartouche. */
function drawRevisions(doc: jsPDF, ctx: ExportContext, layout: SheetLayout) {
  const box = layout.revisions
  if (!box.rows) return
  const { labels } = ctx
  const list = (ctx.info.revisions ?? []).slice(-MAX_REVISIONS).reverse()
  const rowH = box.h / (box.rows + 1)
  const cols = [15, 24, box.w - 15 - 24 - 32, 32]
  const heads = [labels.revisions.index, labels.revisions.date, labels.revisions.description, labels.revisions.by]
  doc.setLineWidth(0.25)
  doc.setDrawColor(40)
  const drawRow = (values: string[], y: number, head: boolean) => {
    let cx = box.x
    values.forEach((v, i) => {
      doc.rect(cx, y, cols[i], rowH)
      doc.setFontSize(head ? 5 : 7)
      doc.setTextColor(head ? 110 : 20)
      doc.text(doc.splitTextToSize(head ? v.toUpperCase() : v || '-', cols[i] - 2)[0] ?? '', cx + 1, y + rowH - 1.5)
      cx += cols[i]
    })
  }
  list.forEach((r, i) => drawRow([r.index, r.date, r.description, r.author ?? ''], box.y + i * rowH, false))
  drawRow(heads, box.y + list.length * rowH, true)
}
