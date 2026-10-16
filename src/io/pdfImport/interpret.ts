// Interprétation d'un synoptique PDF produit par un autre logiciel (Visio, AutoCAD, Vectorworks,
// draw.io, Illustrator...) : les cadres qui contiennent du texte deviennent des équipements, les
// traits qui relient deux cadres deviennent des liaisons, les textes posés au bord d'un cadre à
// l'arrivée d'un trait deviennent des ports.
//
// Rien n'est inventé : ce qui n'est pas écrit dans le document est signalé comme déduit (sens d'un
// port d'après le côté du cadre, type de signal d'après un mot-clé ou la couleur du trait) ou laissé
// « non précisé » (connecteur), et la fenêtre d'import montre tout avant d'appliquer.
import { domainOf } from '../../library/domains'
import type { SignalFamily } from '../../model/signals'
import type { EquipmentFamily, EquipmentTemplate, PictogramId, PortDirection } from '../../model/types'
import type { PdfPage, PdfRect, PdfSegment, PdfText } from './extract'

export type Side = 'left' | 'right' | 'top' | 'bottom'
type Box = { x: number; y: number; w: number; h: number }

/** Origine d'une information : lue dans le document, déduite (mot-clé, couleur, côté), ou par défaut */
export type Evidence = 'document' | 'keyword' | 'color' | 'side' | 'default'

export interface ImportedPort {
  key: string
  name: string
  /** Nom absent du document (port numéroté automatiquement) */
  unnamed: boolean
  direction: PortDirection
  directionFrom: Evidence
  signal: SignalFamily
  signalFrom: Evidence
  connector: string
  side: Side
  /** Position le long du bord (pour garder l'ordre du document) */
  along: number
}

export interface ImportedEquipment {
  key: string
  name: string
  model: string
  notes: string[]
  box: Box
  ports: ImportedPort[]
  family: EquipmentFamily
  familyFrom: Evidence
  pictogram: PictogramId
  /** Fiche de la bibliothèque dont le modèle figure dans le cadre */
  match?: { templateId: string; label: string }
  links: number
}

export interface ImportedLink {
  key: string
  from: { eq: string; port: string }
  to: { eq: string; port: string }
  /** Repère du câble dans le document (ex. A001) */
  ref?: string
  lengthM?: number
  /** Autres textes posés sur la liaison (type de câble...) */
  note?: string
  signal: SignalFamily
  signalFrom: Evidence
  color: string
  points: [number, number][]
}

export interface PageInterpretation {
  page: number
  width: number
  height: number
  /** vector : tracés lisibles ; raster : la page n'est qu'une image (scan, capture) ; empty : rien */
  kind: 'vector' | 'raster' | 'empty'
  equipment: ImportedEquipment[]
  links: ImportedLink[]
  /** Textes hors cadres et hors liaisons (cartouche, légende, titres...) */
  looseText: string[]
  /** Tracés reliés à un seul cadre ou à plus de deux (renvois, bus) : à vérifier */
  unresolved: number
}

const TOL = 2

// ---------- Mots-clés ----------

