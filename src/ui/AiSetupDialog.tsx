// Configuration guidée de l'assistant IA (cahier des charges, 12.2).
// Option A, IA locale : serveur local, modèle, test. Option B, mon compte IA : fournisseur, création
// de la clé, clé rangée dans le trousseau, test de connexion, modèle et accord sur l'envoi des données.
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AiError, listModels } from '../ai/agent'
import { testAssistant } from '../ai/setup'
import { checkKeyShape, pickRecommended, PROVIDERS, providerInfo, type ProviderId } from '../ai/providers'
import { startServer, stopServer } from '../ai/local'
import { keyStore, nativeAvailable, nativeTransport, openExternal } from '../ai/transport'
import { useAi } from '../store/aiStore'
import { Icon } from './Icon'
import { LocalAiSetup } from './LocalAiSetup'

type Path = 'choose' | 'local' | 'account' | 'builtin'
type Status = { state: 'idle' | 'running' | 'ok' | 'error'; text?: string }

const STEPS: Record<'local' | 'account', string[]> = {
  local: ['server', 'model', 'test'],
  account: ['provider', 'create', 'key', 'connect', 'model', 'test'],
}

function errorText(t: (k: string) => string, e: unknown): string {
  if (e === 'tools') return t('ai.local.error.tools')
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
  const { t, i18n } = useTranslation()
  const open = useAi((s) => s.setupOpen)
  const settings = useAi((s) => s.settings)
  const installerDirectory = useAi((s) => s.installerDirectory)
  const [tested, setTested] = useState(false)
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
  // llama-server lancé par AV Diagram
  const [managedOn, setManagedOn] = useState(false)
  const [serverPath, setServerPath] = useState('')
  const [modelPath, setModelPath] = useState('')
  const native = nativeAvailable()
  const info = providerInfo(provider)
  const close = () => { if (status.state !== 'running') useAi.getState().setSetupOpen(false) }

  // À l'ouverture : on repart des réglages enregistrés
  useEffect(() => {
    if (!open) return
    const settings = useAi.getState().settings
    const p = settings.provider ?? 'ollama'
    setPath(installerDirectory ? 'builtin' : settings.enabled && settings.provider ? p === 'builtin' ? 'builtin' : providerInfo(p).kind : 'choose')
    setStep(0)
    setProvider(p)
    setBaseUrl(settings.baseUrl ?? providerInfo(p).defaultBaseUrl ?? '')
    setModel(settings.model ?? '')
    setModels(settings.model ? [settings.model] : [])
    setConsent(settings.consent)
    setKey('')
    setStatus({ state: 'idle' })
    setTested(false)
    setManagedOn(!!settings.managed)
    setServerPath(settings.managed && 'serverPath' in settings.managed ? settings.managed.serverPath : '')
    setModelPath(settings.managed && 'modelPath' in settings.managed ? settings.managed.modelPath : '')
  }, [open, installerDirectory])

  useEffect(() => {
    if (!open || path === 'builtin') return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && status.state !== 'running') useAi.getState().setSetupOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, path, status.state])

  useEffect(() => {
    if (!open || !native || path !== 'account') return
    let disposed = false
    setKeyPresent(false)
    keyStore.present(provider, provider === 'compatible' ? baseUrl.trim() : undefined).then((present) => { if (!disposed) setKeyPresent(present) }, () => { if (!disposed) setKeyPresent(false) })
    return () => { disposed = true }
  }, [open, native, path, provider, baseUrl])

  if (!open) return null
  if (path === 'builtin') return <LocalAiSetup back={() => setPath('choose')} advanced={() => { setPath('local'); setStep(0); setProvider('ollama'); setBaseUrl(providerInfo('ollama').defaultBaseUrl ?? ''); setModels([]) }} />

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
    setConsent(false)
    setKey('')
    setKeyPresent(false)
    setTested(false)
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

  const pickFile = async (kind: 'server' | 'model') => {
    const { open: openDialog } = await import('@tauri-apps/plugin-dialog')
    const path = await openDialog({
      multiple: false,
      directory: false,
      filters: kind === 'model' ? [{ name: 'GGUF', extensions: ['gguf'] }] : undefined,
    })
    if (typeof path !== 'string') return
    if (kind === 'server') setServerPath(path)
    else setModelPath(path)
    setModels([])
  }

  const launch = async () => {
    setStatus({ state: 'running', text: t('ai.setup.launching') })
    try {
      const list = await startServer({ serverPath, modelPath }, url)
      setModels(list)
      setModel(list[0] ?? '')
      setStatus({ state: 'ok', text: t('ai.setup.connected', { count: list.length }) })
    } catch (e) {
      setStatus({ state: 'error', text: errorText(t, e) })
    }
  }

  const runTest = async () => {
    setStatus({ state: 'running', text: t('ai.setup.testing') })
    try {
      setTested(false)
      await testAssistant({ provider, baseUrl: url, model }, i18n.language)
      setTested(true)
      setStatus({ state: 'ok', text: t('ai.local.tested') })
    } catch (e) {
      setStatus({ state: 'error', text: errorText(t, e) })
    }
  }

  const saveKey = async () => {
    setStatus({ state: 'running', text: t('ai.setup.testing') })
    try {
      await keyStore.set(provider, key, provider === 'compatible' ? url : undefined)
      setKey('')
      setKeyPresent(true)
      setStatus({ state: 'ok', text: t('ai.setup.keySaved') })
    } catch (e) {
      setStatus({ state: 'error', text: String(e) })
    }
  }
  const removeKey = async () => {
    setStatus({ state: 'running', text: t('ai.setup.testing') })
    try {
      await keyStore.remove(provider, provider === 'compatible' ? url : undefined)
      setKeyPresent(false)
      setStatus({ state: 'ok', text: t('ai.setup.keyRemoved') })
    } catch (e) {
      setStatus({ state: 'error', text: String(e) })
    }
  }

  const finish = () => {
    if (!tested || (path === 'account' && !consent)) return
    const managed = provider === 'llamacpp' && managedOn && serverPath && modelPath ? { serverPath, modelPath } : undefined
    useAi.getState().saveSettings({ enabled: true, provider, baseUrl: usesUrl ? url : undefined, model, consent: info.kind === 'local' ? false : consent, managed })
    // Serveur local lancé pendant la configuration mais plus utilisé
    if (!managed && native) void stopServer().catch(() => undefined)
    close()
    useAi.getState().setPanelOpen(true)
  }
  const disable = () => {
    useAi.getState().saveSettings({ ...settings, enabled: false })
    if (native) void stopServer().catch(() => undefined)
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
      case 'test': return tested && status.state === 'ok'
      default: return false
    }
  })()
  const last = step === steps.length - 1
  const shape = key ? checkKeyShape(provider, key) : 'ok'

  const providerList = (kind: 'local' | 'account') => (
    <div className="ai-choices" role="radiogroup">
      {PROVIDERS.filter((p) => p.kind === kind && p.id !== 'builtin').map((p) => (
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
      <input id="ai-url" className="mono" value={baseUrl} onChange={(e) => { setBaseUrl(e.target.value); setModels([]); setTested(false) }} spellCheck={false} />
    </div>
  )
  const modelSelect = (
    <div className="field">
      <label htmlFor="ai-model">{t('ai.setup.model')}</label>
      <select id="ai-model" value={model} onChange={(e) => { setModel(e.target.value); setTested(false) }}>
        {models.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>
    </div>
  )

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="dialog ai-setup" role="dialog" aria-modal="true" aria-labelledby="ai-setup-title">
        <header className="dialog-head">
          <h2 id="ai-setup-title">{t('ai.setup.title')}</h2>
          <button className="icon-btn" disabled={status.state === 'running'} onClick={close} aria-label={t('settings.close')}><Icon name="close" /></button>
        </header>
        <div className="dialog-body">
          {!native && <p className="ai-note">{t('ai.desktopOnly')}</p>}

          {path === 'choose' ? (
            <section>
              <p className="dialog-hint">{t('ai.setup.chooseHint')}</p>
              <div className="ai-options">
                <button className="ai-option" onClick={() => setPath('builtin')}>
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
                  {provider === 'llamacpp' && (
                    <>
                      <label className="ai-consent">
                        <input type="checkbox" checked={managedOn} onChange={(e) => { setManagedOn(e.target.checked); setModels([]) }} />
                        {t('ai.setup.managed')}
                      </label>
                      {managedOn && (
                        <>
                          <p className="dialog-hint">{t('ai.setup.managedHint')}</p>
                          {(['server', 'model'] as const).map((kind) => (
                            <div className="field" key={kind}>
                              <label>{t(`ai.setup.${kind}File`)}</label>
                              <div className="ai-file">
                                <span className="mono dim" title={kind === 'server' ? serverPath : modelPath}>{(kind === 'server' ? serverPath : modelPath) || t('ai.setup.noFile')}</span>
                                <button className="btn" onClick={() => void pickFile(kind)} disabled={!native}>{t('ai.setup.choose')}</button>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </>
                  )}
                  <div className="dialog-actions">
                    {provider === 'llamacpp' && managedOn ? (
                      <button className="btn" onClick={launch} disabled={!native || !serverPath || !modelPath || status.state === 'running'}>{t('ai.setup.launch')}</button>
                    ) : (
                      <button className="btn" onClick={fetchModels} disabled={!native || status.state === 'running'}>{t('ai.setup.detect')}</button>
                    )}
                  </div>
                  <p className="field-hint">{t('ai.local.advancedHint')}</p>
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
                  <p className="dialog-hint">{t('ai.setup.toolTestHint')}</p>
                  <div className="dialog-actions"><button className="btn" onClick={runTest} disabled={!native || !model || status.state === 'running'}>{t('ai.setup.runTest')}</button></div>
                </>
              )}

              <StatusLine status={status} />

              <div className="dialog-actions">
                <button className="btn btn-ghost" disabled={status.state === 'running'} onClick={() => { setStatus({ state: 'idle' }); setTested(false); if (step === 0) setPath('choose'); else setStep(step - 1) }}>{t('ai.setup.back')}</button>
                {stepId === 'test' || (last && path === 'account') ? (
                  <button className="btn btn-primary" onClick={finish} disabled={!canNext}><Icon name="check" size={14} />{t('ai.setup.finish')}</button>
                ) : (
                  <button className="btn btn-primary" onClick={() => { setStatus({ state: 'idle' }); setTested(false); setStep(step + 1) }} disabled={!canNext || status.state === 'running'}>{t('ai.setup.next')}</button>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
