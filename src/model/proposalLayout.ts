// Disposition des propositions : blocs et notes lisibles, contenus dans les zones imprimables.
import { exportSettingsOf, sheetBounds, sheetLayout, tilesFor } from '../io/exportOptions'
import { diagramBlockSize, layoutDiagram } from './diagramLayout'
import { DEFAULT_SHEET_ID, uid } from './project'
import { SIGNAL_FAMILIES } from './signals'
import { PAPER_SIZES, type Annotation, type PaperSize, type Project } from './types'

export interface ProposalLayout {
  paper: PaperSize
  pages: number
  valid: boolean
  project: Project
}

interface Panel {
  w: number
  h: number
  equipment: { id: string; x: number; y: number }[]
  annotation?: Annotation
}

const MARGIN = 64, GAP = 48, PAD = 24, HEAD = 48

/** Ne déplace que les ajouts et leurs annotations ; les prises inutilisées restent disponibles. */
export function proposalLayouts(base: Project, source: Project, ids: string[], sheetId: string, rearrange = false): ProposalLayout[] {
  const settings = exportSettingsOf(source)
  const added = ids.filter(id => source.equipment[id] && (source.equipment[id].sheetId ?? DEFAULT_SHEET_ID) === sheetId)
  const wholeSheet = rearrange && Object.values(source.equipment).filter(e => (e.sheetId ?? DEFAULT_SHEET_ID) === sheetId).every(e => added.includes(e.id))
  const annotations = Object.values(source.annotations ?? {}).filter(a => (wholeSheet || (!rearrange && !base.annotations?.[a.id])) && a.sheetId === sheetId)
  const frames = annotations.filter(a => a.kind === 'frame' && a.zoneId)
    .filter((a, i, list) => list.findIndex(b => b.zoneId === a.zoneId) === i)
  const groups: { frame?: Annotation; ids: string[] }[] = frames.map(frame => ({ frame, ids: added.filter(id => source.equipment[id].zoneId === frame.zoneId) }))
  const grouped = new Set(groups.flatMap(g => g.ids))
  groups.push({ ids: added.filter(id => !grouped.has(id)) })
  const equipment = { ...source.equipment }
  for (const id of added) equipment[id] = { ...equipment[id], portsExpanded: false }
  const compact = { ...source, equipment }
  const existing = sheetBounds(rearrange ? { ...source, equipment: Object.fromEntries(Object.entries(source.equipment).filter(([id]) => !added.includes(id))),
    annotations: Object.fromEntries(Object.entries(source.annotations ?? {}).filter(([id]) => !annotations.some(a => a.id === id))) } : base, sheetId, DEFAULT_SHEET_ID)

  return PAPER_SIZES.slice(PAPER_SIZES.indexOf(settings.paper)).map(paper => {
    const { area } = sheetLayout(paper, settings.orientation, SIGNAL_FAMILIES.length, source.info?.revisions?.length ?? 0)
    const { tileW, tileH } = tilesFor(null, area, 100)
    const width = tileW - 2 * MARGIN, height = tileH - 2 * MARGIN
    const panels: Panel[] = []
    let valid = true
    for (const group of groups) {
      if (!group.ids.length) {
        if (rearrange && group.frame) {
          const a = group.frame
          if (a.size.w > width || a.size.h > height) valid = false
          panels.push({ w: a.size.w, h: a.size.h, equipment: [], annotation: a })
        }
        continue
      }
      const local = layoutDiagram({ ...compact, equipment: Object.fromEntries(group.ids.map(id => [id, equipment[id]])) }, group.ids, sheetId)
      const columns = [...new Set(group.ids.map(id => local.equipment[id].position.x))].sort((a, b) => a - b)
      const inset = group.frame ? PAD : 0, top = group.frame ? HEAD : 0
      let panel: Panel = { w: 0, h: 0, equipment: [], annotation: group.frame }
      const finish = () => {
        if (panel.equipment.length) panels.push(panel)
        panel = { w: 0, h: 0, equipment: [], annotation: group.frame }
      }
      for (const col of columns) {
        const column = group.ids.filter(id => local.equipment[id].position.x === col)
          .sort((a, b) => local.equipment[a].position.y - local.equipment[b].position.y)
        const colWidth = Math.max(...column.map(id => diagramBlockSize(compact, equipment[id]).w))
        let x = panel.w ? panel.w + GAP - inset : inset, y = top
        if (x + colWidth + inset > width && panel.equipment.length) { finish(); x = inset }
        for (const id of column) {
          const size = diagramBlockSize(compact, equipment[id])
          if (size.w + 2 * inset > width || size.h + top + inset > height) valid = false
          if (y + size.h + inset > height && y > top) {
            x += colWidth + GAP
            y = top
            if (x + colWidth + inset > width) { finish(); x = inset }
          }
          panel.equipment.push({ id, x, y })
          panel.w = Math.max(panel.w, x + colWidth + inset)
          panel.h = Math.max(panel.h, y + size.h + inset)
          y += size.h + GAP
        }
      }
      finish()
    }

    // Le patch détaillé reste entier, sur des cartes séparées du dessin plutôt qu'au milieu des câbles.
    const noteWidth = Math.min(900, width), chars = Math.max(1, Math.floor((noteWidth - 32) / 8))
    const maxLines = Math.max(1, Math.floor((height - 32) / 20))
    for (const note of annotations.filter(a => a.kind === 'note' || (rearrange && a.kind === 'frame' && !frames.some(f => f.id === a.id)))) {
      if (rearrange) {
        const w = Math.max(200, note.size.w), rows = note.text.split('\n').reduce((n, line) => n + Math.max(1, Math.ceil(line.length / Math.max(1, Math.floor((w - 32) / 8)))), 0)
        const h = Math.max(note.size.h, rows * 20 + 32)
        if (w > width || h > height) valid = false
        panels.push({ w, h, equipment: [], annotation: note })
        continue
      }
      const lines = note.text.split('\n').flatMap(line => line.match(new RegExp(`.{1,${chars}}`, 'gu')) ?? [''])
      for (let start = 0; start < lines.length; start += maxLines) {
        const part = lines.slice(start, start + maxLines)
        panels.push({ w: noteWidth, h: part.length * 20 + 32, equipment: [], annotation: { ...note, text: part.join('\n') } })
      }
    }

    // Rayonnage par page ; aucun bloc ni cadre n'est coupé par un bord de feuille.
    const placed: { panel: Panel; page: number; x: number; y: number }[] = []
    let page = 0, x = 0, y = 0, rowHeight = 0
    for (const panel of panels) {
      if (x && x + panel.w > width) { x = 0; y += rowHeight + GAP; rowHeight = 0 }
      if (y && y + panel.h > height) { page++; x = 0; y = 0; rowHeight = 0 }
      placed.push({ panel, page, x: x + MARGIN, y: y + MARGIN })
      x += panel.w + GAP
      rowHeight = Math.max(rowHeight, panel.h)
    }
    const pages = page + 1
    // Un rectangle complet évite d'exporter des cases vides au dernier rang.
    const cols = Array.from({ length: pages }, (_, i) => i + 1).filter(c => pages % c === 0)
      .sort((a, b) => Math.abs(Math.log(a * a * tileW / (pages * tileH))) - Math.abs(Math.log(b * b * tileW / (pages * tileH))))[0]
    const startCol = existing ? Math.ceil((existing.x + existing.w + MARGIN) / tileW) : 0
    const nextEquipment = { ...equipment }, nextAnnotations = { ...source.annotations }
    for (const a of annotations) delete nextAnnotations[a.id]
    const usedAnnotationIds = new Set(Object.keys(nextAnnotations))
    for (const item of placed) {
      const px = (startCol + item.page % cols) * tileW + item.x
      const py = Math.floor(item.page / cols) * tileH + item.y
      for (const e of item.panel.equipment) nextEquipment[e.id] = { ...equipment[e.id], position: { x: px + e.x, y: py + e.y } }
      if (item.panel.annotation) {
        const a = item.panel.annotation
        let id = a.id
        while (usedAnnotationIds.has(id)) id = uid('ann')
        usedAnnotationIds.add(id)
        nextAnnotations[id] = { ...a, id, position: { x: px, y: py }, size: { w: item.panel.w, h: item.panel.h } }
      }
    }
    const links = rearrange ? Object.fromEntries(Object.entries(source.links).map(([id, link]) => {
      if (!added.includes(link.source.equipmentId) && !added.includes(link.target.equipmentId)) return [id, link]
      const next = { ...link }; delete next.bendX; delete next.bendY
      return [id, next]
    })) : source.links
    const project = { ...source, equipment: nextEquipment, links, ...(annotations.length ? { annotations: nextAnnotations } : {}),
      settings: paper === settings.paper ? source.settings : { ...source.settings, export: { ...settings, paper } } }
    const grid = tilesFor(sheetBounds(project, sheetId, DEFAULT_SHEET_ID, new Map(Object.values(nextEquipment).map(e => [e.id, diagramBlockSize(project, e)]))), area, 100)
    return { paper, pages: grid.cols * grid.rows, valid, project }
  })
}