/** Signal et connecteur d'après un texte (nom de port, repère de câble). Le premier motif trouvé l'emporte. */
const SIGNAL_RULES: [RegExp, SignalFamily, string][] = [
  [/\b(12G|6G|3G|HD)?-?SDI\b/i, 'video', 'bnc'],
  [/\bHDMI\b/i, 'video', 'hdmi'],
  [/\bDVI\b/i, 'video', 'dvi'],
  [/\bVGA\b/i, 'video', 'vga'],
  [/\b(DISPLAY ?PORT|DP)\b/i, 'video', 'displayport'],
  [/\b(NDI|ST ?2110|SMPTE ?2110)\b/i, 'videoIp', 'rj45'],
  [/\b(DANTE|AES67|AVB|RAVENNA)\b/i, 'audioIp', 'rj45'],
  [/\bMADI\b/i, 'audioDigital', 'unspecified'],
  [/\b(AES ?3|AES\/EBU|AES)\b/i, 'audioDigital', 'xlr3'],
  [/\b(ADAT|TOSLINK)\b/i, 'audioDigital', 'toslink'],
  [/\bDMX(512)?\b/i, 'dmx', 'xlr5'],
  [/\b(ART-?NET|SACN)\b/i, 'network', 'rj45'],
  [/\b(WORD ?CLOCK|WCLK|GENLOCK|REF(ERENCE)?|BLACK ?BURST|BB|TRI-?LEVEL|LTC|TIME ?CODE)\b/i, 'sync', 'bnc'],
  [/\b(INTERCOM|CLEAR-?COM|PARTY ?LINE|BELTPACK|4-?WIRE|4 FILS)\b/i, 'intercom', 'xlr3'],
  [/\b(SPEAKON|NL4|NL8|HP|SPEAKER|ENCEINTE)\b/i, 'audioAnalog', 'speakon-nl4'],
  [/\b(RJ-?45|ETHERCON|ETH(ERNET)?|LAN|NET(WORK)?|R[ÉE]SEAU|CAT ?5E?|CAT ?6A?|CAT ?7)\b/i, 'network', 'rj45'],
  [/\b(POWERCON|P17|SCHUKO|SECTEUR|230 ?V|16 ?A|32 ?A|63 ?A|POWER|PWR|ALIM)\b/i, 'power', 'unspecified'],
  [/\b(RF|ANT(ENNE|ENNA)?)\b/i, 'rf', 'bnc'],
  [/\b(GPIO?|GPI|RS-?232|RS-?422|RS-?485|TALLY|CTRL|CONTROL|MIDI)\b/i, 'control', 'unspecified'],
  [/\b(XLR|MIC|MICRO|LINE|LIGNE|ANALOG(IQUE)?|PAIRE)\b/i, 'audioAnalog', 'xlr3'],
]
const CONNECTOR_RULES: [RegExp, string][] = [
  [/\bXLR ?5\b/i, 'xlr5'],
  [/\bXLR ?4\b/i, 'xlr4'],
  [/\bXLR\b/i, 'xlr3'],
  [/\bBNC\b/i, 'bnc'],
  [/\bETHERCON\b/i, 'ethercon'],
  [/\bRJ-?45\b/i, 'rj45'],
  [/\bNL ?8\b/i, 'speakon-nl8'],
  [/\bNL ?4\b|\bSPEAKON\b/i, 'speakon-nl4'],
  [/\bJACK\b/i, 'jack-trs'],
  [/\bOPTICALCON\b/i, 'opticalcon'],
  [/\bPOWERCON\b/i, 'powercon'],
]

export function signalOf(text: string): { signal: SignalFamily; connector: string } | null {
  for (const [re, signal, connector] of SIGNAL_RULES) if (re.test(text)) return { signal, connector: connectorOf(text) ?? connector }
  return null
}

const connectorOf = (text: string) => CONNECTOR_RULES.find(([re]) => re.test(text))?.[1] ?? null

function directionOf(name: string): PortDirection | null {
  if (/\b(OUT(PUT)?S?|SORTIES?|PGM|TX|SEND|DEPART|DÉPART|AUX ?OUT)\b/i.test(name)) return 'out'
  if (/\b(IN(PUT)?S?|ENTR[ÉE]ES?|RX|RETURN|RETOUR)\b/i.test(name)) return 'in'
  if (/\b(DANTE|AES67|ETH(ERNET)?|LAN|NET(WORK)?|RJ-?45|ETHERCON|R[ÉE]SEAU|PRI|SEC|INTERCOM)\b/i.test(name)) return 'bidir'
  return null
}

