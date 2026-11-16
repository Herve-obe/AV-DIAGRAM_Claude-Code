// Création d'un équipement générique (modèle absent de la bibliothèque) : nom, menu, famille,
// groupes de prises (sens, signal, connecteur, niveau, nombre), poids et consommation facultatifs.
// La fiche est rangée dans « Mon entreprise » puis posée sur le schéma.
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { connectorLabel } from '../model/connectors'
import { buildGenericTemplate, connectorsFor, DOMAIN_SIGNALS, familiesFor, genericErrors, MAX_GENERIC_PORTS, type GenericSpec, type PortGroup } from '../model/genericEquipment'
import type { EquipmentTemplate, Level, LibraryDomain, PortDirection } from '../model/types'
import type { SignalFamily } from '../model/signals'
import { useLibrary } from '../store/libraryStore'
import { Icon } from './Icon'
import { useDialog } from './useDialog'

const DOMAINS: LibraryDomain[] = ['sound', 'image', 'light', 'network', 'distribution', 'misc']
const LEVELS: Level[] = ['mic', 'line+4', 'line-10', 'instrument', 'phono', 'speaker']

function newGroup(domain: LibraryDomain, direction: PortDirection): PortGroup {
  const signal = DOMAIN_SIGNALS[domain][0]
  return { direction, signal, connector: connectorsFor(signal)[0], count: 1, label: '', ...(signal === 'audioAnalog' ? { level: 'line+4' as Level } : {}) }
}

/** Nombre facultatif : champ vide = non renseigné. */
const optNum = (s: string) => (s.trim() === '' ? undefined : Number(s.replace(',', '.')))

