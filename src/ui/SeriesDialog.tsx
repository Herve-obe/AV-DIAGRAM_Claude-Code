// « Relier en série » : les sorties des équipements sélectionnés (ordre du schéma, de haut en bas) vers
// les entrées libres d'un autre équipement, dans l'ordre, avec aperçu et multipaire proposé.
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { applySeries, freeInputs, planSeries, schemaOrder, sourceFamilies } from '../model/series'
import type { SignalFamily } from '../model/signals'
import { useProject } from '../store/projectStore'
import { useUi } from '../store/uiStore'
import { useEditing } from '../collab/useEditing'
import { Icon } from './Icon'
import { useDialog } from './useDialog'

export function SeriesDialog() {
  const from = useUi((s) => s.seriesFrom)
  if (!from) return null
  return <SeriesForm key={from.join()} from={from} />
}

function SeriesForm({ from }: { from: string[] }) {
  const { t } = useTranslation()
  const editing = useEditing()
  const project = useProject((s) => s.project)
  const close = () => useUi.getState().setSeriesFrom(null)
  const sheetId = useUi.getState().currentSheetId
  const selected = from.filter((id) => project.equipment[id])
  // Destination proposée : parmi la sélection, l'équipement qui a le plus d'entrées libres (la console)
  const freeCount = (id: string) => project.equipment[id].ports.filter((p) => p.direction !== 'out').length
  const guess = selected.length > 1 ? [...selected].sort((a, b) => freeCount(b) - freeCount(a))[0] : ''
  const [dest, setDest] = useState(guess)
  const sources = useMemo(() => from.filter((id) => project.equipment[id] && id !== dest), [from, project, dest])
  const families = sourceFamilies(project, sources)
  const [family, setFamily] = useState<SignalFamily | ''>(families[0] ?? '')
  const fam = (family || families[0]) as SignalFamily | undefined
  const inputs = dest && fam ? freeInputs(project, dest, fam) : []
  const [start, setStart] = useState('')
  const plan = useMemo(
    () => (dest && fam ? planSeries(project, sources, dest, { family: fam, startPortId: start || undefined }) : null),
    [project, sources, dest, fam, start],
  )
  const [useMc, setUseMc] = useState(editing.common)
  const [mc, setMc] = useState('__new')
  const multicores = Object.values(project.multicores ?? {}).sort((a, b) => a.label.localeCompare(b.label))
  // Destinations possibles : équipements de la feuille hors sources, sélection d'abord
  const candidates = Object.values(project.equipment)
    .filter((e) => (e.sheetId ?? 'sh-1') === sheetId || selected.includes(e.id))
    .filter((e) => !(selected.length === 1 && e.id === selected[0]))
    .sort((a, b) => Number(selected.includes(b.id)) - Number(selected.includes(a.id)) || schemaOrder(a, b))

  const dialogRef = useDialog(true, close)

  const portName = (eqId: string, portId: string) => project.equipment[eqId]?.ports.find((p) => p.id === portId)?.name ?? portId
  const count = plan?.pairs.length ?? 0
  const withMc = useMc && count >= 2
  const candidate = plan ? applySeries(project, plan, withMc ? (mc === '__new' ? null : mc) : undefined).project : project
  const denial = editing.changeReason(candidate)
  const create = () => {
    if (!plan || !count || denial) return
    const ids = useProject.getState().connectSeries(plan, withMc ? (mc === '__new' ? null : mc) : undefined)
    useUi.getState().select([], ids)
    if (withMc) useUi.getState().setPref('linkView', 'cables')
    close()
  }

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="dialog series-dialog" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="series-title">
        <header className="dialog-head">
          <h2 id="series-title">{t('series.title')}</h2>
          <button className="icon-btn" onClick={close} aria-label={t('settings.close')}><Icon name="close" /></button>
        </header>
        <div className="dialog-body">
          <p className="dialog-hint">{t('series.hint')}</p>
          <div className="field-grid series-fields">
            <div className="field">
              <label htmlFor="series-dest">{t('series.dest')}</label>
              <select id="series-dest" value={dest} onChange={(e) => { setDest(e.target.value); setStart('') }}>
                <option value="">{t('series.choose')}</option>
                {candidates.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="series-family">{t('series.family')}</label>
              <select id="series-family" value={fam ?? ''} onChange={(e) => { setFamily(e.target.value as SignalFamily); setStart('') }}>
                {families.map((f) => <option key={f} value={f}>{t(`signal.${f}`)}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="series-start">{t('series.start')}</label>
              <select id="series-start" value={start} onChange={(e) => setStart(e.target.value)} disabled={!inputs.length}>
                <option value="">{t('series.firstFree')}</option>
                {inputs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <p className="dim small">{t('series.sources', { count: sources.length })}</p>
          {plan && count > 0 ? (
            <table className="series-table">
              <thead><tr><th>#</th><th>{t('series.from')}</th><th /><th>{t('series.to')}</th></tr></thead>
              <tbody>
                {plan.pairs.map((x, i) => (
                  <tr key={i}>
                    <td className="mono dim">{i + 1}</td>
                    <td>{project.equipment[x.source.equipmentId]?.name} <span className="dim">/ {portName(x.source.equipmentId, x.source.portId)}</span></td>
                    <td className="dim">→</td>
                    <td>{portName(x.target.equipmentId, x.target.portId)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="empty">{dest ? t('series.nothing') : t('series.pickDest')}</p>
          )}
          {plan && plan.unmatched.length > 0 && <p className="format-warning">{t('series.unmatched', { count: plan.unmatched.length })}</p>}
          {count >= 2 && (
            <div className="series-mc">
              <label className="check-line">
                <input type="checkbox" disabled={!editing.common} checked={useMc} onChange={(e) => setUseMc(e.target.checked)} />
                {t('series.multicore', { count })}
              </label>
              {useMc && (
                <select value={mc} onChange={(e) => setMc(e.target.value)} aria-label={t('inspector.multicore')}>
                  <option value="__new">+ {t('inspector.multicoreNew')}</option>
                  {multicores.map((m) => <option key={m.id} value={m.id}>{m.label} ({m.pairs})</option>)}
                </select>
              )}
            </div>
          )}
        </div>
        <footer className="dialog-foot">
          <button className="btn" onClick={close}>{t('series.cancel')}</button>
          <button className="btn btn-primary" onClick={create} disabled={!count || !!denial} title={denial ? t(`collab.notice.access.${denial.code}`, denial.params) : undefined}>{t('series.create', { count })}</button>
        </footer>
      </div>
    </div>
  )
}
