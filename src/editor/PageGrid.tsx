// Découpage en pages de la feuille affichée, quand l'export est en taille fixe : chaque page de
// l'assemblage (A1, B1...) est dessinée en pointillés sur le canevas, pour voir où le schéma déborde.
import { ViewportPortal, useNodes } from '@xyflow/react'
import { useTranslation } from 'react-i18next'
import { exportSettingsOf, sheetLayout, tileRef, tilesFor } from '../io/exportOptions'
import { SIGNAL_FAMILIES } from '../model/signals'
import { useProject } from '../store/projectStore'

export function PageGrid() {
  const { t } = useTranslation()
  const project = useProject((s) => s.project)
  const nodes = useNodes()
  const opts = exportSettingsOf(project)
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
