// Tchat de la session : messages échangés entre les postes connectés, sur le réseau local seulement.
// L'historique vit dans le document partagé de la session (il n'est pas enregistré dans le .avd).
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { sendChat, useCollab } from '../collab/session'
import { Icon } from './Icon'

export function ChatPanel() {
  const { t, i18n } = useTranslation()
  const open = useCollab((s) => s.chatOpen && s.status !== 'off')
  const chat = useCollab((s) => s.chat)
  const me = useCollab((s) => s.userId)
  const [text, setText] = useState('')
  const listRef = useRef<HTMLOListElement>(null)

  // Dernier message visible
  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [chat.length, open])

  if (!open) return null
  const time = new Intl.DateTimeFormat(i18n.language, { hour: '2-digit', minute: '2-digit' })
  const submit = () => {
    sendChat(text)
    setText('')
  }

  return (
    <aside className="chat-panel" aria-label={t('collab.chat.title')}>
      <header className="chat-head">
        <h2>{t('collab.chat.title')}</h2>
        <button className="icon-btn" onClick={() => useCollab.getState().setChatOpen(false)} aria-label={t('settings.close')}><Icon name="close" size={14} /></button>
      </header>
      <ol className="chat-list" ref={listRef}>
        {chat.length === 0 && <li className="chat-empty">{t('collab.chat.empty')}</li>}
        {chat.map((m) => (
          <li key={m.id} className={m.userId === me ? 'chat-msg is-mine' : 'chat-msg'}>
            <span className="chat-meta">
              <span className="collab-dot" style={{ background: m.color }} />
              <strong>{m.name}</strong>
              <time dateTime={new Date(m.at).toISOString()}>{time.format(m.at)}</time>
            </span>
            <span className="chat-text">{m.text}</span>
          </li>
        ))}
      </ol>
      <form className="chat-form" onSubmit={(e) => { e.preventDefault(); submit() }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            // Entrée : envoyer ; Maj+Entrée : nouvelle ligne
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              submit()
            }
          }}
          placeholder={t('collab.chat.placeholder')}
          rows={2}
          maxLength={2000}
          aria-label={t('collab.chat.placeholder')}
        />
        <button className="btn btn-primary" type="submit" disabled={!text.trim()}>{t('collab.chat.send')}</button>
      </form>
    </aside>
  )
}
