// Mode débutant : guide pas à pas (étapes cochées au fil du travail, chacune avec son action),
// suggestions « Et ensuite ? » pour l'équipement sélectionné, et aide sur le schéma vide.
import { useState } from 'react'
import { useReactFlow } from '@xyflow/react'
import { useTranslation } from 'react-i18next'
import { saveProjectFile } from '../io/files'
import { DEFAULT_SHEET_ID } from '../model/project'
import type { Equipment } from '../model/types'
import { useProject } from '../store/projectStore'
import { useSaveFolder } from '../store/saveFolderStore'
import { useIssues } from '../store/useIssues'
import { useUi } from '../store/uiStore'
import { useExportPdf } from './ExportPdfDialog'
import { Icon } from './Icon'
import { LIBRARY_SEARCH } from './LibraryPanel'

const searchLibrary = (text: string) => window.dispatchEvent(new CustomEvent(LIBRARY_SEARCH, { detail: text }))

/** Équipements de la feuille affichée */
function useSheetEquipment(): Equipment[] {
  const project = useProject((s) => s.project)
  const sheet = useUi((s) => s.currentSheetId)
  return Object.values(project.equipment).filter((e) => (e.sheetId ?? DEFAULT_SHEET_ID) === sheet)
}

/** Panneau « Pas à pas » : affiché dans l'inspecteur quand rien n'est sélectionné. */
export function GuideSteps() {
  const { t } = useTranslation()
  const project = useProject((s) => s.project)
  const equipment = useSheetEquipment()
  const issues = useIssues()
  const saved = useSaveFolder((s) => s.savedToFile.includes(project.id) || (!!s.dir && s.autoCopy))
  const links = Object.keys(project.links).length
  const hasOut = equipment.some((e) => e.ports.some((p) => p.direction !== 'in'))
  const hasIn = equipment.filter((e) => e.ports.some((p) => p.direction !== 'out')).length >= 1 && equipment.length >= 2
  const steps: { key: string; done: boolean; actions: { label: string; run: () => void }[] }[] = [
    { key: 'sources', done: hasOut, actions: [{ label: t('guide.searchMic'), run: () => searchLibrary('micro') }, { label: t('guide.searchDi'), run: () => searchLibrary('DI') }] },
    { key: 'destination', done: hasIn, actions: [{ label: t('guide.searchConsole'), run: () => searchLibrary('console') }, { label: t('guide.searchStagebox'), run: () => searchLibrary('stagebox') }] },
    {
      key: 'connect', done: links > 0,
      actions: [{ label: t('series.menu'), run: () => useUi.getState().setSeriesFrom(equipment.map((e) => e.id)) }],
    },
    { key: 'check', done: links > 0 && !issues.some((i) => i.severity === 'error'), actions: [{ label: t('guide.showAlerts'), run: () => useUi.getState().setDockTab('issues') }] },
    {
      key: 'save', done: saved,
      actions: [
        { label: t('guide.saveFile'), run: () => { void saveProjectFile(useProject.getState().project) } },
        { label: t('guide.exportPdf'), run: () => useExportPdf.getState().setOpen(true) },
      ],
    },
  ]
  const current = steps.findIndex((s) => !s.done)
  return (
    <section className="guide" aria-label={t('guide.title')}>
      <h3 className="group-title">{t('guide.title')}</h3>
      <ol className="guide-steps">
        {steps.map((s, i) => (
          <li key={s.key} className={`${s.done ? 'is-done' : ''} ${i === current ? 'is-current' : ''}`}>
            <span className="guide-mark" aria-hidden="true">{s.done ? <Icon name="check" size={12} /> : i + 1}</span>
            <div>
              <strong>{t(`guide.${s.key}.title`)}</strong>
              {(i === current || !s.done) && <p>{t(`guide.${s.key}.text`)}</p>}
              {i === current && (
                <div className="guide-actions">
                  {s.actions.map((a) => <button key={a.label} className="btn" onClick={a.run}>{a.label}</button>)}
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
      <h3 className="group-title">{t('guide.tipsTitle')}</h3>
      <ul className="guide-tips">
        {(['drag', 'connect', 'box', 'right', 'zone'] as const).map((k) => <li key={k}>{t(`guide.tips.${k}`)}</li>)}
      </ul>
    </section>
  )
}

/** « Et ensuite ? » pour un équipement sélectionné : relier ses sorties libres, ajouter des exemplaires. */
export function NextSteps({ eq }: { eq: Equipment }) {
  const { t } = useTranslation()
  const rf = useReactFlow()
  const project = useProject((s) => s.project)
  const [count, setCount] = useState(3)
  const used = new Set(Object.values(project.links).flatMap((l) => [`${l.source.equipmentId}/${l.source.portId}`, `${l.target.equipmentId}/${l.target.portId}`]))
  const freeOut = eq.ports.filter((p) => p.direction !== 'in' && !used.has(`${eq.id}/${p.id}`)).length
  const freeIn = eq.ports.filter((p) => p.direction !== 'out' && !used.has(`${eq.id}/${p.id}`)).length
  const addCopies = () => {
    const h = rf.getNode(eq.id)?.measured?.height ?? 60
    const ids = useProject.getState().addCopies(eq.id, count, Math.ceil((h + 20) / 10) * 10)
    useUi.getState().select([eq.id, ...ids], [])
  }
  return (
    <section className="guide guide-next" aria-label={t('guide.nextTitle')}>
      <h3 className="group-title">{t('guide.nextTitle')}</h3>
      <p className="dim small">{t('guide.freePorts', { outs: freeOut, ins: freeIn })}</p>
      {freeOut > 0 && (
        <button className="btn" onClick={() => useUi.getState().setSeriesFrom([eq.id])}>
          <Icon name="synoptic" size={14} />{t('guide.connectOutputs', { count: freeOut })}
        </button>
      )}
      <div className="guide-copies">
        <span>{t('guide.addCopies')}</span>
        <input type="number" min={1} max={48} value={count} aria-label={t('guide.copies')} onChange={(e) => setCount(Math.max(1, Math.min(48, Number(e.target.value) || 1)))} />
        <button className="btn" onClick={addCopies}><Icon name="plus" size={14} />{t('guide.add')}</button>
      </div>
      <p className="source-note">{t('guide.nextHint')}</p>
    </section>
  )
}

/** Schéma vide en mode débutant : les trois gestes pour commencer. */
export function EmptyCanvasHint() {
  const { t } = useTranslation()
  const mode = useUi((s) => s.mode)
  const presenting = useUi((s) => s.presenting)
  const equipment = useSheetEquipment()
  if (mode !== 'beginner' || presenting || equipment.length) return null
  return (
    <div className="canvas-hint" role="note">
      <strong>{t('guide.emptyTitle')}</strong>
      <ol>
        <li>{t('guide.empty1')}</li>
        <li>{t('guide.empty2')}</li>
        <li>{t('guide.empty3')}</li>
      </ol>
      <button className="btn btn-primary" onClick={() => searchLibrary('micro')}>{t('guide.searchMic')}</button>
    </div>
  )
}
