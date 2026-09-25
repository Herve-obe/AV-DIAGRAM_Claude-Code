// Lance l'export PDF depuis l'interface : chaque feuille est affichée, cadrée et capturée,
// puis la feuille courante est rétablie. Fournit aussi les libellés traduits.
import type { ReactFlowInstance } from '@xyflow/react'
import type { TFunction } from 'i18next'
import { SIGNAL_FAMILIES } from '../model/signals'
import { useProject } from '../store/projectStore'
import { useUi } from '../store/uiStore'
import { notifyError } from './files'
import { captureCanvasLight, exportPdf, type SheetShot } from './pdf'

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function exportPdfWithLabels(rf: ReactFlowInstance, t: TFunction) {
  const project = useProject.getState().project
  const ui = useUi.getState()
  const initial = ui.currentSheetId
  const all = project.sheets?.length ? project.sheets : [{ id: initial, name: '' }]
  // Les feuilles vides ne donnent pas de planche
  const used = new Set([
    ...Object.values(project.equipment).map((e) => e.sheetId),
    ...Object.values(project.annotations ?? {}).map((a) => a.sheetId),
  ])
  const nonEmpty = all.filter((s) => used.has(s.id) || (!project.sheets?.length && s.id === initial))
  const sheets = nonEmpty.length ? nonEmpty : all.slice(0, 1)
  const shots: SheetShot[] = []
  try {
    for (const sheet of sheets) {
      useUi.getState().setSheet(sheet.id)
      await wait(200) // rendu des nœuds de la feuille
      // Cadrage borné dans le temps : sur une feuille vide, fitView peut ne jamais se résoudre
      await Promise.race([rf.fitView({ padding: 0.08, maxZoom: 1.2 }), wait(600)])
      await wait(250)
      const shot = await captureCanvasLight()
      if (shot) shots.push({ ...shot, name: sheets.length > 1 ? sheet.name : '' })
    }
    await exportPdf(project, {
      title: t('pdf.title'),
      client: t('settings.client'),
      venue: t('settings.venue'),
      author: t('settings.author'),
      date: t('pdf.date'),
      revision: t('settings.revision'),
      sheet: t('pdf.sheet'),
      legend: t('pdf.legend'),
      signals: Object.fromEntries(SIGNAL_FAMILIES.map((s) => [s, t(`signal.${s}`)])),
    }, shots)
  } catch {
    notifyError(t('pdf.error'))
  } finally {
    useUi.getState().setSheet(initial)
  }
}
