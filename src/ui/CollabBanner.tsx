// Bandeau de la session de collaboration : hôte injoignable, relais pris par un poste de secours,
// modification refusée sur un calque réservé, fin de session.
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { leave, useCollab } from '../collab/session'
import { Icon } from './Icon'

export function CollabBanner() {
  const { t } = useTranslation()
  const notice = useCollab((s) => s.notice)
  const lostSince = useCollab((s) => s.lostSince)
  const status = useCollab((s) => s.status)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!lostSince) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [lostSince])

  if (!notice) return null
  const params: Record<string, string | number> = { ...notice.params }
  if (typeof params.layer === 'string') params.layer = t(`library.domain.${params.layer}`)
  const lost = status === 'reconnecting' && lostSince !== null
  return (
    <div className={`collab-banner tone-${notice.tone}`} role={notice.tone === 'info' ? 'status' : 'alert'}>
      <Icon name={notice.tone === 'info' ? 'users' : notice.key === 'locked' ? 'lock' : 'alert'} size={15} />
      <span className="collab-banner-text">
        {t(`collab.notice.${notice.key}`, params)}
        {lost && <span className="collab-banner-since"> {t('collab.notice.since', { seconds: Math.max(0, Math.round((now - lostSince) / 1000)) })}</span>}
      </span>
      {lost && <button className="btn btn-ghost" onClick={leave}>{t('collab.leave')}</button>}
      <button className="icon-btn" onClick={() => useCollab.getState().dismissNotice()} aria-label={t('settings.close')}><Icon name="close" size={14} /></button>
    </div>
  )
}
