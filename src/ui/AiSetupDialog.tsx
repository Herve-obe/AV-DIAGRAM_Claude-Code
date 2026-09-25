// Configuration guidée de l'assistant IA (cahier des charges, 12.2).
// Option A, IA locale : serveur local, modèle, test. Option B, mon compte IA : fournisseur, création
// de la clé, clé rangée dans le trousseau, test de connexion, modèle et accord sur l'envoi des données.
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AiError, listModels, testChat } from '../ai/agent'
import { checkKeyShape, pickRecommended, PROVIDERS, providerInfo, type ProviderId } from '../ai/providers'
import { keyStore, nativeAvailable, nativeTransport, openExternal } from '../ai/transport'
import { useAi } from '../store/aiStore'
import { Icon } from './Icon'

type Path = 'choose' | 'local' | 'account'
type Status = { state: 'idle' | 'running' | 'ok' | 'error'; text?: string }

const STEPS: Record<Exclude<Path, 'choose'>, string[]> = {
  local: ['server', 'model', 'test'],
  account: ['provider', 'create', 'key', 'connect', 'model'],
}

function errorText(t: (k: string) => string, e: unknown): string {
  const kind = e instanceof AiError ? e.kind : 'network'
  const detail = e instanceof Error ? e.message : String(e)
  return `${t(`ai.error.${kind}`)}${detail ? ` (${detail})` : ''}`
}

function StatusLine({ status }: { status: Status }) {
  if (status.state === 'idle') return null
  return (
    <p className={`ai-status is-${status.state}`} role="status">
      {status.state === 'ok' && <Icon name="check" size={13} />}
      {status.state === 'error' && <Icon name="alert" size={13} />}
      {status.text}
    </p>
  )
}