export function GenericEquipmentDialog({ onClose, onCreate, onBlank }: {
  onClose: () => void
  /** Pose la fiche créée sur le schéma */
  onCreate: (tpl: EquipmentTemplate) => void
  /** Bloc vide édité en mode Expert (ancien comportement) */
  onBlank: () => void
}) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [domain, setDomain] = useState<LibraryDomain>('sound')
  const [family, setFamily] = useState(familiesFor('sound')[0])
  const [groups, setGroups] = useState<PortGroup[]>([newGroup('sound', 'in'), newGroup('sound', 'out')])
  const [weight, setWeight] = useState('')
  const [power, setPower] = useState('')
  const [tried, setTried] = useState(false)

  const dialogRef = useDialog(true, onClose)

  // Changer de menu remet la famille et les signaux sur des valeurs valables pour ce menu
  const changeDomain = (d: LibraryDomain) => {
    setDomain(d)
    if (!familiesFor(d).includes(family)) setFamily(familiesFor(d)[0])
    setGroups(gs => gs.map(g => (DOMAIN_SIGNALS[d].includes(g.signal) ? g : { ...newGroup(d, g.direction), count: g.count, label: g.label })))
  }
  const patch = (i: number, p: Partial<PortGroup>) => setGroups(gs => gs.map((g, k) => {
    if (k !== i) return g
    const next = { ...g, ...p }
    if (p.signal) {
      if (!connectorsFor(p.signal).includes(next.connector)) next.connector = connectorsFor(p.signal)[0]
      if (p.signal === 'audioAnalog') next.level = next.level ?? 'line+4'
      else delete next.level
    }
    return next
  }))

  const spec: GenericSpec = { name, domain, family, groups, weightKg: optNum(weight), powerW: optNum(power) }
  const errors = genericErrors(spec)
  const total = groups.reduce((n, g) => n + (Number.isInteger(g.count) ? g.count : 0), 0)
  const create = () => {
    setTried(true)
    if (errors.length) return
    // Libellé vide : le sens traduit (« Entrée », « Sortie ») sert de nom de base
    const tpl = buildGenericTemplate({ ...spec, groups: groups.map(g => ({ ...g, label: g.label.trim() || t(`direction.${g.direction}`) })) })
    useLibrary.getState().addUserTemplate(tpl)
    onCreate(tpl)
    onClose()
  }

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog generic-dialog" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="generic-title">
        <header className="dialog-head">
          <h2 id="generic-title">{t('generic.title')}</h2>
          <button className="icon-btn" onClick={onClose} aria-label={t('settings.close')}><Icon name="close" /></button>
        </header>
        <div className="dialog-body">
          <p className="dialog-hint">{t('generic.hint')}</p>
          <div className="field-grid">
            <div className="field">
              <label htmlFor="generic-name">{t('generic.name')}</label>
              <input id="generic-name" value={name} autoFocus onChange={(e) => setName(e.target.value)} placeholder={t('generic.namePlaceholder')} />
            </div>
            <div className="field">
              <label htmlFor="generic-domain">{t('generic.domain')}</label>
              <select id="generic-domain" value={domain} onChange={(e) => changeDomain(e.target.value as LibraryDomain)}>
                {DOMAINS.map(d => <option key={d} value={d}>{t(`library.domain.${d}`)}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="generic-family">{t('generic.family')}</label>
              <select id="generic-family" value={family} onChange={(e) => setFamily(e.target.value as typeof family)}>
                {familiesFor(domain).map(f => <option key={f} value={f}>{t(`family.${f}`)}</option>)}
              </select>
            </div>
          </div>

          <table className="generic-groups">
            <thead>
              <tr>
                <th>{t('generic.direction')}</th><th>{t('generic.signal')}</th><th>{t('generic.connector')}</th>
                <th>{t('generic.level')}</th><th>{t('generic.count')}</th><th>{t('generic.label')}</th><th />
              </tr>
            </thead>
            <tbody>
              {groups.map((g, i) => (
                <tr key={i}>
                  <td>
                    <select aria-label={t('generic.direction')} value={g.direction} onChange={(e) => patch(i, { direction: e.target.value as PortDirection })}>
                      {(['in', 'out', 'bidir'] as PortDirection[]).map(d => <option key={d} value={d}>{t(`direction.${d}`)}</option>)}
                    </select>
                  </td>
                  <td>
                    <select aria-label={t('generic.signal')} value={g.signal} onChange={(e) => patch(i, { signal: e.target.value as SignalFamily })}>
                      {DOMAIN_SIGNALS[domain].map(s => <option key={s} value={s}>{t(`signal.${s}`)}</option>)}
                    </select>
                  </td>
                  <td>
                    <select aria-label={t('generic.connector')} value={g.connector} onChange={(e) => patch(i, { connector: e.target.value })}>
                      {connectorsFor(g.signal).map(c => <option key={c} value={c}>{connectorLabel(c)}</option>)}
                    </select>
                  </td>
                  <td>
                    {g.signal === 'audioAnalog'
                      ? <select aria-label={t('generic.level')} value={g.level} onChange={(e) => patch(i, { level: e.target.value as Level })}>
                          {LEVELS.map(l => <option key={l} value={l}>{t(`level.${l}`)}</option>)}
                        </select>
                      : <span className="dim">{t('level.none')}</span>}
                  </td>
                  <td>
                    <input aria-label={t('generic.count')} type="number" min={1} max={MAX_GENERIC_PORTS} value={Number.isFinite(g.count) ? g.count : ''}
                      onChange={(e) => patch(i, { count: e.target.value === '' ? NaN : Number(e.target.value) })} />
                  </td>
                  <td>
                    <input aria-label={t('generic.label')} value={g.label} placeholder={t(`direction.${g.direction}`)} onChange={(e) => patch(i, { label: e.target.value })} />
                  </td>
                  <td>
                    <button className="icon-btn small" onClick={() => setGroups(gs => gs.filter((_, k) => k !== i))} aria-label={t('generic.removeGroup')} title={t('generic.removeGroup')}>
                      <Icon name="close" size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="generic-add">
            <button className="btn" onClick={() => setGroups(gs => [...gs, newGroup(domain, 'in')])}><Icon name="plus" size={14} />{t('generic.addGroup')}</button>
            <span className="dim">{t('generic.total', { count: total, max: MAX_GENERIC_PORTS })}</span>
          </div>

          <div className="field-grid">
            <div className="field">
              <label htmlFor="generic-weight">{t('generic.weight')}</label>
              <input id="generic-weight" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder={t('generic.optional')} />
            </div>
            <div className="field">
              <label htmlFor="generic-power">{t('generic.power')}</label>
              <input id="generic-power" inputMode="decimal" value={power} onChange={(e) => setPower(e.target.value)} placeholder={t('generic.optional')} />
            </div>
          </div>
          {tried && errors.length > 0 && (
            <ul className="generic-errors" role="alert">
              {errors.map(e => <li key={e}>{t(`generic.error.${e}`)}</li>)}
            </ul>
          )}
        </div>
        <footer className="dialog-foot">
          <button className="btn" onClick={() => { onBlank(); onClose() }}>{t('generic.blank')}</button>
          <button className="btn" onClick={onClose}>{t('generic.cancel')}</button>
          <button className="btn btn-primary" onClick={create}>{t('generic.create')}</button>
        </footer>
      </div>
    </div>
  )
}
