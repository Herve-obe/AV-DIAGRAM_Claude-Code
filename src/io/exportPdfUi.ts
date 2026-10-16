// Lance l'export PDF depuis l'interface : chaque feuille est affichée puis capturée, soit entière
// (mise à l'échelle sur une page), soit par pages à l'échelle d'impression (taille fixe, assemblage).
// La feuille et la vue courantes sont rétablies ensuite. Fournit aussi les libellés traduits.
import type { ReactFlowInstance } from '@xyflow/react'
import type { TFunction } from 'i18next'
import { drawingBounds } from '../editor/EdgeRouter'
import { SIGNAL_FAMILIES } from '../model/signals'
import { DOCUMENT_STATUSES, type ExportSettings, type ProjectInfo } from '../model/types'
import { useProject } from '../store/projectStore'
import { useTitleBlock } from '../store/titleBlockStore'
import { useUi } from '../store/uiStore'
import { exportSettingsOf, MM_PER_UNIT, sheetsToExport, sheetLayout, tileRef, tilesFor } from './exportOptions'
import { notifyError } from './files'
import { captureCanvasLight, exportPdf, type ExportPasswords, type PdfLabels, type SheetShot } from './pdf'

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function pdfLabels(t: TFunction): PdfLabels {
  return {
    legend: t('pdf.legend'),
    signals: Object.fromEntries(SIGNAL_FAMILIES.map((s) => [s, t(`signal.${s}`)])),
    owner: t('titleBlock.owner'),
    title: t('titleBlock.title'),
    client: t('titleBlock.client'),
    venue: t('titleBlock.venue'),
    eventDate: t('titleBlock.eventDate'),
    author: t('titleBlock.author'),
    approver: t('titleBlock.approver'),
    docType: t('titleBlock.docType'),
    status: t('titleBlock.status'),
    statuses: Object.fromEntries(DOCUMENT_STATUSES.map((s) => [s, t(`titleBlock.statuses.${s}`)])),
    docNumber: t('titleBlock.docNumber'),
    revision: t('titleBlock.revision'),
    issueDate: t('titleBlock.issueDate'),
    language: t('titleBlock.language'),
    sheet: t('titleBlock.sheet'),
    classification: t('titleBlock.classification'),
    techRef: t('titleBlock.techRef'),
    revisions: {
      index: t('titleBlock.revIndex'),
      date: t('titleBlock.revDate'),
      description: t('titleBlock.revDescription'),
      by: t('titleBlock.revBy'),
    },
  }
}

/** Donne au canevas une taille fixe (en px) le temps des captures ; renvoie la fonction de retour. */
function sizeCanvas(width: number, height: number): () => void {
  const el = document.querySelector<HTMLElement>('.react-flow')
  if (!el) return () => {}
  const saved = el.getAttribute('style')
  Object.assign(el.style, { position: 'fixed', left: '0', top: '0', width: `${Math.round(width)}px`, height: `${Math.round(height)}px`, zIndex: '-1' })
  return () => {
    if (saved === null) el.removeAttribute('style')
    else el.setAttribute('style', saved)
  }
}

/** Largeur de capture (px) : environ 4 px par mm de zone, bornée */
const captureWidth = (areaW: number) => Math.min(4000, Math.max(1600, areaW * 4))

/**
 * Exporte la planche PDF. info : champs du cartouche saisis dans la fenêtre d'export ;
 * passwords : mots de passe de protection (jamais enregistrés).
 */
export async function exportPdfWithLabels(rf: ReactFlowInstance, t: TFunction, info: ProjectInfo, passwords?: ExportPasswords, options?: ExportSettings): Promise<number> {
  const project = useProject.getState().project
  const opts = options ?? exportSettingsOf(project)
  const { currentSheetId: initial, selectedEquipment, selectedLinks } = useUi.getState()
  const initialViewport = rf.getViewport()
  const sheets = sheetsToExport(project, initial)
  const { area } = sheetLayout(opts.paper, opts.orientation, SIGNAL_FAMILIES.length, info.revisions?.length ?? 0)
  const shots: SheetShot[] = []
  const capW = captureWidth(area.w)
  const restore = sizeCanvas(capW, (capW * area.h) / area.w)
  try {
    for (const sheet of sheets) {
      useUi.getState().setSheet(sheet.id)
      await wait(250) // rendu et mesure des blocs de la feuille
      const name = sheets.length > 1 ? sheet.name : ''
      const bounds = drawingBounds(rf.getNodes(), rf.getEdges())
      if (opts.scaleMode !== 'tile') {
        // Inclure aussi les détours et étiquettes ; ne pas agrandir les petits schémas.
        const capH = capW * area.h / area.w
        const zoom = bounds ? Math.min(MM_PER_UNIT * capW / area.w, capW / (bounds.w + 80), capH / (bounds.h + 80)) : 1
        await rf.setViewport({ x: bounds ? (capW - bounds.w * zoom) / 2 - bounds.x * zoom : 0,
          y: bounds ? (capH - bounds.h * zoom) / 2 - bounds.y * zoom : 0, zoom })
        await wait(250)
        const shot = await captureCanvasLight()
        if (shot) shots.push({ ...shot, name })
        continue
      }
      // Taille fixe : une capture par page de l'assemblage, à l'échelle d'impression
      const tiles = tilesFor(bounds, area, opts.printScale)
      const zoom = capW / tiles.tileW
      for (let r = 0; r < tiles.rows; r++) {
        for (let c = 0; c < tiles.cols; c++) {
          await rf.setViewport({ x: -(tiles.x + c * tiles.tileW) * zoom, y: -(tiles.y + r * tiles.tileH) * zoom, zoom })
          await wait(200)
          const shot = await captureCanvasLight()
          if (shot) shots.push({ ...shot, name, tile: tiles.cols * tiles.rows > 1 ? tileRef(c, r) : undefined })
        }
      }
    }
    const template = useTitleBlock.getState().template
    return await exportPdf({ project, info, template, opts, labels: pdfLabels(t), date: new Date(), passwords }, shots)
  } catch (e) {
    notifyError(t('pdf.error') + (e instanceof Error && e.message ? ` (${e.message})` : typeof e === 'string' ? ` (${e})` : ''))
    return 0
  } finally {
    restore()
    useUi.getState().setSheet(initial)
    useUi.getState().select(selectedEquipment, selectedLinks)
    await wait(120)
    await rf.setViewport(initialViewport)
  }
}
