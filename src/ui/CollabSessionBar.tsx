import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useShallow } from 'zustand/react/shallow'
import { leave, useCollab } from '../collab/session'
import { refreshHost } from '../collab/failover'

/** Les échecs de code n'émettent aucun événement : l'hôte interroge son relais à cette cadence. */
const HOST_POLL_MS = 5000

/** Toujours visible pendant une session, y compris si la fenêtre de gestion est fermée. */
export function CollabSessionBar() {
  const { t } = useTranslation()
  const { status, role, started, participants, locked, setDialogOpen } = useCollab(useShallow((s) => ({ status: s.status, role: s.role, started: s.started, participants: s.participants, locked: s.host?.locked === true, setDialogOpen: s.setDialogOpen })))
  const polling = role === 'host' && status === 'connected'
  useEffect(() => {
    if (!polling) return
    const id = window.setInterval(() => void refreshHost().catch(() => {}), HOST_POLL_MS)
    return () => window.clearInterval(id)
  }, [polling])
  if (status === 'off') return null
  return <div className="collab-session-bar" aria-label={t('collab.title')}>
    <span role="status">{status === 'connected' ? t(started ? 'collab.status.connected' : 'collab.lobby.label') : t(`collab.status.${status}`)}</span>
    <span className="dim">{t('collab.peopleCount', { count: participants.length })}</span>
    {started && <span className="dim small">{t('collab.undoHint')}</span>}
    {role === 'host' && locked && <span className="collab-error" role="alert">{t('collab.lockedOut')}</span>}
    <span className="spacer" />
    <button className="btn btn-ghost" onClick={() => setDialogOpen(true)}>{t('collab.manage')}</button>
    <button className="btn btn-danger" onClick={leave}>{t(role === 'host' ? 'collab.stop' : 'collab.leave')}</button>
  </div>
}