/** Famille d'un équipement d'après les mots de son cadre (sans fiche reconnue). */
const FAMILY_RULES: [RegExp, EquipmentFamily][] = [
  [/\b(console (lumi[eè]re|light)|pupitre|grand ?ma|ma ?[23]|chamsys|avolites|eos|hog)\b/i, 'lightingControl'],
  [/\b(lyre|wash|spot|beam|d[ée]coupe|fresnel|par ?\d*|led ?bar|projecteur (asservi|lumi[eè]re)|strobe)\b/i, 'luminaire'],
  [/\b(splitter dmx|booster dmx|node|art-?net|dmx)\b/i, 'dmxDistribution'],
  [/\b(stage ?box|rio|boitier de sc[eè]ne|boîtier de scène)\b/i, 'stagebox'],
  [/\b(console|mixer|mixage|table|foh|mon(itor)? console)\b/i, 'console'],
  [/\b(ampli(ficateur)?|amp)\b/i, 'amplification'],
  [/\b(enceinte|speaker|sub|line ?array|retour sc[eè]ne|wedge|lf|hf)\b/i, 'speaker'],
  [/\b(hf|r[ée]cepteur|receiver|wireless|[ée]metteur|iem|ear)\b/i, 'wireless'],
  [/\b(micro|mic|chant|voix|kick|snare|caisse|guitare|basse|overhead|di|direct box)\b/i, 'capture'],
  [/\b(enregistreur|recorder|multipiste|record)\b/i, 'recording'],
  [/\b(intercom|beltpack|clear-?com|riedel|base)\b/i, 'intercom'],
  [/\b(cam(era|éra)?|ptz|camescope|caméscope)\b/i, 'camera'],
  [/\b(m[ée]langeur|switcher|atem|r[ée]gie vid[ée]o|vision mixer)\b/i, 'videoSwitcher'],
  [/\b(matrice|router|grille|convert(isseur|er)?|scaler|splitter|distrib(ution)? vid[ée]o)\b/i, 'videoRouting'],
  [/\b([ée]cran|moniteur|monitor|display|tv|led wall|mur led|vid[ée]oprojecteur|projecteur vid[ée]o)\b/i, 'display'],
  [/\b(switch|routeur|r[ée]seau|wifi|access point)\b/i, 'network'],
  [/\b(horloge|clock|sync|genlock|g[ée]n[ée]rateur)\b/i, 'sync'],
  [/\b(armoire|distrib(ution)?|power|[ée]lectrique|p17)\b/i, 'power'],
  [/\b(patch|panneau|bo[iî]te)\b/i, 'passive'],
]

/** Pictogramme par défaut d'une famille */
export const PICTOGRAM_OF: Record<EquipmentFamily, PictogramId> = {
  capture: 'mic', console: 'console', stagebox: 'stagebox', processing: 'processor', amplification: 'amp',
  speaker: 'speaker', wireless: 'wireless', recording: 'recorder', camera: 'camera', videoSwitcher: 'switcher',
  videoRouting: 'router', display: 'display', intercom: 'intercom', network: 'switch', sync: 'clock',
  control: 'control', power: 'power', passive: 'patch', luminaire: 'light', lightingControl: 'console',
  dmxDistribution: 'switch',
}

const DOMAIN_SIGNAL: Record<string, SignalFamily> = {
  sound: 'audioAnalog', image: 'video', light: 'dmx', network: 'network', distribution: 'power',
}

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '')

