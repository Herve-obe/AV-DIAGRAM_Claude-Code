// Installation locale : modèle téléchargé sur demande, moteur embarqué, essai des vrais outils avant activation.
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { assistantErrorText, testAssistant } from '../ai/setup'
import { cancelDownload, downloadModel, downloadProgress, localCatalog, recommendedModel, setModelDirectory, startServer, stopServer, type DownloadProgress, type LocalCatalog } from '../ai/local'
import { nativeAvailable, openExternal } from '../ai/transport'
import { useAi } from '../store/aiStore'
import { Icon } from './Icon'

export function LocalAiSetup({ back, advanced }: { back: () => void; advanced: () => void }) {
  const { t, i18n } = useTranslation()
  const settings = useAi((s) => s.settings)
  const [catalog, setCatalog] = useState<LocalCatalog | null>(null)
  const [id, setId] = useState(settings.provider === 'builtin' && settings.managed && 'catalogId' in settings.managed ? settings.managed.catalogId : '')
  const [progress, setProgress] = useState<DownloadProgress | null>(null)
  const [busy, setBusy] = useState(false)
  const [tested, setTested] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState(false)
  const native = nativeAvailable()
  const saved = useRef(false)
  const autoStarted = useRef(false)
  const installerDirectory = useAi((s) => s.installerDirectory)
  const selected = catalog?.models.find((m) => m.id === id)
  const downloading = !!progress?.running
  const locked = busy || downloading
  const close = () => { if (!locked) useAi.getState().setSetupOpen(false) }
  const displayError = useCallback((e: unknown) => {
    setError(true)
    setMessage(assistantErrorText(t, e))
  }, [t])
  const reload = async () => {
    const c = await localCatalog()
    setCatalog(c)
    setId((current) => c.models.some((m) => m.id === current) ? current : recommendedModel(c.models, c.memory_bytes)?.id ?? '')
  }

  useEffect(() => {
    if (!native) return
    let disposed = false
    void localCatalog().then(async (c) => {
      if (disposed) return
      setCatalog(c)
      setId((current) => c.models.some((m) => m.id === current) ? current : recommendedModel(c.models, c.memory_bytes)?.id ?? '')
      if (installerDirectory && !autoStarted.current && c.runtime_available) {
        autoStarted.current = true
        setBusy(true); setError(false); setMessage(t('ai.local.downloading')); setId('qwen3-4b')
        try {
          await setModelDirectory(installerDirectory)
          if (useAi.getState().settings.provider === 'builtin') useAi.getState().saveSettings({ ...useAi.getState().settings, enabled: false })
          setCatalog(await localCatalog())
          await downloadModel('qwen3-4b')
          if (!disposed) { setCatalog(await localCatalog()); setMessage(t('ai.local.downloaded')) }
        } catch (e) { if (!disposed) displayError(e) }
        finally { if (!disposed) setBusy(false) }
      }
    }).catch(() => { if (!disposed) { setError(true); setMessage(t('ai.local.error.storage')) } })
    const poll = () => { void downloadProgress().then((p) => { if (!disposed) setProgress(p) }).catch(() => undefined) }
    poll()
    const timer = window.setInterval(poll, 500)
    return () => { disposed = true; window.clearInterval(timer) }
  }, [native, t, installerDirectory, displayError])

  useEffect(() => () => { if (!saved.current && native) void stopServer().catch(() => undefined) }, [native])

  useEffect(() => {
    const escape = (e: KeyboardEvent) => { if (e.key === 'Escape' && !locked) useAi.getState().setSetupOpen(false) }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [locked])

  const install = async () => {
    if (!selected) return
    setBusy(true); setError(false); setMessage(t('ai.local.downloading')); setTested(false)
    try {
      await downloadModel(id)
      await reload()
      setMessage(t('ai.local.downloaded'))
    } catch (e) { displayError(e) }
    finally { setBusy(false); setProgress(await downloadProgress().catch(() => null)) }
  }
  const chooseDirectory = async () => {
    const { open } = await import('@tauri-apps/plugin-dialog')
    const directory = await open({ directory: true, multiple: false, defaultPath: catalog?.directory })
    if (typeof directory !== 'string' || directory === catalog?.directory) return
    setBusy(true); setTested(false); setMessage('')
    try {
      await setModelDirectory(directory)
      if (useAi.getState().settings.provider === 'builtin') useAi.getState().saveSettings({ ...useAi.getState().settings, enabled: false })
      await reload()
    } catch (e) { displayError(e) }
    finally { setBusy(false) }
  }
  const test = async () => {
    if (!selected?.installed) return
    setBusy(true); setTested(false); setError(false); setMessage(t('ai.local.testing'))
    try {
      await startServer({ catalogId: id }, undefined)
      await testAssistant({ provider: 'builtin', model: id }, i18n.language)
      setTested(true); setMessage(t('ai.local.tested'))
    } catch (e) {
      if (e === 'integrity' || e === 'missing') setCatalog(c => c ? { ...c, models: c.models.map(m => m.id === id ? { ...m, installed: false } : m) } : c)
      displayError(e)
    }
    finally { setBusy(false) }
  }
  const finish = () => {
    if (!tested || locked || !selected?.installed) return
    saved.current = true
    useAi.getState().saveSettings({ enabled: true, consent: false, provider: 'builtin', model: id, managed: { catalogId: id } })
    useAi.getState().setSetupOpen(false)
    useAi.getState().setPanelOpen(true)
  }
  const size = (bytes: number) => (bytes / 1e9).toLocaleString(i18n.language, { maximumFractionDigits: 2 })

  return <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) close() }}>
    <div className="dialog ai-setup" role="dialog" aria-modal="true" aria-labelledby="local-ai-title">
      <header className="dialog-head">
        <h2 id="local-ai-title">{t('ai.local.title')}</h2>
        <button className="icon-btn" disabled={locked} onClick={close} aria-label={t('settings.close')}><Icon name="close" /></button>
      </header>
      <div className="dialog-body">
        <section>
          <p className="dialog-hint">{t('ai.local.intro')}</p>
          {!native && <p className="ai-note">{t('ai.desktopOnly')}</p>}
          {catalog && !catalog.runtime_available && <p className="ai-note">{t(`ai.local.error.${catalog.runtime_error === 'platform' ? 'platform' : 'runtime'}`)}</p>}
          <ol className="ai-steps"><li>{t('ai.local.step1')}</li><li>{t('ai.local.step2')}</li><li>{t('ai.local.step3')}</li></ol>
          {catalog && <>
            <div className="field">
              <label>{t('ai.local.directory')}</label>
              <div className="ai-file"><span className="mono dim" title={catalog.directory}>{catalog.directory}</span><button className="btn" disabled={locked || !native} onClick={() => void chooseDirectory().catch(displayError)}>{t('ai.setup.choose')}</button></div>
              <p className="field-hint">{t('ai.local.directoryHint')}</p>
            </div>
            <p className="dialog-hint">{catalog.memory_bytes ? t('ai.local.memory', { gb: Math.round(catalog.memory_bytes / 1024 ** 3) }) : t('ai.local.memoryUnknown')}</p>
            <div className="ai-choices" role="radiogroup" aria-label={t('ai.setup.model')}>
              {catalog.models.map((m) => <label key={m.id} className={`ai-choice ${id === m.id ? 'is-on' : ''}`}>
                <input type="radio" name="local-model" checked={id === m.id} disabled={locked} onChange={() => { setId(m.id); setTested(false); setMessage('') }} />
                <span><strong>{m.label}</strong><br />{t('ai.local.spec', { gb: size(m.size), ram: m.minimum_ram_gb })}{m.installed ? ` · ${t('ai.local.installed')}` : ''}</span>
              </label>)}
            </div>
            {selected && <>
              <p className="dialog-hint">{t('ai.local.space', { gb: size(selected.size) })} {t('ai.local.license', { license: selected.license })}{' '}
                <button className="btn btn-ghost" disabled={locked} onClick={() => void openExternal(`https://huggingface.co/${selected.repo}/blob/${selected.revision}/LICENSE`)}>{t('ai.local.readLicense')}</button>
              </p>
              {!!catalog.memory_bytes && catalog.memory_bytes < selected.minimum_ram_gb * 1024 ** 3 && <p className="ai-note">{t('ai.local.lowMemory')}</p>}
              {downloading && <div className="ai-download" role="status">
                <progress max={progress.total} value={progress.downloaded} aria-label={t('ai.local.downloading')} />
                <span>{t('ai.local.progress', { done: size(progress.downloaded), total: size(progress.total) })}</span>
                <button className="btn" onClick={() => void cancelDownload().catch(displayError)}>{t('ai.local.cancel')}</button>
              </div>}
              <div className="dialog-actions">
                <button className="btn" disabled={locked || !native || !catalog.runtime_available || selected.installed} onClick={() => void install()}>{selected.partial ? t('ai.local.resume') : t('ai.local.download')}</button>
                <button className="btn" disabled={locked || !selected.installed || !catalog.runtime_available} onClick={() => void test()}>{t('ai.local.test')}</button>
              </div>
            </>}
          </>}
          {message && <p className={`ai-status ${error ? 'is-error' : tested ? 'is-ok' : 'is-running'}`} role="status">{message}</p>}
          <p className="dialog-hint">{t('ai.local.limits')}</p>
          <div className="dialog-actions">
            <button className="btn btn-ghost" disabled={locked} onClick={back}>{t('ai.setup.back')}</button>
            <button className="btn btn-ghost" disabled={locked} onClick={() => { void stopServer().catch(() => undefined); advanced() }}>{t('ai.local.advanced')}</button>
            <button className="btn btn-primary" disabled={!tested || locked} onClick={finish}>{t('ai.local.enable')}</button>
          </div>
          {settings.enabled && <div className="dialog-actions"><button className="btn btn-ghost" disabled={locked} onClick={() => { useAi.getState().saveSettings({ ...settings, enabled: false }); void stopServer().catch(() => undefined); close() }}>{t('ai.setup.disable')}</button></div>}
        </section>
      </div>
    </div>
  </div>
}
