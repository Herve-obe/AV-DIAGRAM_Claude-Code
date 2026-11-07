import { useTranslation } from 'react-i18next'
import { useUi, type ThemePref, type UiMode } from '../store/uiStore'
import { TOP_ACTIONS, DEFAULT_TOOLBAR } from './topBarActions'
import { Icon } from './Icon'

export function InterfaceSettings() {
  const { t } = useTranslation()
  const { toolbar, theme, mode, lang, setPref } = useUi()
  const ordered = [...toolbar, ...TOP_ACTIONS.map(a => a.id).filter(id => !toolbar.includes(id))]
  const move = (i: number, delta: number) => {
    const next = [...toolbar]
    ;[next[i], next[i + delta]] = [next[i + delta], next[i]]
    setPref('toolbar', next)
  }
  return <>
    <section>
      <h3 className="group-title">{t('settings.tabs.interface')}</h3>
      <p className="dialog-hint">{t('toolbar.localHint')}</p>
      <div className="field-grid">
        <label className="field">{t('toolbar.theme')}<select value={theme} onChange={e => setPref('theme', e.target.value as ThemePref)}>
          {(['system', 'dark', 'light'] as const).map(x => <option key={x} value={x}>{t(`theme.${x}`)}</option>)}
        </select></label>
        <label className="field">{t('toolbar.mode')}<select value={mode} onChange={e => setPref('mode', e.target.value as UiMode)}>
          {(['beginner', 'expert'] as const).map(x => <option key={x} value={x}>{t(`mode.${x}`)}</option>)}
        </select></label>
        <label className="field">{t('toolbar.language')}<select value={lang} onChange={e => setPref('lang', e.target.value as 'fr' | 'en')}>
          <option value="fr">{t('toolbar.langFr')}</option><option value="en">{t('toolbar.langEn')}</option>
        </select></label>
      </div>
    </section>
    <section>
      <h3 className="group-title">{t('toolbar.title')}</h3>
      <p className="dialog-hint">{t('toolbar.hint')}</p>
      <button className="btn" onClick={() => setPref('toolbar', [...DEFAULT_TOOLBAR])}>{t('toolbar.reset')}</button>
      <ul className="toolbar-options" aria-label={t('toolbar.title')}>
        {ordered.map(id => {
          const action = TOP_ACTIONS.find(a => a.id === id)!, index = toolbar.indexOf(id), checked = index >= 0
          const label = t(action.label)
          return <li key={id}>
            <label><input type="checkbox" checked={checked} onChange={() => setPref('toolbar', checked ? toolbar.filter(x => x !== id) : [...toolbar, id])} />
              <Icon name={action.icon} size={16} /><span>{label}</span>
            </label>
            {checked && <>
              <button className="icon-btn" disabled={index === 0} aria-label={t('toolbar.up', { name: label })} onClick={() => move(index, -1)}><Icon name="chevronUp" /></button>
              <button className="icon-btn" disabled={index === toolbar.length - 1} aria-label={t('toolbar.down', { name: label })} onClick={() => move(index, 1)}><Icon name="chevronDown" /></button>
            </>}
          </li>
        })}
      </ul>
    </section>
  </>
}
