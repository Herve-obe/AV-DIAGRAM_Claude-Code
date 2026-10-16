// Lecture d'un PDF vectoriel (pdf.js) : textes avec leur position, rectangles et traits, en points
// PDF dans le repère de la page (origine en haut à gauche, y vers le bas). L'interprétation (blocs,
// ports, liaisons) est faite ensuite par interpret.ts, sans dépendre de pdf.js.
import type * as PdfJs from 'pdfjs-dist'

export interface PdfText {
  str: string
  /** Coin haut gauche et taille, en points */
  x: number
  y: number
  w: number
  h: number
}

export interface PdfRect {
  x: number
  y: number
  w: number
  h: number
  stroke: string | null
  fill: string | null
}

export interface PdfSegment {
  x1: number
  y1: number
  x2: number
  y2: number
  color: string
  width: number
}

export interface PdfPage {
  index: number
  width: number
  height: number
  texts: PdfText[]
  rects: PdfRect[]
  segments: PdfSegment[]
  /** Images posées sur la page (un PDF scanné ou une capture n'a que cela) */
  images: number
}

type Matrix = [number, number, number, number, number, number]

const mul = (m: Matrix, n: Matrix): Matrix => [
  m[0] * n[0] + m[2] * n[1],
  m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3],
  m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4],
  m[1] * n[4] + m[3] * n[5] + m[5],
]
const apply = (m: Matrix, x: number, y: number): [number, number] => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]]

function hex(args: unknown): string {
  if (typeof args === 'string') return args.toLowerCase()
  const a = args as ArrayLike<number> | undefined
  if (!a || a.length < 3) return '#000000'
  return '#' + [a[0], a[1], a[2]].map((v) => Math.round(Number(v)).toString(16).padStart(2, '0')).join('')
}

/** Rectangle d'un chemin fermé dont tous les points sont sur le contour de sa boîte (coins arrondis compris). */
function closedBox(points: [number, number][]): { x: number; y: number; w: number; h: number } | null {
  if (points.length < 4) return null
  const xs = points.map((p) => p[0])
  const ys = points.map((p) => p[1])
  const x = Math.min(...xs)
  const y = Math.min(...ys)
  const w = Math.max(...xs) - x
  const h = Math.max(...ys) - y
  if (w < 4 || h < 4) return null
  const tol = Math.max(1.5, Math.min(w, h) * 0.12)
  const onEdge = points.every(([px, py]) => Math.abs(px - x) < tol || Math.abs(px - x - w) < tol || Math.abs(py - y) < tol || Math.abs(py - y - h) < tol)
  return onEdge ? { x, y, w, h } : null
}

