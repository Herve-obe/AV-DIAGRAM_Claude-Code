// Fusion d'une autre version du projet : bilan (ajouts, conflits, renumérotations) avant d'appliquer.
// La fusion passe par replaceProject : Annuler (Ctrl+Z) revient à la version d'avant.
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { notifyError, openProjectFile } from '../io/files'
import { mergeProjects, type MergeKind, type MergePolicy } from '../model/merge'
import { useProject } from '../store/projectStore'
import { useUi } from '../store/uiStore'
import { Icon } from './Icon'

const KINDS: MergeKind[] = ['equipment', 'links', 'multicores', 'sheets', 'zones', 'annotations']

/** Ouvre un fichier .avd et prépare la fusion avec le projet courant. */
export async function startMerge(t: (k: string) => string) {
  try {
    const p = await openProjectFile()
    if (p) useUi.getState().setMergeCandidate(p)
  } catch {
    notifyError(t('menu.openError'))
  }
}

export function MergeDialog() {
  const { t } = useTranslation()
  const theirs = useUi((s) => s.mergeCandidate)
  const ours = useProject((s) => s.project)
  const [policy, setPolicy] = useState<MergePolicy>('ours')
  const close = () => useUi.getState().setMergeCandidate(null)
  const result = useMemo(() => (theirs ? mergeProjects(ours, theirs, policy) : null), [ours, theirs, policy])

  useEffect(() => {
    if (!theirs) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [theirs])

  if (!theirs || !result) return null
  const { report } = result
  const totalAdded = KINDS.reduce((s, k) => s + report.added[k], 0)
  const apply = () => {
    useProject.getState().replaceProject(result.project)
    close()
  }

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="merge-title">
        <header className="dialog-head">
          <h2 id="merge-title">{t('merge.title')}</h2>
          <button className="icon-btn" onClick={close} aria-label={t('settings.close')}><Icon name="close" /></button>
        </header>
        <div className="dialog-body">
          <p className="dialog-hint">{t('merge.hint', { name: theirs.name })}</p>
          <section>
            <h3 className="group-title">{t('merge.added')}</h3>
            {totalAdded === 0 ? <p className="dialog-hint">{t('merge.nothingAdded')}</p> : (
              <ul className="merge-list">
                {KINDS.filter((k) => report.added[k] > 0).map((k) => <li key={k}><span className="mono">{report.added[k]}</span> {t(`merge.kind.${k}`)}</li>)}
              </ul>
            )}
            {report.renumbered > 0 && <p className="dialog-hint">{t('merge.renumbered', { count: report.renumbered })}</p>}
          </section>
          <section>
            <h3 className="group-title">{t('merge.conflicts', { count: report.conflicts.length })}</h3>
            {report.conflicts.length === 0 ? <p className="dialog-hint">{t('merge.noConflict')}</p> : (
              <>
                <div className="seg merge-policy" role="radiogroup" aria-label={t('merge.policy')}>
                  {(['ours', 'theirs'] as const).map((v) => (
                    <button key={v} role="radio" aria-checked={policy === v} className="seg-btn" aria-pressed={policy === v} onClick={() => setPolicy(v)}>{t(`merge.${v}`)}</button>
                  ))}
                </div>
                <ul className="merge-list">
                  {report.conflicts.slice(0, 12).map((c) => <li key={`${c.kind}-${c.id}`}>{t(`merge.kind.${c.kind}`)} : <strong>{c.name || c.id}</strong></li>)}
                  {report.conflicts.length > 12 && <li className="dim">{t('merge.more', { count: report.conflicts.length - 12 })}</li>}
                </ul>
              </>
            )}
          </section>
          <p className="dialog-hint">{t('merge.limit')}</p>
          <div className="dialog-actions">
            <button className="btn btn-ghost" onClick={close}>{t('merge.cancel')}</button>
            <button className="btn btn-primary" onClick={apply}><Icon name="check" size={14} />{t('merge.apply')}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
