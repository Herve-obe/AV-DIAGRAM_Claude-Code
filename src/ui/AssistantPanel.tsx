// Panneau de l'assistant IA (lot 6) : conversation, activité des outils, proposition à appliquer ou refuser.
// Il remplace l'inspecteur tant qu'il est ouvert.
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { providerInfo } from '../ai/providers'
import { nativeAvailable } from '../ai/transport'
import { checkLink } from '../model/rules'
import { isReady, useAi } from '../store/aiStore'
import { Icon } from './Icon'

const SUGGESTIONS = ['ai.suggest.review', 'ai.suggest.concert', 'ai.suggest.di'] as const

function Proposal() {
  const { t } = useTranslation()
  const proposal = useAi((s) => s.proposal)
  const busy = useAi((s) => s.busy)
  if (!proposal) return null
  const p = proposal.project
  const issues = proposal.addedLinks.flatMap((id) => (p.links[id] ? checkLink(p, p.links[id]) : []))
  const errors = issues.filter((i) => i.severity === 'error').length
  return (
    <section className="ai-proposal" aria-label={t('ai.proposal')}>
      <h3 className="group-title">{t('ai.proposal')}</h3>
      <ul className="ai-proposal-list">
        {proposal.addedEquipment.map((id) => (
          <li key={id}><span className="tag">{t('ai.addEq')}</span> {p.equipment[id]?.name} <span className="dim">{p.equipment[id]?.model}</span></li>
        ))}
        {proposal.addedLinks.map((id) => {
          const l = p.links[id]
          if (!l) return null
          return (
            <li key={id}>
              <span className="tag">{t('ai.addLink')}</span> <span className="mono">{l.label}</span>{' '}
              {p.equipment[l.source.equipmentId]?.name} → {p.equipment[l.target.equipmentId]?.name}
            </li>
          )
        })}
      </ul>
      {issues.length > 0 && (
        <p className={`ai-proposal-issues ${errors ? 'is-error' : ''}`}>
          <Icon name="alert" size={13} /> {t('ai.proposalIssues', { count: issues.length })}
        </p>
      )}
      <div className="insp-actions">
        <button className="btn btn-ghost" onClick={() => useAi.getState().discardProposal()} disabled={busy}>{t('ai.discard')}</button>
        <button className="btn btn-primary" onClick={() => useAi.getState().applyProposal()} disabled={busy}><Icon name="check" size={14} />{t('ai.apply')}</button>
      </div>
      <p className="field-hint">{t('ai.applyHint')}</p>
    </section>
  )
}

export function AssistantPanel() {
  const { t } = useTranslation()
  const { settings, bubbles, busy, activeTool } = useAi()
  const [text, setText] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const ready = isReady(settings)
  const native = nativeAvailable()

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [bubbles.length, busy])

  const send = (q: string) => {
    if (!q.trim() || busy) return
    setText('')
    void useAi.getState().send(q)
  }

  return (
    <aside className="panel inspector ai-panel" aria-label={t('ai.title')}>
      <div className="panel-title">
        <span>{t('ai.title')}</span>
        <span className="ai-head-actions">
          {bubbles.length > 0 && (
            <button className="icon-btn small" onClick={() => useAi.getState().clear()} title={t('ai.clear')} aria-label={t('ai.clear')}><Icon name="trash" size={14} /></button>
          )}
          <button className="icon-btn small" onClick={() => useAi.getState().setSetupOpen(true)} title={t('ai.setup.title')} aria-label={t('ai.setup.title')}><Icon name="settings" size={14} /></button>
          <button className="icon-btn small" onClick={() => useAi.getState().setPanelOpen(false)} title={t('settings.close')} aria-label={t('settings.close')}><Icon name="close" size={14} /></button>
        </span>
      </div>

      <div className="ai-thread" ref={listRef}>
        {!native && <p className="ai-note">{t('ai.desktopOnly')}</p>}
        {!ready && (
          <div className="ai-intro">
            <p>{t('ai.intro')}</p>
            <button className="btn btn-primary" onClick={() => useAi.getState().setSetupOpen(true)}>{t('ai.configure')}</button>
          </div>
        )}
        {ready && bubbles.length === 0 && (
          <div className="ai-intro">
            <p>{t('ai.hello')}</p>
            <div className="ai-suggestions">
              {SUGGESTIONS.map((k) => <button key={k} className="chip" onClick={() => send(t(k))}>{t(k)}</button>)}
            </div>
          </div>
        )}
        {bubbles.map((b, i) => <div key={i} className={`ai-bubble is-${b.kind}`}>{b.text}</div>)}
        {busy && <div className="ai-bubble is-busy" aria-live="polite">{activeTool ? t(`ai.tool.${activeTool}`, { defaultValue: activeTool }) : t('ai.thinking')}</div>}
        <Proposal />
      </div>

      <form className="ai-input" onSubmit={(e) => { e.preventDefault(); send(text) }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(text) }
          }}
          placeholder={ready ? t('ai.placeholder') : t('ai.notReady')}
          disabled={!ready}
          rows={3}
          aria-label={t('ai.placeholder')}
        />
        <div className="ai-input-foot">
          <span className="dim">{ready && settings.provider ? `${providerInfo(settings.provider).label} · ${settings.model}` : ''}</span>
          <button className="btn btn-primary" type="submit" disabled={!ready || busy || !text.trim()}>{t('ai.send')}</button>
        </div>
        {ready && settings.provider && providerInfo(settings.provider).kind === 'account' && <p className="field-hint">{t('ai.sentTo', { provider: providerInfo(settings.provider).label })}</p>}
      </form>
    </aside>
  )
}
