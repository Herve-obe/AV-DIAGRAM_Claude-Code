// Session de collaboration sur le réseau local : héberger (application de bureau) ou rejoindre.
// Aucune donnée ne quitte le réseau : le relais tourne sur le poste hôte (voir docs/collaboration.md).
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  canHost, canRelease, claimLayer, DEFAULT_PORT, forgetResume, hostSession, joinSession, kick, leave, releaseLayer, resumeSession, useCollab,
} from '../collab/session'
import { LAYERS } from '../model/layers'
import { Icon } from './Icon'

export function CollabDialog() {
  const { t, i18n } = useTranslation()
  const {
    dialogOpen, status, role, origin, relayRank, host, address, participants, error, name, setName, setDialogOpen,
    backup, setBackup, claims, userId, resumable,
  } = useCollab()
  const [tab, setTab] = useState<'host' | 'join'>(canHost() ? 'host' : 'join')
  const [port, setPort] = useState(String(DEFAULT_PORT))
  const [joinAddress, setJoinAddress] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)
  const close = () => setDialogOpen(false)

  useEffect(() => {
    if (!dialogOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDialogOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dialogOpen, setDialogOpen])

  if (!dialogOpen) return null
  const active = status !== 'off'

  const run = async (f: () => Promise<void>) => {
    setBusy(true)
    setStartError(null)
    useCollab.setState({ error: null })
    try {
      await f()
    } catch (e) {
      // Erreur de démarrage du relais (port occupé...) ; les refus et délais sont dans error
      if (!useCollab.getState().error) setStartError(String(e))
    } finally {
      setBusy(false)
    }
  }
  const portNumber = Number(port)
  const portValid = Number.isInteger(portNumber) && portNumber >= 1024 && portNumber <= 65535
  const nameOk = name.trim().length > 0

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="dialog collab-dialog" role="dialog" aria-modal="true" aria-labelledby="collab-title">
        <header className="dialog-head">
          <h2 id="collab-title">{t('collab.title')}</h2>
          <button className="icon-btn" onClick={close} aria-label={t('settings.close')}><Icon name="close" /></button>
        </header>
        <div className="dialog-body">
          <p className="dialog-hint">{t('collab.hint')}</p>

          {!active && resumable && (
            <section className="collab-resume">
              <h3 className="group-title">{t('collab.resume.title')}</h3>
              <p className="dialog-hint">
                {t(resumable.origin === 'host' ? 'collab.resume.hintHost' : 'collab.resume.hintGuest', {
                  name: resumable.projectName || '?',
                  date: new Date(resumable.savedAt).toLocaleString(i18n.language),
                })}
              </p>
              <div className="collab-row">
                <button className="btn btn-primary" disabled={busy} onClick={() => run(resumeSession)}>{t('collab.resume.action')}</button>
                <button className="btn btn-ghost" onClick={forgetResume}>{t('collab.resume.forget')}</button>
              </div>
            </section>
          )}

          {!active && (
            <>
              <div className="field">
                <label htmlFor="collab-name">{t('collab.name')}</label>
                <input id="collab-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('collab.namePlaceholder')} maxLength={40} />
              </div>
              <div className="segmented collab-tabs" role="tablist">
                <button role="tab" aria-pressed={tab === 'host'} disabled={!canHost()} onClick={() => setTab('host')}>{t('collab.host')}</button>
                <button role="tab" aria-pressed={tab === 'join'} onClick={() => setTab('join')}>{t('collab.join')}</button>
              </div>
              {!canHost() && <p className="dialog-hint">{t('collab.hostDesktopOnly')}</p>}

              {tab === 'host' && canHost() && (
                <section>
                  <p className="dialog-hint">{t('collab.hostHint')}</p>
                  <div className="field">
                    <label htmlFor="collab-port">{t('collab.port')}</label>
                    <input id="collab-port" className="mono" value={port} onChange={(e) => setPort(e.target.value)} inputMode="numeric" />
                  </div>
                  <button className="btn btn-primary collab-action" disabled={busy || !portValid || !nameOk} onClick={() => run(() => hostSession(portNumber))}>
                    {t('collab.start')}
                  </button>
                </section>
              )}

              {tab === 'join' && (
                <section>
                  <p className="dialog-hint">{t('collab.joinHint')}</p>
                  <div className="field">
                    <label htmlFor="collab-address">{t('collab.address')}</label>
                    <input id="collab-address" className="mono" value={joinAddress} onChange={(e) => setJoinAddress(e.target.value)} placeholder={`192.168.1.20:${DEFAULT_PORT}`} />
                  </div>
                  <div className="field">
                    <label htmlFor="collab-code">{t('collab.code')}</label>
                    <input id="collab-code" className="mono" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" placeholder="000000" />
                  </div>
                  <p className="dialog-hint">{t('collab.joinWarning')}</p>
                  {canHost() && (
                    <label className="collab-check">
                      <input type="checkbox" checked={backup} onChange={(e) => setBackup(e.target.checked)} />
                      <span>{t('collab.backup')}</span>
                    </label>
                  )}
                  <button
                    className="btn btn-primary collab-action"
                    disabled={busy || !nameOk || !joinAddress.trim() || code.length !== 6}
                    onClick={() => run(() => joinSession(joinAddress, code))}
                  >
                    {busy ? t('collab.status.connecting') : t('collab.joinAction')}
                  </button>
                </section>
              )}
            </>
          )}

          {(error || startError) && (
            <p className="collab-error" role="alert">
              <Icon name="alert" size={14} /> {error ? t(`collab.error.${error}`) : t('collab.error.start', { detail: startError })}
            </p>
          )}

          {active && (
            <>
              <p className={`collab-state collab-${status}`}>{t(`collab.status.${status}`)}</p>
              {role === 'host' && host && (
                <section className="collab-host">
                  <div className="collab-code">
                    <span>{t('collab.code')}</span>
                    <strong className="mono">{host.code}</strong>
                  </div>
                  <h3 className="group-title">{t('collab.addresses')}</h3>
                  <ul className="collab-addresses">
                    {host.addresses.length === 0 && <li className="mono">{`127.0.0.1:${host.port}`}</li>}
                    {host.addresses.map((a) => <li key={a} className="mono">{a}</li>)}
                  </ul>
                  <p className="dialog-hint">{t('collab.firewall', { port: host.port })}</p>
                </section>
              )}
              {role === 'guest' && <p className="dialog-hint">{t('collab.joined', { address })}</p>}
              {relayRank !== null && relayRank > 0 && <p className="dialog-hint">{t('collab.relayHint')}</p>}

              <h3 className="group-title">{t('collab.participants')}</h3>
              <ul className="collab-people">
                {participants.map((p) => {
                  const relay = role === 'host' && p.peerId != null ? host?.peers.find((x) => x.id === p.peerId) : undefined
                  return (
                    <li key={p.clientId}>
                      <span className="collab-dot" style={{ background: p.color }} />
                      <span className="collab-person">{p.name}{p.self && ` (${t('collab.you')})`}</span>
                      {p.layer && <span className="collab-layer">{t(`library.domain.${p.layer}`, { defaultValue: t('layers.all') })}</span>}
                      {relay && <span className="mono collab-ip">{relay.address}</span>}
                      {role === 'host' && !p.self && p.peerId != null && (
                        <button className="btn btn-ghost" onClick={() => kick(p.peerId!)}>{t('collab.kick')}</button>
                      )}
                    </li>
                  )
                })}
              </ul>
              <h3 className="group-title">{t('collab.layers.title')}</h3>
              <p className="dialog-hint">{t('collab.layers.hint')}</p>
              <ul className="collab-people">
                {LAYERS.map((layer) => {
                  const c = claims[layer]
                  const mine = c?.userId === userId
                  return (
                    <li key={layer}>
                      <span className="collab-person">{t(`library.domain.${layer}`)}</span>
                      {c ? (
                        <span className="collab-claim">
                          <span className="collab-dot" style={{ background: c.color }} />
                          {mine ? t('collab.layers.mine') : t('collab.layers.by', { name: c.name })}
                        </span>
                      ) : <span className="collab-layer">{t('collab.layers.free')}</span>}
                      {!c && <button className="btn btn-ghost" onClick={() => claimLayer(layer)}><Icon name="lock" size={13} />{t('collab.layers.claim')}</button>}
                      {c && canRelease(layer) && <button className="btn btn-ghost" onClick={() => releaseLayer(layer)}>{t('collab.layers.release')}</button>}
                    </li>
                  )
                })}
              </ul>
              <p className="dialog-hint">{t('collab.undoHint')}</p>
              <button className="btn btn-danger collab-action" onClick={leave}>{origin === 'host' ? t('collab.stop') : t('collab.leave')}</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
