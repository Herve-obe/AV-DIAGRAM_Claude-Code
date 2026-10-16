// Salle d'attente de l'hôte, droits par calque et découverte des hôtes sur le réseau local.
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { discoverSessions, type DiscoveredSession } from '../collab/discovery'
import {
  canHost, assignLayer, beginSession, DEFAULT_PORT, forgetResume, hostSession, joinSession, kick, leave, resumeSession, useCollab,
} from '../collab/session'
import { LAYERS } from '../model/layers'
import { Icon } from './Icon'

export function CollabDialog() {
  const { t, i18n } = useTranslation()
  const {
    dialogOpen, status, started, role, relayRank, host, participants, error, name, setName, setDialogOpen,
    backup, setBackup, claims, userId, resumable,
  } = useCollab()
  const [tab, setTab] = useState<'host' | 'join'>('host')
  const [port, setPort] = useState(String(DEFAULT_PORT))
  const [manualAddress, setManualAddress] = useState('')
  const [selectedHost, setSelectedHost] = useState('')
  const [sessions, setSessions] = useState<DiscoveredSession[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)
  const previousStarted = useRef(started)
  const active = status !== 'off'
  const guests = participants.filter(p => !p.self && p.peerId != null && p.userId)
  const selectedSession = sessions.find(s => s.id === selectedHost)
    ?? (!selectedHost && !manualAddress.trim() && sessions.length === 1 ? sessions[0] : undefined)
  const joinAddress = selectedSession?.address ?? manualAddress
  const close = () => setDialogOpen(false)

  useEffect(() => {
    if (!dialogOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDialogOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dialogOpen, setDialogOpen])

  useEffect(() => {
    if (!previousStarted.current && started && role === 'guest') setDialogOpen(false)
    previousStarted.current = started
  }, [started, role, setDialogOpen])

  useEffect(() => {
    if (!dialogOpen || active || tab !== 'join' || !canHost()) return
    let stopped = false
    const search = async () => {
      setSearching(true)
      setSearchError(false)
      try {
        const found = await discoverSessions()
        if (!stopped) setSessions(found)
      } catch {
        if (!stopped) { setSessions([]); setSearchError(true) }
      } finally { if (!stopped) setSearching(false) }
    }
    void search()
    const timer = setInterval(() => void search(), 8000)
    return () => { stopped = true; clearInterval(timer) }
  }, [dialogOpen, active, tab, refresh])

  if (!dialogOpen) return null
  const run = async (f: () => Promise<void>) => {
    setBusy(true)
    setStartError(null)
    useCollab.setState({ error: null })
    try { await f() }
    catch (e) { if (!useCollab.getState().error) setStartError(String(e)) }
    finally { setBusy(false) }
  }
  const portNumber = Number(port)
  const portValid = Number.isInteger(portNumber) && portNumber >= 1024 && portNumber <= 65535
  const nameOk = name.trim().length > 0
  const joinRequirement = !nameOk ? 'name' : !joinAddress.trim() ? 'host' : code.length !== 6 ? 'code' : null

  return <div className="overlay" onMouseDown={e => e.target === e.currentTarget && close()}>
    <div className="dialog collab-dialog" role="dialog" aria-modal="true" aria-labelledby="collab-title">
      <header className="dialog-head">
        <h2 id="collab-title">{t('collab.title')}</h2>
        <button className="icon-btn" onClick={close} aria-label={t('settings.close')}><Icon name="close" /></button>
      </header>
      <div className="dialog-body">
        {!active && <>
          {resumable && <section className="collab-resume">
            <h3 className="group-title">{t('collab.resume.title')}</h3>
            <p className="dialog-hint">{t(resumable.origin === 'host' ? 'collab.resume.hintHost' : 'collab.resume.hintGuest', {
              name: resumable.projectName || '?', date: new Date(resumable.savedAt).toLocaleString(i18n.language),
            })}</p>
            <div className="collab-row">
              <button className="btn btn-primary" disabled={busy} onClick={() => run(resumeSession)}>{t('collab.resume.action')}</button>
              <button className="btn btn-ghost" onClick={forgetResume}>{t('collab.resume.forget')}</button>
            </div>
          </section>}
          <div className="field">
            <label htmlFor="collab-name">{t('collab.name')}</label>
            <input id="collab-name" value={name} onChange={e => setName(e.target.value)} placeholder={t('collab.namePlaceholder')} maxLength={40} />
          </div>
          <div className="segmented collab-tabs" role="tablist" aria-label={t('collab.title')}>
            <button role="tab" aria-selected={tab === 'host'} disabled={!canHost() || busy} onClick={() => setTab('host')}>{t('collab.host')}</button>
            <button role="tab" aria-selected={tab === 'join'} disabled={!canHost() || busy} onClick={() => setTab('join')}>{t('collab.join')}</button>
          </div>
          {!canHost() && <p className="dialog-hint">{t('collab.hostDesktopOnly')}</p>}
          {tab === 'host' && canHost() && <section>
            <p className="dialog-hint">{t('collab.hostHint')}</p>
            <details className="collab-advanced">
              <summary>{t('collab.advanced')}</summary>
              <div className="field">
                <label htmlFor="collab-port">{t('collab.port')}</label>
                <input id="collab-port" className="mono" value={port} onChange={e => setPort(e.target.value)} inputMode="numeric" />
              </div>
            </details>
            <button className="btn btn-primary collab-action" disabled={busy || !portValid || !nameOk} onClick={() => run(() => hostSession(portNumber))}>{t('collab.start')}</button>
          </section>}
          {tab === 'join' && canHost() && <section>
            <p className="dialog-hint">{t('collab.joinHint')}</p>
            <div className="collab-row">
              <span role="status">{t(searching ? 'collab.discovery.searching' : searchError ? 'collab.discovery.error' : sessions.length ? 'collab.discovery.found' : 'collab.discovery.empty')}</span>
              <button className="btn btn-ghost" disabled={searching || busy} onClick={() => setRefresh(n => n + 1)}>{t('collab.discovery.refresh')}</button>
            </div>
            <ul className="collab-sessions" aria-label={t('collab.discovery.title')}>
              {sessions.map(s => <li key={s.id}>
                <label>
                  <input type="radio" name="collab-host" checked={selectedSession?.id === s.id} onChange={() => { setSelectedHost(s.id); setManualAddress('') }} />
                  <span><strong>{s.sessionName}</strong><span className="dim">{t('collab.discovery.host', { name: s.hostName })}</span></span>
                </label>
              </li>)}
            </ul>
            <div className="field">
              <label htmlFor="collab-code">{t('collab.code')}</label>
              <input id="collab-code" className="mono" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" placeholder="000000" />
            </div>
            <details className="collab-advanced">
              <summary>{t('collab.advanced')}</summary>
              <div className="field">
                <label htmlFor="collab-address">{t('collab.address')}</label>
                <input id="collab-address" className="mono" value={manualAddress} onChange={e => { setManualAddress(e.target.value); setSelectedHost('') }} placeholder={`192.168.1.20:${DEFAULT_PORT}`} />
              </div>
              <label className="collab-check"><input type="checkbox" checked={backup} onChange={e => setBackup(e.target.checked)} /><span>{t('collab.backup')}</span></label>
            </details>
            <p className="dialog-hint">{t('collab.joinWarning')}</p>
            {joinRequirement && <p id="collab-join-requirement" className="dialog-hint" role="status">{t(`collab.joinRequirements.${joinRequirement}`)}</p>}
            <button className="btn btn-primary collab-action" disabled={busy || joinRequirement !== null} aria-describedby={joinRequirement ? 'collab-join-requirement' : undefined} onClick={() => run(() => joinSession(joinAddress, code))}>
              {busy ? t('collab.status.connecting') : t('collab.joinAction')}
            </button>
          </section>}
        </>}

        {(error || startError) && <p className="collab-error" role="alert"><Icon name="alert" size={14} /> {error ? t(`collab.error.${error}`) : t('collab.error.start', { detail: startError })}</p>}

        {active && <>
          <p className={`collab-state collab-${status}`} role="status">{status === 'connected' ? t(started ? 'collab.status.connected' : role === 'host' && guests.length === 0 ? 'collab.lobby.waiting' : 'collab.lobby.label') : t(`collab.status.${status}`)}</p>
          {role === 'host' && host && <section>
            <div className="collab-code"><span>{t('collab.code')}</span><strong className="mono">{host.code}</strong></div>
            <p className="dialog-hint">{t('collab.lobby.invite')}</p>
            {host.discoveryAvailable === false && <p className="collab-error" role="alert">{t('collab.discovery.unavailable')}</p>}
            <details className="collab-advanced">
              <summary>{t('collab.advanced')}</summary>
              <ul className="collab-addresses">{host.addresses.map(a => <li key={a} className="mono">{a}</li>)}</ul>
              <p className="dialog-hint">{t('collab.firewall', { port: host.port })}</p>
            </details>
          </section>}
          {role === 'guest' && !started && <p className="dialog-hint">{t('collab.lobby.guestWaiting')}</p>}
          {relayRank !== null && relayRank > 0 && <p className="dialog-hint">{t('collab.relayHint')}</p>}

          {role === 'host' && <>
            <h3 className="group-title">{t('collab.participants')}</h3>
            <ul className="collab-people">{participants.map(p => <li key={p.clientId}>
              <span className="collab-dot" style={{ background: p.color }} />
              <span className="collab-person">{p.name}{p.self && ` (${t('collab.you')})`}</span>
              {p.self ? <span className="dim">{t('collab.lobby.hostRole')}</span> : p.peerId != null && <button className="btn btn-ghost" onClick={() => void kick(p.peerId!)}>{t('collab.kick')}</button>}
            </li>)}</ul>
            {guests.length === 0 && Object.keys(claims).length === 0 ? <p className="dialog-hint">{t('collab.lobby.assignAfterJoin')}</p> : <>
              <h3 className="group-title">{t('collab.layers.title')}</h3>
              <p className="dialog-hint">{t('collab.layers.hint')}</p>
              <ul className="collab-people">{LAYERS.map(layer => <li key={layer}>
                <span className="collab-person">{t(`library.domain.${layer}`)}</span>
                <select aria-label={t('collab.layers.assign', { layer: t(`library.domain.${layer}`) })} value={claims[layer]?.userId ?? ''} onChange={e => assignLayer(layer, guests.find(p => p.userId === e.target.value)?.peerId ?? null)}>
                  <option value="">{t('collab.layers.unassigned')}</option>
                  {claims[layer] && !guests.some(p => p.userId === claims[layer]?.userId) && <option value={claims[layer]!.userId} disabled>{t('collab.layers.offline', { name: claims[layer]!.name })}</option>}
                  {guests.map(p => <option key={p.peerId} value={p.userId}>{p.name}</option>)}
                </select>
              </li>)}</ul>
            </>}
          </>}
          {role === 'guest' && started && <>
            <h3 className="group-title">{t('collab.layers.title')}</h3>
            <p className="dialog-hint">{t('collab.layers.hint')}</p>
            <ul className="collab-people">{LAYERS.filter(layer => claims[layer]?.userId === userId).map(layer => <li key={layer}>{t(`library.domain.${layer}`)}</li>)}</ul>
          </>}
        </>}
      </div>
      {active && <footer className="dialog-foot">
        <button className="btn btn-danger" onClick={leave}>{t(role === 'host' ? 'collab.stop' : 'collab.leave')}</button>
        <span className="spacer" />
        {role === 'host' && !started ? <button className="btn btn-primary" disabled={status !== 'connected' || busy} onClick={() => { if (beginSession()) close() }}>{t('collab.lobby.begin')}</button> : <button className="btn btn-primary" onClick={close}>{t('collab.openDiagram')}</button>}
      </footer>}
    </div>
  </div>
}
