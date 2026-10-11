// Rendu du format sur le canevas :
// - mode « page » : la feuille entière (bords, zone de dessin, cartouche, légende) à l'échelle d'impression ;
//   les éléments qui dépassent sont signalés ;
// - mode « taille fixe » : chaque page de l'assemblage (A1, B1...) en pointillés, pour voir où le schéma déborde.
import { ViewportPortal, useNodes, type ReactFlowInstance } from '@xyflow/react'
import { useTranslation } from 'react-i18next'
import { exportSettingsOf, pageFrame, sheetLayout, tileRef, tilesFor } from '../io/exportOptions'
import type { Project } from '../model/types'
import { SIGNAL_FAMILIES } from '../model/signals'
import { useProject } from '../store/projectStore'

export function PageGrid() {
  const { t } = useTranslation()
  const project = useProject((s) => s.project)
  const nodes = useNodes()
  const opts = exportSettingsOf(project)
  if (opts.scaleMode === 'page') return <PageFrameView project={project} nodes={nodes} />
  if (opts.scaleMode !== 'tile') return null
  const shown = nodes.filter((n) => !n.hidden && n.measured?.width && n.measured.height)
  if (!shown.length) return null
  const pad = 30
  const x = Math.min(...shown.map((n) => n.position.x)) - pad
  const y = Math.min(...shown.map((n) => n.position.y)) - pad
  const r = Math.max(...shown.map((n) => n.position.x + n.measured!.width!)) + pad
  const b = Math.max(...shown.map((n) => n.position.y + n.measured!.height!)) + pad
  const { area } = sheetLayout(opts.paper, opts.orientation, SIGNAL_FAMILIES.length, project.info?.revisions?.length ?? 0)
  const tiles = tilesFor({ x, y, w: r - x, h: b - y }, area, opts.printScale)
  const cells = []
  for (let row = 0; row < tiles.rows; row++) {
    for (let col = 0; col < tiles.cols; col++) {
      cells.push(
        <div
          key={`${col}-${row}`}
          className="page-grid-cell"
          style={{ left: x + col * tiles.tileW, top: y + row * tiles.tileH, width: tiles.tileW, height: tiles.tileH }}
        >
          <span>{t('exportPdf.pageLabel', { ref: tileRef(col, row), paper: opts.paper })}</span>
        </div>,
      )
    }
  }
  return (
    <ViewportPortal>
      <div className="page-grid">{cells}</div>
    </ViewportPortal>
  )
}

/** Cadre de la feuille (mode « page »), avec le nombre d'éléments qui dépassent de la zone de dessin. */
function PageFrameView({ project, nodes }: { project: Project; nodes: ReturnType<typeof useNodes> }) {
  const { t } = useTranslation()
  const opts = exportSettingsOf(project)
  const f = pageFrame(opts, project.info?.revisions?.length ?? 0)
  const out = nodes.filter((n) => !n.hidden && n.measured?.width && n.measured.height && !n.className?.includes('is-frame'))
    .filter((n) => n.position.x < f.area.x || n.position.y < f.area.y || n.position.x + n.measured!.width! > f.area.x + f.area.w || n.position.y + n.measured!.height! > f.area.y + f.area.h).length
  const box = (r: { x: number; y: number; w: number; h: number }) => ({ left: r.x, top: r.y, width: r.w, height: r.h })
  // Libellés lisibles quelle que soit la taille de la feuille (A4 à A0, échelle d'impression)
  const font = Math.max(14, Math.round(f.sheet.w / 90))
  return (
    <ViewportPortal>
      <div className="page-frame" style={{ ['--page-font' as string]: `${font}px` }}>
        <div className="page-sheet" style={box(f.sheet)}>
          <span className="page-label">
            {t('pageFrame.label', { paper: opts.paper, orientation: t(`exportPdf.${opts.orientation}`), scale: opts.printScale })}
            {out > 0 && <strong className="page-out"> · {t('pageFrame.out', { count: out })}</strong>}
          </span>
        </div>
        <div className={`page-area ${out ? 'has-out' : ''}`} style={box(f.area)} />
        <div className="page-reserved" style={box(f.titleBlock)}><span>{t('pageFrame.titleBlock')}</span></div>
        <div className="page-reserved" style={box(f.legend)}><span>{t('pageFrame.legend')}</span></div>
      </div>
    </ViewportPortal>
  )
}

/** Recadre la vue sur la feuille (mode « page ») ; renvoie faux dans les autres modes. */
export function fitToPage(rf: Pick<ReactFlowInstance, 'fitBounds'>, project: Project, duration = 250): boolean {
  const opts = exportSettingsOf(project)
  if (opts.scaleMode !== 'page') return false
  const { x, y, w, h } = pageFrame(opts, project.info?.revisions?.length ?? 0).sheet
  void rf.fitBounds({ x, y, width: w, height: h }, { padding: 0.04, duration })
  return true
}