export async function extractPage(pdfjs: typeof PdfJs, page: PdfJs.PDFPageProxy, index: number): Promise<PdfPage> {
  const vp = page.getViewport({ scale: 1 })
  const base = vp.transform as Matrix
  const OPS = pdfjs.OPS
  const out: PdfPage = { index, width: vp.width, height: vp.height, texts: [], rects: [], segments: [], images: 0 }

  // Textes
  const tc = await page.getTextContent()
  for (const it of tc.items) {
    if (!('str' in it) || !it.str.trim()) continue
    const m = mul(base, it.transform as Matrix)
    const h = Math.hypot(m[2], m[3]) || it.height
    out.texts.push({ str: it.str.replace(/\s+/g, ' ').trim(), x: m[4], y: m[5] - h, w: it.width * Math.hypot(base[0], base[1]), h })
  }

  // Tracés : on suit la matrice courante, les couleurs et l'épaisseur
  const ol = await page.getOperatorList()
  let ctm: Matrix = [1, 0, 0, 1, 0, 0]
  let stroke = '#000000'
  let fill = '#000000'
  let lineWidth = 1
  const stack: { ctm: Matrix; stroke: string; fill: string; lineWidth: number }[] = []
  let pending: { rects: [number, number][][]; subpaths: { pts: [number, number][]; closed: boolean }[] } | null = null

  const dev = (x: number, y: number) => apply(mul(base, ctm), x, y)
  const scale = () => {
    const m = mul(base, ctm)
    return Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2])) || 1
  }

  const paint = (doStroke: boolean, doFill: boolean, close: boolean) => {
    if (!pending) return
    const width = lineWidth * scale()
    for (const r of pending.rects) {
      const b = closedBox(r)
      if (b) out.rects.push({ ...b, stroke: doStroke ? stroke : null, fill: doFill ? fill : null })
    }
    for (const sp of pending.subpaths) {
      const closed = sp.closed || close
      const box = closed ? closedBox(sp.pts) : null
      if (box && box.w > 8 && box.h > 8) {
        out.rects.push({ ...box, stroke: doStroke ? stroke : null, fill: doFill ? fill : null })
        continue
      }
      if (!doStroke) continue
      const pts = closed && sp.pts.length > 2 ? [...sp.pts, sp.pts[0]] : sp.pts
      for (let i = 1; i < pts.length; i++) {
        const [x1, y1] = pts[i - 1]
        const [x2, y2] = pts[i]
        if (Math.hypot(x2 - x1, y2 - y1) < 0.5) continue
        out.segments.push({ x1, y1, x2, y2, color: stroke, width })
      }
    }
    pending = null
  }

  for (let i = 0; i < ol.fnArray.length; i++) {
    const fn = ol.fnArray[i]
    const args = ol.argsArray[i] as unknown[]
    switch (fn) {
      case OPS.save:
        stack.push({ ctm, stroke, fill, lineWidth })
        break
      case OPS.restore: {
        const s = stack.pop()
        if (s) ({ ctm, stroke, fill, lineWidth } = s)
        break
      }
      case OPS.transform:
        ctm = mul(ctm, args as unknown as Matrix)
        break
      case OPS.paintFormXObjectBegin:
        stack.push({ ctm, stroke, fill, lineWidth })
        if (Array.isArray(args[0])) ctm = mul(ctm, args[0] as Matrix)
        break
      case OPS.paintFormXObjectEnd: {
        const s = stack.pop()
        if (s) ({ ctm, stroke, fill, lineWidth } = s)
        break
      }
      case OPS.setStrokeRGBColor:
        stroke = hex(args.length === 1 ? args[0] : args)
        break
      case OPS.setFillRGBColor:
        fill = hex(args.length === 1 ? args[0] : args)
        break
      case OPS.setStrokeGray:
        stroke = hex([Number(args[0]) * 255, Number(args[0]) * 255, Number(args[0]) * 255])
        break
      case OPS.setLineWidth:
        lineWidth = Number(args[0]) || lineWidth
        break
      case OPS.setGState:
        for (const [k, v] of (args[0] as [string, unknown][]) ?? []) if (k === 'LW') lineWidth = Number(v) || lineWidth
        break
      case OPS.constructPath: {
        const [ops, coords] = args as [number[], number[]]
        pending ??= { rects: [], subpaths: [] }
        let j = 0
        let cur: { pts: [number, number][]; closed: boolean } | null = null
        for (const op of ops) {
          if (op === OPS.rectangle) {
            const [x, y, w, h] = coords.slice(j, j + 4)
            j += 4
            pending.rects.push([dev(x, y), dev(x + w, y), dev(x + w, y + h), dev(x, y + h)])
          } else if (op === OPS.moveTo) {
            cur = { pts: [dev(coords[j], coords[j + 1])], closed: false }
            pending.subpaths.push(cur)
            j += 2
          } else if (op === OPS.lineTo) {
            cur?.pts.push(dev(coords[j], coords[j + 1]))
            j += 2
          } else if (op === OPS.curveTo) {
            cur?.pts.push(dev(coords[j + 4], coords[j + 5]))
            j += 6
          } else if (op === OPS.curveTo2 || op === OPS.curveTo3) {
            cur?.pts.push(dev(coords[j + 2], coords[j + 3]))
            j += 4
          } else if (op === OPS.closePath) {
            if (cur) cur.closed = true
          }
        }
        break
      }
      case OPS.stroke:
        paint(true, false, false)
        break
      case OPS.closeStroke:
        paint(true, false, true)
        break
      case OPS.fill:
      case OPS.eoFill:
        paint(false, true, true)
        break
      case OPS.fillStroke:
      case OPS.eoFillStroke:
        paint(true, true, true)
        break
      case OPS.closeFillStroke:
      case OPS.closeEOFillStroke:
        paint(true, true, true)
        break
      case OPS.endPath:
        pending = null
        break
      case OPS.paintImageXObject:
      case OPS.paintInlineImageXObject:
      case OPS.paintImageMaskXObject:
        out.images++
        break
    }
  }
  return out
}

/** Lit toutes les pages d'un PDF. */
export async function extractPdf(pdfjs: typeof PdfJs, data: Uint8Array, maxPages = 20): Promise<PdfPage[]> {
  const doc = await pdfjs.getDocument({ data, isEvalSupported: false, disableFontFace: true }).promise
  try {
    const pages: PdfPage[] = []
    for (let i = 1; i <= Math.min(doc.numPages, maxPages); i++) pages.push(await extractPage(pdfjs, await doc.getPage(i), i))
    return pages
  } finally {
    void doc.destroy()
  }
}
