import { useTranslation } from 'react-i18next'
import { leave, useCollab } from '../collab/session'

/** Toujours visible pendant une session, y compris si la fenêtre de gestion est fermée. */
export function CollabSessionBar() {
  const { t } = useTranslation()
  const { status, role, started, participants, setDialogOpen } = useCollab()
  if (status === 'off') return null
  return <div className="collab-session-bar" aria-label={t('collab.title')}>
    <span role="status">{status === 'connected' ? t(started ? 'collab.status.connected' : 'collab.lobby.label') : t(`collab.status.${status}`)}</span>
    <span className="dim">{t('collab.peopleCount', { count: participants.length })}</span>
    <span className="spacer" />
    <button className="btn btn-ghost" onClick={() => setDialogOpen(true)}>{t('collab.manage')}</button>
    <button className="btn btn-danger" onClick={leave}>{t(role === 'host' ? 'collab.stop' : 'collab.leave')}</button>
  </div>
}
