// Lance l'export PDF depuis l'interface : cadre tout le schéma, puis fournit les libellés traduits.
import type { ReactFlowInstance } from '@xyflow/react'
import type { TFunction } from 'i18next'
import { SIGNAL_FAMILIES } from '../model/signals'
import { useProject } from '../store/projectStore'
import { notifyError } from './files'
import { exportPdf } from './pdf'

export async function exportPdfWithLabels(rf: ReactFlowInstance, t: TFunction) {
  await rf.fitView({ padding: 0.08 })
  await new Promise((r) => setTimeout(r, 250))
  try {
    await exportPdf(useProject.getState().project, {
      title: t('pdf.title'),
      client: t('settings.client'),
      venue: t('settings.venue'),
      author: t('settings.author'),
      date: t('pdf.date'),
      revision: t('settings.revision'),
      sheet: t('pdf.sheet'),
      legend: t('pdf.legend'),
      signals: Object.fromEntries(SIGNAL_FAMILIES.map((s) => [s, t(`signal.${s}`)])),
    })
  } catch {
    notifyError(t('pdf.error'))
  }
}
