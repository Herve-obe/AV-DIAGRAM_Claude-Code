// Liaison qui vient d'être tirée et pose problème (deux sorties reliées, signal ou niveau
// incompatible…) : on explique pourquoi et on laisse annuler ou garder la liaison.
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { checkLink } from '../model/rules'
import { useProject } from '../store/projectStore'
import { useUi } from '../store/uiStore'
import { Icon } from './Icon'
import { translateParams } from './Inspector'

export function LinkCheckDialog() {
  const { t } = useTranslation()
  const id = useUi((s) => s.linkCheck)
  const project = useProject((s) => s.project)
  const link = id ? project.links[id] : undefined
  const close = () => useUi.getState().setLinkCheck(null)
  const cancel = () => {
    if (id) useProject.getState().remove([], [id])
    close()
  }

  useEffect(() => {
    if (!id) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); cancel() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!id) return null
  // Liaison supprimée entre-temps (annulation, autre participant) : plus rien à confirmer
  if (!link) { queueMicrotask(close); return null }
  const issues = checkLink(project, link).filter((i) => i.severity !== 'info')
  const src = project.equipment[link.source.equipmentId]
  const dst = project.equipment[link.target.equipmentId]
  const port = (eqId: string, portId: string) => project.equipment[eqId]?.ports.find((p) => p.id === portId)?.name ?? portId
  const keepAndIgnore = () => {
    useProject.getState().updateLink(link.id, { ignoredRules: [...(link.ignoredRules ?? []), ...issues.map((i) => i.code)] })
    close()
  }

  return (
    <div className="overlay">
      <div className="dialog link-check" role="alertdialog" aria-modal="true" aria-labelledby="lc-title" aria-describedby="lc-body">
        <header className="dialog-head">
          <h2 id="lc-title"><Icon name="alert" size={16} /> {t('linkCheck.title')}</h2>
        </header>
        <div className="dialog-body" id="lc-body">
          <p className="link-check-route">
            <strong>{src?.name}</strong> · {port(link.source.equipmentId, link.source.portId)}
            {' → '}
            <strong>{dst?.name}</strong> · {port(link.target.equipmentId, link.target.portId)}
          </p>
          {issues.map((i) => (
            <div key={i.code} className={`check sev-${i.severity}`}>
              <div className="check-head"><span className="sev-pill">{t(`severity.${i.severity}`)}</span></div>
              <p>{t(`rules.${i.code}.msg`, translateParams(i.params, t))}</p>
              <p className="check-fix">{t(`rules.${i.code}.fix`)}</p>
            </div>
          ))}
          <p className="dialog-hint">{t('linkCheck.hint')}</p>
        </div>
        <footer className="dialog-foot">
          <button className="btn btn-ghost" onClick={keepAndIgnore}>{t('linkCheck.keepIgnore')}</button>
          <button className="btn" onClick={close}>{t('linkCheck.keep')}</button>
          <button className="btn btn-primary" autoFocus onClick={cancel}>{t('linkCheck.cancel')}</button>
        </footer>
      </div>
    </div>
  )
}