export function AiSetupDialog() {
  const { t } = useTranslation()
  const open = useAi((s) => s.setupOpen)
  const settings = useAi((s) => s.settings)
  const [path, setPath] = useState<Path>('choose')
  const [step, setStep] = useState(0)
  const [provider, setProvider] = useState<ProviderId>('ollama')
  const [baseUrl, setBaseUrl] = useState('')
  const [models, setModels] = useState<string[]>([])
  const [model, setModel] = useState('')
  const [key, setKey] = useState('')
  const [keyPresent, setKeyPresent] = useState(false)
  const [consent, setConsent] = useState(false)
  const [status, setStatus] = useState<Status>({ state: 'idle' })
  const native = nativeAvailable()
  const info = providerInfo(provider)
  const close = () => useAi.getState().setSetupOpen(false)

  // À l'ouverture : on repart des réglages enregistrés
  useEffect(() => {
    if (!open) return
    const p = settings.provider ?? 'ollama'
    setPath(settings.enabled && settings.provider ? providerInfo(p).kind : 'choose')
    setStep(0)
    setProvider(p)
    setBaseUrl(settings.baseUrl ?? providerInfo(p).defaultBaseUrl ?? '')
    setModel(settings.model ?? '')
    setModels(settings.model ? [settings.model] : [])
    setConsent(settings.consent)
    setKey('')
    setStatus({ state: 'idle' })
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, settings])

  useEffect(() => {
    if (!open || !native || path !== 'account') return
    keyStore.present(provider).then(setKeyPresent, () => setKeyPresent(false))
  }, [open, native, path, provider])

  if (!open) return null

  const usesUrl = info.kind === 'local' || provider === 'compatible'
  const url = usesUrl ? baseUrl.trim() : undefined
  const steps = path === 'choose' ? [] : STEPS[path]
  const stepId = steps[step]

  const pickProvider = (id: ProviderId) => {
    setProvider(id)
    setBaseUrl(providerInfo(id).defaultBaseUrl ?? '')
    setModels([])
    setModel('')
    setStatus({ state: 'idle' })
  }
  const choosePath = (p: Path) => {
    setPath(p)
    setStep(0)
    if (p !== 'choose' && providerInfo(provider).kind !== p) pickProvider(p === 'local' ? 'ollama' : 'anthropic')
  }

  const fetchModels = async () => {
    setStatus({ state: 'running', text: t('ai.setup.testing') })
    try {
      const list = await listModels(nativeTransport, provider, url)
      setModels(list)
      setModel((m) => (m && list.includes(m) ? m : pickRecommended(provider, list) ?? ''))
      setStatus(list.length ? { state: 'ok', text: t('ai.setup.connected', { count: list.length }) } : { state: 'error', text: t('ai.setup.noModel') })
      return list.length > 0
    } catch (e) {
      setStatus({ state: 'error', text: errorText(t, e) })
      return false
    }
  }

  const runTest = async () => {
    setStatus({ state: 'running', text: t('ai.setup.testing') })
    try {
      const answer = await testChat(nativeTransport, { provider, baseUrl: url, model }, t('ai.setup.testQuestion'))
      setStatus({ state: 'ok', text: answer || t('ai.emptyReply') })
    } catch (e) {
      setStatus({ state: 'error', text: errorText(t, e) })
    }
  }

  const saveKey = async () => {
    try {
      await keyStore.set(provider, key)
      setKey('')
      setKeyPresent(true)
      setStatus({ state: 'ok', text: t('ai.setup.keySaved') })
    } catch (e) {
      setStatus({ state: 'error', text: String(e) })
    }
  }
  const removeKey = async () => {
    try {
      await keyStore.remove(provider)
      setKeyPresent(false)
      setStatus({ state: 'ok', text: t('ai.setup.keyRemoved') })
    } catch (e) {
      setStatus({ state: 'error', text: String(e) })
    }
  }

  const finish = () => {
    useAi.getState().saveSettings({ enabled: true, provider, baseUrl: usesUrl ? url : undefined, model, consent: info.kind === 'local' ? false : consent })
    close()
  }
  const disable = () => {
    useAi.getState().saveSettings({ ...settings, enabled: false })
    close()
  }

  const canNext = (() => {
    switch (stepId) {
      case 'server': return models.length > 0
      case 'provider': return provider !== 'compatible' || /^https:\/\/.+/.test(baseUrl.trim()) || /^http:\/\/(localhost|127\.0\.0\.1)/.test(baseUrl.trim())
      case 'create': return true
      case 'key': return keyPresent || (provider === 'compatible')
      case 'connect': return models.length > 0
      case 'model': return !!model && (path === 'local' || consent)
      default: return false
    }
  })()
  const last = step === steps.length - 1
  const shape = key ? checkKeyShape(provider, key) : 'ok'

  const providerList = (kind: 'local' | 'account') => (
    <div className="ai-choices" role="radiogroup">
      {PROVIDERS.filter((p) => p.kind === kind).map((p) => (
        <label key={p.id} className={`ai-choice ${provider === p.id ? 'is-on' : ''}`}>
          <input type="radio" name="ai-provider" checked={provider === p.id} onChange={() => pickProvider(p.id)} />
          <span>{p.id === 'compatible' ? t('ai.setup.compatible') : p.label}</span>
        </label>
      ))}
    </div>
  )
  const urlField = (
    <div className="field">
      <label htmlFor="ai-url">{t('ai.setup.url')}</label>
      <input id="ai-url" className="mono" value={baseUrl} onChange={(e) => { setBaseUrl(e.target.value); setModels([]) }} spellCheck={false} />
    </div>
  )
  const modelSelect = (
    <div className="field">
      <label htmlFor="ai-model">{t('ai.setup.model')}</label>
      <select id="ai-model" value={model} onChange={(e) => setModel(e.target.value)}>
        {models.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>
    </div>
  )

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="dialog ai-setup" role="dialog" aria-modal="true" aria-labelledby="ai-setup-title">
        <header className="dialog-head">
          <h2 id="ai-setup-title">{t('ai.setup.title')}</h2>
          <button className="icon-btn" onClick={close} aria-label={t('settings.close')}><Icon name="close" /></button>
        </header>
        <div className="dialog-body">
          {!native && <p className="ai-note">{t('ai.desktopOnly')}</p>}

          {path === 'choose' ? (
            <section>
              <p className="dialog-hint">{t('ai.setup.chooseHint')}</p>
              <div className="ai-options">
                <button className="ai-option" onClick={() => choosePath('local')}>
                  <strong>{t('ai.setup.local')}</strong>
                  <span>{t('ai.setup.localDesc')}</span>
                </button>
                <button className="ai-option" onClick={() => choosePath('account')}>
                  <strong>{t('ai.setup.account')}</strong>
                  <span>{t('ai.setup.accountDesc')}</span>
                </button>
              </div>
              {settings.enabled && <div className="dialog-actions"><button className="btn btn-ghost" onClick={disable}>{t('ai.setup.disable')}</button></div>}
            </section>
          ) : (
            <section>
              <ol className="ai-steps" aria-label={t('ai.setup.progress')}>
                {steps.map((s, i) => <li key={s} className={i === step ? 'is-on' : i < step ? 'is-done' : ''}>{i + 1}. {t(`ai.setup.step.${s}`)}</li>)}
              </ol>

              {stepId === 'server' && (
                <>
                  <p className="dialog-hint">{t('ai.setup.serverHint')}</p>
                  {providerList('local')}
                  {urlField}
                  <div className="dialog-actions"><button className="btn" onClick={fetchModels} disabled={!native || status.state === 'running'}>{t('ai.setup.detect')}</button></div>
                  <p className="field-hint">{t('ai.setup.downloadLater')}</p>
                </>
              )}

              {stepId === 'provider' && (
                <>
                  <p className="dialog-hint">{t('ai.setup.providerHint')}</p>
                  {providerList('account')}
                  {provider === 'compatible' && urlField}
                </>
              )}

              {stepId === 'create' && (
                <>
                  <p className="dialog-hint"><strong>{t('ai.setup.subscriptionWarn')}</strong></p>
                  <p className="dialog-hint">{t('ai.setup.createHint', { provider: info.label })}</p>
                  {provider === 'gemini' && <p className="dialog-hint">{t('ai.setup.geminiNote')}</p>}
                  {info.keyUrl && (
                    <div className="dialog-actions">
                      <span className="mono dim ai-url">{info.keyUrl}</span>
                      <button className="btn" onClick={() => void openExternal(info.keyUrl!)}>{t('ai.setup.openConsole')}</button>
                    </div>
                  )}
                </>
              )}

              {stepId === 'key' && (
                <>
                  <p className="dialog-hint">{t('ai.setup.keyHint')}</p>
                  {keyPresent && (
                    <p className="ai-status is-ok"><Icon name="check" size={13} />{t('ai.setup.keyPresent')} <button className="btn btn-ghost" onClick={removeKey}>{t('ai.setup.removeKey')}</button></p>
                  )}
                  <div className="field">
                    <label htmlFor="ai-key">{keyPresent ? t('ai.setup.replaceKey') : t('ai.setup.key')}</label>
                    <input id="ai-key" type="password" autoComplete="off" spellCheck={false} value={key} onChange={(e) => setKey(e.target.value)} />
                  </div>
                  {shape !== 'ok' && <p className="field-hint">{t(`ai.setup.shape.${shape}`, { prefix: info.keyPrefix })}</p>}
                  <div className="dialog-actions">
                    <button className="btn" onClick={saveKey} disabled={!native || !key.trim() || shape === 'empty' || shape === 'spaces'}>{t('ai.setup.saveKey')}</button>
                  </div>
                  {provider === 'compatible' && <p className="field-hint">{t('ai.setup.keyOptional')}</p>}
                </>
              )}

              {stepId === 'connect' && (
                <>
                  <p className="dialog-hint">{t('ai.setup.connectHint')}</p>
                  <div className="dialog-actions"><button className="btn" onClick={fetchModels} disabled={!native || status.state === 'running'}>{t('ai.setup.testConnection')}</button></div>
                </>
              )}

              {stepId === 'model' && (
                <>
                  {modelSelect}
                  {path === 'account' ? (
                    <>
                      <p className="dialog-hint">{t('ai.setup.costHint')}</p>
                      <p className="dialog-hint">{t('ai.setup.dataHint', { provider: info.label })}</p>
                      <label className="ai-consent">
                        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                        {t('ai.setup.consent', { provider: info.label })}
                      </label>
                    </>
                  ) : <p className="dialog-hint">{t('ai.setup.localModelHint')}</p>}
                </>
              )}

              {stepId === 'test' && (
                <>
                  <p className="dialog-hint">{t('ai.setup.testHint')}</p>
                  <p className="dialog-hint mono">{t('ai.setup.testQuestion')}</p>
                  <div className="dialog-actions"><button className="btn" onClick={runTest} disabled={!native || !model || status.state === 'running'}>{t('ai.setup.runTest')}</button></div>
                </>
              )}

              <StatusLine status={status} />

              <div className="dialog-actions">
                <button className="btn btn-ghost" onClick={() => { setStatus({ state: 'idle' }); if (step === 0) setPath('choose'); else setStep(step - 1) }}>{t('ai.setup.back')}</button>
                {stepId === 'test' || (last && path === 'account') ? (
                  <button className="btn btn-primary" onClick={finish} disabled={!model || (path === 'account' && !consent)}><Icon name="check" size={14} />{t('ai.setup.finish')}</button>
                ) : (
                  <button className="btn btn-primary" onClick={() => { setStatus({ state: 'idle' }); setStep(step + 1) }} disabled={!canNext}>{t('ai.setup.next')}</button>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
