// Dock inférieur : listes générées automatiquement depuis le schéma.
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { buildBom, computeTotals } from '../model/bom'
import { buildCableBom, getCable } from '../model/cables'
import { connectorLabel } from '../model/connectors'
import { findPort } from '../model/rules'
import { SIGNAL_STYLE } from '../model/signals'
import { useProject } from '../store/projectStore'
import { useIssues } from '../store/useIssues'
import { useUi, type DockTab } from '../store/uiStore'
import { Icon } from './Icon'
import { translateParams } from './Inspector'

const fmt = (n: number, digits = 0) => n.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits })

function CablesTable() {
  const { t } = useTranslation()
  const project = useProject((s) => s.project)
  const selected = useUi((s) => s.selectedLinks)
  const rows = useMemo(() => Object.values(project.links).sort((a, b) => a.label.localeCompare(b.label)), [project.links])
  if (!rows.length) return <p className="empty">{t('dock.none')}</p>
  return (
    <table>
      <thead>
        <tr><th>{t('dock.number')}</th><th>{t('dock.signal')}</th><th>{t('dock.from')}</th><th>{t('dock.to')}</th><th>{t('dock.connectors')}</th><th>{t('dock.cable')}</th><th className="num">{t('dock.length')}</th></tr>
      </thead>
      <tbody>
        {rows.map((l) => {
          const sp = findPort(project, l.source)
          const tp = findPort(project, l.target)
          return (
            <tr key={l.id} className={selected.includes(l.id) ? 'is-selected' : ''} onClick={() => useUi.getState().focus('link', l.id)}>
              <td className="mono">{l.label}</td>
              <td>{sp && <><i className="swatch" style={{ background: SIGNAL_STYLE[sp.signal].color }} />{t(`signal.${sp.signal}`)}</>}</td>
              <td>{project.equipment[l.source.equipmentId]?.name} <span className="dim">/ {sp?.name}</span></td>
              <td>{project.equipment[l.target.equipmentId]?.name} <span className="dim">/ {tp?.name}</span></td>
              <td className="mono">{sp && tp ? `${connectorLabel(sp.connector)} → ${connectorLabel(tp.connector)}` : ''}</td>
              <td>{getCable(l.cableTypeId)?.label ?? <span className="dim">{t('dock.undefined')}</span>}</td>
              <td className="num mono">{l.lengthM !== undefined ? `${fmt(l.lengthM, 1)} m` : <span className="dim">{t('dock.undefined')}</span>}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function BomTable() {
  const { t } = useTranslation()
  const project = useProject((s) => s.project)
  const bom = useMemo(() => buildBom(project), [project])
  const totals = useMemo(() => computeTotals(project), [project])
  const cables = useMemo(
    () => buildCableBom(project, (l) => {
      const sp = findPort(project, l.source)
      const tp = findPort(project, l.target)
      return sp && tp ? [sp.connector, tp.connector] : undefined
    }),
    [project],
  )
  return (
    <>
    <table>
      <thead>
        <tr><th>{t('dock.designation')}</th><th className="num">{t('dock.qty')}</th><th className="num">{t('dock.unitPower')}</th><th className="num">{t('dock.unitWeight')}</th></tr>
      </thead>
      <tbody>
        {bom.map((b) => (
          <tr key={b.key}>
            <td>{b.manufacturer ? `${b.manufacturer} ` : ''}{b.model}</td>
            <td className="num mono">{b.quantity}</td>
            <td className="num mono">{b.powerW !== undefined ? `${fmt(b.powerW)} W` : <span className="dim">{t('dock.undefined')}</span>}</td>
            <td className="num mono">{b.weightKg !== undefined ? `${fmt(b.weightKg, 1)} kg` : <span className="dim">{t('dock.undefined')}</span>}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td>
            <strong>{t('dock.total')}</strong>
            <span className="dim"> · {t('dock.current', { v: project.settings.mainsVoltage, a: fmt(totals.currentA, 1) })}</span>
            {totals.missingPower > 0 && <span className="dim"> · {t('dock.missingPower', { n: totals.missingPower })}</span>}
          </td>
          <td className="num mono">{totals.equipmentCount}</td>
          <td className="num mono"><strong>{fmt(totals.powerW)} W</strong></td>
          <td className="num mono"><strong>{fmt(totals.weightKg, 1)} kg</strong></td>
        </tr>
      </tfoot>
    </table>
    {cables.length > 0 && (
      <table className="bom-cables">
        <thead>
          <tr><th>{t('dock.cableType')}</th><th className="num">{t('dock.qty')}</th><th className="num">{t('dock.length')}</th><th className="num">{t('dock.cableTotal')}</th></tr>
        </thead>
        <tbody>
          {cables.map((c) => {
            const cable = getCable(c.cableId)
            return (
              <tr key={c.key}>
                <td>
                  {cable ? <>{cable.label}{cable.reference && <span className="dim"> · {cable.reference}</span>}</> : <span className="dim">{t('dock.cableUnassigned')}{c.connectors ? ` : ${connectorLabel(c.connectors[0])} / ${connectorLabel(c.connectors[1])}` : ''}</span>}
                </td>
                <td className="num mono">{c.quantity}</td>
                <td className="num mono">{c.lengthM !== undefined ? `${fmt(c.lengthM, 1)} m` : <span className="dim">{t('dock.undefined')}</span>}</td>
                <td className="num mono">{c.lengthM !== undefined ? `${fmt(c.lengthM * c.quantity, 1)} m` : ''}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    )}
    </>
  )
}

function IssuesTable() {
  const { t } = useTranslation()
  const issues = useIssues()
  const links = useProject((s) => s.project.links)
  if (!issues.length) return <p className="empty ok-text"><Icon name="check" size={14} /> {t('dock.noIssues')}</p>
  return (
    <table>
      <thead>
        <tr><th>{t('dock.severity')}</th><th>{t('dock.number')}</th><th>{t('dock.problem')}</th><th>{t('dock.fix')}</th></tr>
      </thead>
      <tbody>
        {issues.map((i) => (
          <tr key={`${i.linkId}-${i.code}`} className={`sev-${i.severity}`} onClick={() => useUi.getState().focus('link', i.linkId)}>
            <td><span className="sev-pill">{t(`severity.${i.severity}`)}</span></td>
            <td className="mono">{links[i.linkId]?.label}</td>
            <td>{t(`rules.${i.code}.msg`, translateParams(i.params, t))}</td>
            <td className="dim">{t(`rules.${i.code}.fix`)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function Dock() {
  const { t } = useTranslation()
  const { dockTab, dockOpen, mode, setDockTab, setPref } = useUi()
  const issues = useIssues()
  const linkCount = useProject((s) => Object.keys(s.project.links).length)
  const errors = issues.filter((i) => i.severity === 'error').length
  const tabs: { id: DockTab; label: string; count?: number; tone?: string }[] = [
    { id: 'cables', label: t('dock.cables'), count: linkCount },
    { id: 'bom', label: t('dock.bom') },
    { id: 'issues', label: t('dock.issues'), count: issues.length, tone: errors ? 'err' : issues.length ? 'warn' : undefined },
  ]
  return (
    <section className={`dock ${dockOpen ? '' : 'is-collapsed'}`} aria-label={t('dock.cables')}>
      <div className="dock-bar" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={dockOpen && dockTab === tab.id}
            className="dock-tab"
            onClick={() => setDockTab(tab.id)}
          >
            {tab.label}
            {tab.count !== undefined && <span className={`count-chip ${tab.tone ?? ''}`}>{tab.count}</span>}
          </button>
        ))}
        <span className="spacer" />
        {dockOpen && dockTab === 'cables' && mode === 'expert' && (
          <button className="btn btn-ghost" onClick={() => useProject.getState().renumber()}>{t('dock.renumber')}</button>
        )}
        <button
          className="icon-btn"
          onClick={() => setPref('dockOpen', !dockOpen)}
          aria-label={dockOpen ? t('dock.collapse') : t('dock.expand')}
          title={dockOpen ? t('dock.collapse') : t('dock.expand')}
        >
          <Icon name={dockOpen ? 'chevronDown' : 'chevronUp'} />
        </button>
      </div>
      {dockOpen && (
        <div className="dock-body">
          {dockTab === 'cables' && <CablesTable />}
          {dockTab === 'bom' && <BomTable />}
          {dockTab === 'issues' && <IssuesTable />}
        </div>
      )}
    </section>
  )
}
