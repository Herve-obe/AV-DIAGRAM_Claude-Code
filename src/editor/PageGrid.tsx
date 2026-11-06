// Pages fixes à 100 %, indépendantes de l'export. Les pointillés délimitent la zone de dessin,
// hors marges et cartouche ; le débordement ajoute des pages voisines.
import { ViewportPortal, useEdges, useNodes, useStore, useViewport, type ReactFlowInstance } from '@xyflow/react'
import { useTranslation } from 'react-i18next'
import { exportSettingsOf, sheetLayout, tileRef, tilesFor } from '../io/exportOptions'
import { drawingBounds, useRoutes } from './EdgeRouter'
import type { Project } from '../model/types'
import { SIGNAL_FAMILIES } from '../model/signals'

export function PageGrid({ project }: { project: Project }) {
  const { t } = useTranslation()
  const nodes = useNodes()
  const edges = useEdges()
  const routing = useRoutes()
  const viewport = useViewport()
  const width = useStore(s => s.width)
  const height = useStore(s => s.height)
  const opts = exportSettingsOf(project)
  const { area } = sheetLayout(opts.paper, opts.orientation, SIGNAL_FAMILIES.length, project.info?.revisions?.length ?? 0)
  const grid = tilesFor(drawingBounds(nodes, edges, routing), area, 100)
  // Ne dessiner que les pages à l'écran évite de créer des milliers d'éléments sur un grand plan.
  const firstCol = Math.max(0, Math.floor((-viewport.x / viewport.zoom - grid.x) / grid.tileW))
  const firstRow = Math.max(0, Math.floor((-viewport.y / viewport.zoom - grid.y) / grid.tileH))
  const lastCol = Math.min(grid.cols - 1, Math.floor(((width - viewport.x) / viewport.zoom - grid.x) / grid.tileW))
  const lastRow = Math.min(grid.rows - 1, Math.floor(((height - viewport.y) / viewport.zoom - grid.y) / grid.tileH))
  const cells = []
  for (let row = firstRow; row <= lastRow; row++) {
    for (let col = firstCol; col <= lastCol; col++) {
      cells.push(<div key={`${col}-${row}`} className="page-grid-cell"
        style={{ left: grid.x + col * grid.tileW, top: grid.y + row * grid.tileH, width: grid.tileW, height: grid.tileH }}>
        <span>{t('exportPdf.pageLabel', { ref: tileRef(col, row), paper: opts.paper })}</span>
      </div>)
    }
  }
  return <ViewportPortal><div className="page-grid">{cells}</div></ViewportPortal>
}

/** La touche F recadre sur les pages, sans dépendre du choix d'export. */
export function fitToPage(rf: Pick<ReactFlowInstance, 'fitBounds' | 'getNodes' | 'getEdges'>, project: Project, duration = 250): boolean {
  const opts = exportSettingsOf(project)
  const { area } = sheetLayout(opts.paper, opts.orientation, SIGNAL_FAMILIES.length, project.info?.revisions?.length ?? 0)
  const grid = tilesFor(drawingBounds(rf.getNodes(), rf.getEdges()), area, 100)
  void rf.fitBounds({ x: grid.x, y: grid.y, width: grid.cols * grid.tileW, height: grid.rows * grid.tileH }, { padding: 0.04, duration })
  return true
}