/** Fiche de la bibliothèque dont le fabricant et le modèle figurent dans le cadre. */
export function matchTemplate(text: string, library: EquipmentTemplate[]): EquipmentTemplate | null {
  const t = norm(text)
  let best: EquipmentTemplate | null = null
  let bestLen = 0
  for (const tpl of library) {
    if (!tpl.manufacturer || tpl.status === 'generic') continue
    const model = norm(tpl.model)
    if (model.length < 3 || !t.includes(model)) continue
    const maker = norm(tpl.manufacturer.split(/[\s(]/)[0])
    // Modèle court (ex. D80) : le fabricant doit aussi être écrit
    if (!(t.includes(maker) || (model.length >= 5 && /\d/.test(model)))) continue
    if (model.length > bestLen) {
      best = tpl
      bestLen = model.length
    }
  }
  return best
}

// ---------- Géométrie ----------

const inside = (b: Box, x: number, y: number, m = 0) => x >= b.x - m && x <= b.x + b.w + m && y >= b.y - m && y <= b.y + b.h + m
const contains = (a: Box, b: Box) => b.x >= a.x - TOL && b.y >= a.y - TOL && b.x + b.w <= a.x + a.w + TOL && b.y + b.h <= a.y + a.h + TOL
const center = (t: PdfText): [number, number] => [t.x + t.w / 2, t.y + t.h / 2]

/** Distance d'un point au bord d'un cadre (0 sur le bord), et côté le plus proche. */
function edgeOf(b: Box, x: number, y: number): { d: number; side: Side } {
  const cands: [number, Side][] = [
    [Math.abs(x - b.x) + Math.max(0, b.y - y, y - b.y - b.h), 'left'],
    [Math.abs(x - b.x - b.w) + Math.max(0, b.y - y, y - b.y - b.h), 'right'],
    [Math.abs(y - b.y) + Math.max(0, b.x - x, x - b.x - b.w), 'top'],
    [Math.abs(y - b.y - b.h) + Math.max(0, b.x - x, x - b.x - b.w), 'bottom'],
  ]
  cands.sort((p, q) => p[0] - q[0])
  return { d: cands[0][0], side: cands[0][1] }
}

function segDist(px: number, py: number, s: { x1: number; y1: number; x2: number; y2: number }) {
  const dx = s.x2 - s.x1
  const dy = s.y2 - s.y1
  const l2 = dx * dx + dy * dy || 1
  const t = Math.max(0, Math.min(1, ((px - s.x1) * dx + (py - s.y1) * dy) / l2))
  return Math.hypot(px - s.x1 - t * dx, py - s.y1 - t * dy)
}

/** Distance d'un texte (son rectangle) à un segment. */
function textSegDist(t: PdfText, s: PdfSegment) {
  const [cx, cy] = center(t)
  return Math.min(segDist(cx, cy, s), segDist(t.x, cy, s), segDist(t.x + t.w, cy, s))
}

// ---------- Interprétation ----------

function dedupeRects(rects: PdfRect[]): Box[] {
  const out: Box[] = []
  for (const r of rects) {
    if (!out.some((o) => Math.abs(o.x - r.x) < TOL && Math.abs(o.y - r.y) < TOL && Math.abs(o.w - r.w) < TOL && Math.abs(o.h - r.h) < TOL)) {
      out.push({ x: r.x, y: r.y, w: r.w, h: r.h })
    }
  }
  return out
}

export function interpretPage(page: PdfPage, library: EquipmentTemplate[]): PageInterpretation {
  const base: PageInterpretation = {
    page: page.index, width: page.width, height: page.height, kind: 'vector', equipment: [], links: [], looseText: [], unresolved: 0,
  }
  if (!page.texts.length && !page.segments.length && !page.rects.length) return { ...base, kind: page.images ? 'raster' : 'empty' }

  // 1. Cadres candidats : ni minuscules, ni cadre de page ; ceux qui en contiennent d'autres sont des
  //    zones ou des cartouches, ceux qui sont dans un autre sont des détails (connecteurs dessinés)
  const all = dedupeRects(page.rects).filter((b) => b.w >= 24 && b.h >= 14 && b.w < page.width * 0.85 && b.h < page.height * 0.85)
  const containers = new Set(all.filter((a) => all.filter((b) => b !== a && contains(a, b)).length >= 2))
  let boxes = all.filter((b) => !containers.has(b) && !all.some((a) => a !== b && !containers.has(a) && contains(a, b)))

  // 2. Textes dans les cadres
  const textsOf = new Map<Box, PdfText[]>()
  const loose: PdfText[] = []
  for (const t of page.texts) {
    const [cx, cy] = center(t)
    const box = boxes.filter((b) => inside(b, cx, cy)).sort((a, b) => a.w * a.h - b.w * b.h)[0]
    if (box) textsOf.set(box, [...(textsOf.get(box) ?? []), t])
    else loose.push(t)
  }
  boxes = boxes.filter((b) => textsOf.has(b))
  // Aucun cadre : page scannée ou exportée en image (le texte éventuel est une légende posée dessus)
  if (!boxes.length) return { ...base, kind: page.images ? 'raster' : 'empty', looseText: page.texts.map((t) => t.str) }

  // 3. Tracés : segments hors cadres, regroupés en tracés continus
  const nearBorder = (x: number, y: number) => boxes.find((b) => inside(b, x, y, 6) && edgeOf(b, x, y).d <= 6)
  // Bords et séparations internes d'un cadre : ignorés
  const segments = page.segments.filter((s) => !boxes.some((b) => inside(b, s.x1, s.y1, TOL) && inside(b, s.x2, s.y2, TOL)))
  const parent = segments.map((_, i) => i)
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])))
  const key = (x: number, y: number) => `${Math.round(x / TOL)}:${Math.round(y / TOL)}`
  const at = new Map<string, number[]>()
  segments.forEach((s, i) => {
    for (const [x, y] of [[s.x1, s.y1], [s.x2, s.y2]]) {
      // Extrémités voisines : on regarde aussi les cases adjacentes de la grille
      for (const dx of [-1, 0, 1]) for (const dy of [-1, 0, 1]) {
        const k = `${Math.round(x / TOL) + dx}:${Math.round(y / TOL) + dy}`
        for (const j of at.get(k) ?? []) parent[find(j)] = find(i)
      }
      const k = key(x, y)
      at.set(k, [...(at.get(k) ?? []), i])
    }
  })
  const groups = new Map<number, PdfSegment[]>()
  segments.forEach((s, i) => groups.set(find(i), [...(groups.get(find(i)) ?? []), s]))

  // 4. Équipements (les ports sont créés en reliant les tracés)
  const eqs: (ImportedEquipment & { texts: PdfText[]; used: Set<PdfText> })[] = boxes.map((box, i) => ({
    key: `eq${i + 1}`, name: '', model: '', notes: [], box, ports: [], family: 'passive', familyFrom: 'default',
    pictogram: 'patch', links: 0, texts: textsOf.get(box) ?? [], used: new Set(),
  }))
  const eqOfBox = new Map(eqs.map((e) => [e.box, e]))

  /** Port au point d'arrivée d'un tracé : le texte du cadre le plus proche de ce point, sur ce bord. */
  const portAt = (e: (typeof eqs)[number], x: number, y: number): ImportedPort => {
    const { side } = edgeOf(e.box, x, y)
    const horizontal = side === 'left' || side === 'right'
    const label = e.texts
      .filter((t) => {
        const [cx, cy] = center(t)
        if (horizontal) return Math.abs(cy - y) <= Math.max(9, t.h * 1.3) && (side === 'left' ? cx < e.box.x + e.box.w / 2 : cx > e.box.x + e.box.w / 2)
        return Math.abs(cx - x) <= Math.max(24, t.w / 2 + 4) && (side === 'top' ? cy < e.box.y + e.box.h / 2 : cy > e.box.y + e.box.h / 2)
      })
      .sort((a, b) => Math.hypot(center(a)[0] - x, center(a)[1] - y) - Math.hypot(center(b)[0] - x, center(b)[1] - y))[0]
    const existing = label ? e.ports.find((p) => p.name === label.str && p.side === side) : undefined
    if (existing) return existing
    if (label) e.used.add(label)
    const name = label?.str ?? `Port ${e.ports.length + 1}`
    const dir = label ? directionOf(name) : null
    const port: ImportedPort = {
      key: `${e.key}p${e.ports.length + 1}`,
      name,
      unnamed: !label,
      direction: dir ?? (side === 'left' || side === 'top' ? 'in' : 'out'),
      directionFrom: dir ? 'keyword' : 'side',
      signal: 'audioAnalog',
      signalFrom: 'default',
      connector: connectorOf(name) ?? 'unspecified',
      side,
      along: horizontal ? y : x,
    }
    e.ports.push(port)
    return port
  }

  const rawLinks: { a: { e: (typeof eqs)[number]; p: ImportedPort }; b: { e: (typeof eqs)[number]; p: ImportedPort }; segs: PdfSegment[] }[] = []
  for (const segs of groups.values()) {
    // Points du tracé posés sur le bord d'un cadre : un par cadre (le plus proche du bord)
    const hits = new Map<Box, { x: number; y: number; d: number }>()
    for (const s of segs) {
      for (const [x, y] of [[s.x1, s.y1], [s.x2, s.y2]]) {
        const b = nearBorder(x, y)
        if (!b) continue
        const d = edgeOf(b, x, y).d
        const prev = hits.get(b)
        if (!prev || d < prev.d) hits.set(b, { x, y, d })
      }
    }
    if (hits.size !== 2) {
      if (hits.size === 1 || hits.size > 2) base.unresolved++
      continue
    }
    const [[ba, ha], [bb, hb]] = [...hits.entries()]
    const ea = eqOfBox.get(ba)!
    const eb = eqOfBox.get(bb)!
    rawLinks.push({ a: { e: ea, p: portAt(ea, ha.x, ha.y) }, b: { e: eb, p: portAt(eb, hb.x, hb.y) }, segs })
  }

  // 5. Titre (nom, modèle), ports non reliés, notes
  for (const e of eqs) {
    const rest = e.texts.filter((t) => !e.used.has(t)).sort((a, b) => a.y - b.y || a.x - b.x)
    const maxH = Math.max(...e.texts.map((t) => t.h))
    const portH = e.ports.length ? Math.max(...e.texts.filter((t) => e.used.has(t)).map((t) => t.h)) : 0
    const titles: PdfText[] = []
    for (const t of rest) {
      if (titles.length >= 2) break
      const portLike = portH > 0 && t.h <= portH + 0.3 && t.h < maxH - 0.3
      if (!portLike || titles.length === 0) titles.push(t)
    }
    e.name = titles[0]?.str ?? ''
    e.model = titles[1]?.str ?? ''
    for (const t of rest) {
      if (titles.includes(t)) continue
      const cy = center(t)[1]
      const nearLeft = t.x - e.box.x < e.box.w * 0.2
      const nearRight = e.box.x + e.box.w - (t.x + t.w) < e.box.w * 0.2
      const small = t.h < maxH - 0.3
      if (small && (nearLeft || nearRight) && t.str.length <= 24) {
        const side: Side = nearRight && !nearLeft ? 'right' : 'left'
        const dir = directionOf(t.str)
        e.ports.push({
          key: `${e.key}p${e.ports.length + 1}`, name: t.str, unnamed: false,
          direction: dir ?? (side === 'left' ? 'in' : 'out'), directionFrom: dir ? 'keyword' : 'side',
          signal: 'audioAnalog', signalFrom: 'default', connector: connectorOf(t.str) ?? 'unspecified', side, along: cy,
        })
      } else e.notes.push(t.str)
    }
    // Famille : fiche reconnue, sinon mots du cadre
    const text = e.texts.map((t) => t.str).join(' ')
    const tpl = matchTemplate(text, library)
    if (tpl) {
      e.match = { templateId: tpl.id, label: `${tpl.manufacturer} ${tpl.model}` }
      e.family = tpl.family
      e.familyFrom = 'document'
      e.pictogram = tpl.pictogram
    } else {
      const f = FAMILY_RULES.find(([re]) => re.test(text))?.[1]
      if (f) {
        e.family = f
        e.familyFrom = 'keyword'
      }
      e.pictogram = PICTOGRAM_OF[e.family]
    }
    e.ports.sort((a, b) => (a.side === b.side ? a.along - b.along : a.side.localeCompare(b.side)))
  }

  // 6. Liaisons : sens, repère, longueur, signal
  const labelOf = new Map<number, PdfText[]>()
  for (const t of loose) {
    let best = -1
    let bestD = 14
    rawLinks.forEach((l, i) => {
      for (const s of l.segs) {
        const d = textSegDist(t, s)
        if (d < bestD) {
          bestD = d
          best = i
        }
      }
    })
    if (best >= 0) labelOf.set(best, [...(labelOf.get(best) ?? []), t])
    else base.looseText.push(t.str)
  }

  const links: ImportedLink[] = rawLinks.map((l, i) => {
    // Sens : depuis la sortie ; sinon dans l'ordre du dessin
    const [src, dst] = l.a.p.direction === 'in' && l.b.p.direction !== 'in' ? [l.b, l.a] : [l.a, l.b]
    const words = (labelOf.get(i) ?? []).map((t) => t.str).join(' ')
    const tokens = words.split(/\s+/).filter(Boolean)
    const ref = tokens.find((w) => /^[A-Z]{0,5}[-_.]?\d{1,4}[A-Z]?$/i.test(w) && !/^\d+([.,]\d+)?m$/i.test(w))
    const len = /(\d+(?:[.,]\d+)?)\s?m\b/i.exec(words)
    const note = tokens.filter((w) => w !== ref).join(' ').replace(/(\d+(?:[.,]\d+)?)\s?m\b/i, '').trim()
    // Câble réseau (Cat6...) entre deux ports Dante : le signal est celui des ports
    const onCable = signalOf(words)
    const onPorts = signalOf(`${src.p.name} ${dst.p.name}`)
    const found = onCable && onPorts && onCable.signal === 'network' ? onPorts : onCable ?? onPorts
    src.e.links++
    dst.e.links++
    const pts: [number, number][] = l.segs.flatMap((s) => [[s.x1, s.y1], [s.x2, s.y2]] as [number, number][])
    return {
      key: `lk${i + 1}`,
      from: { eq: src.e.key, port: src.p.key },
      to: { eq: dst.e.key, port: dst.p.key },
      ...(ref ? { ref } : {}),
      ...(len ? { lengthM: Number(len[1].replace(',', '.')) } : {}),
      ...(note ? { note } : {}),
      signal: found?.signal ?? 'audioAnalog',
      signalFrom: found ? 'keyword' : 'default',
      color: l.segs[0].color,
      points: pts,
    }
  })

  // Couleur du trait : un trait de même couleur qu'une liaison identifiée transporte le même signal
  const byColor = new Map<string, Map<SignalFamily, number>>()
  for (const l of links) {
    if (l.signalFrom !== 'keyword') continue
    const m = byColor.get(l.color) ?? new Map()
    m.set(l.signal, (m.get(l.signal) ?? 0) + 1)
    byColor.set(l.color, m)
  }
  const eqByKey = new Map(eqs.map((e) => [e.key, e]))
  for (const l of links) {
    if (l.signalFrom === 'keyword') continue
    const votes = byColor.get(l.color)
    if (votes && l.color !== '#000000') {
      l.signal = [...votes.entries()].sort((a, b) => b[1] - a[1])[0][0]
      l.signalFrom = 'color'
      continue
    }
    // Domaine commun des deux équipements (ex. deux équipements audio : audio analogique)
    const da = domainOf(eqByKey.get(l.from.eq)!)
    const db = domainOf(eqByKey.get(l.to.eq)!)
    if (da === db && DOMAIN_SIGNAL[da]) {
      l.signal = DOMAIN_SIGNAL[da]
      l.signalFrom = eqByKey.get(l.from.eq)!.familyFrom === 'default' ? 'default' : 'keyword'
    }
  }
  // Ports : signal de leur liaison, sinon d'après leur nom, sinon d'après l'équipement
  for (const e of eqs) {
    for (const p of e.ports) {
      const l = links.find((x) => (x.from.eq === e.key && x.from.port === p.key) || (x.to.eq === e.key && x.to.port === p.key))
      const own = signalOf(p.name)
      if (l) {
        p.signal = l.signal
        p.signalFrom = l.signalFrom
        if (p.connector === 'unspecified' && own && own.signal === l.signal) p.connector = own.connector
      } else if (own) {
        p.signal = own.signal
        p.signalFrom = 'keyword'
        if (p.connector === 'unspecified') p.connector = own.connector
      } else {
        p.signal = DOMAIN_SIGNAL[domainOf(e)] ?? 'audioAnalog'
        p.signalFrom = 'default'
      }
    }
  }

  const equipment = eqs.map((e): ImportedEquipment => ({
    key: e.key, name: e.name, model: e.model, notes: e.notes, box: e.box, ports: e.ports, family: e.family,
    familyFrom: e.familyFrom, pictogram: e.pictogram, links: e.links, ...(e.match ? { match: e.match } : {}),
  }))
  return { ...base, equipment, links }
}
