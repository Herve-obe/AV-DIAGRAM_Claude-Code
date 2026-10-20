import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useEditing } from '../collab/useEditing'
import { isEquipmentDeployment, isNetwork, isPortDeployment, isPowerCircuits } from '../model/deployment'
import { clockIssues, communicationPorts } from '../model/communications'
import { networkIssues, networkPorts, portName, isNetworkPort, poeLoads, type DeploymentIssue } from '../model/network'
import { circuitLoad, equipmentPower, removeCircuit } from '../model/power'
import { checkLink } from '../model/rules'
import { uid } from '../model/project'
import type { Equipment, NetworkInterface, PortDef, PowerCircuit } from '../model/types'
import { useProject } from '../store/projectStore'
import { useUi } from '../store/uiStore'
import { useExportPdf } from './ExportPdfDialog'
import { exportWorkbook } from '../io/xlsx'
import { notifyError } from '../io/files'
import { startPatchImport } from './PatchImportDialog'
import { LayerPicker } from './FilterBar'

/** Saisie locale ; une valeur invalide est expliquée et ne rejoint jamais le projet. */
function Cell({ value, label, disabled, commit }: { value: string | number | undefined; label: string; disabled?: boolean; commit: (value: string) => boolean }) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState(String(value ?? '')), [error, setError] = useState(false)
  useEffect(() => { setDraft(String(value ?? '')); setError(false) }, [value])
  const apply = () => { if (draft !== String(value ?? '')) setError(!commit(draft.trim())) }
  return <div className="deploy-cell"><input aria-label={label} title={label} aria-invalid={error} disabled={disabled} value={draft} onChange={e => { setDraft(e.target.value); setError(false) }} onBlur={apply} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') { e.stopPropagation(); setDraft(String(value ?? '')); setError(false) } }} />{error && <small role="alert">{t('engineering.invalid')}</small>}</div>
}
const number = (s: string) => s === '' ? undefined : /^(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(s) ? Number(s.replace(',', '.')) : NaN
const selectEq = (e: Equipment) => useUi.getState().select([e.id], [])
const fmt = (n: number) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n)

function Issues({ items }: { items: DeploymentIssue[] }) {
  const { t } = useTranslation()
  return <details className="deploy-issues" open={items.length > 0}><summary>{t('engineering.alerts', { count: items.length })}</summary>{items.length ? <ul>{items.slice(0, 200).map((i, n) => <li key={n}><strong>{i.subject}</strong> — {t(`engineering.issues.${i.code}`)}{i.detail && ` (${i.detail})`}</li>)}</ul> : <p>{t('engineering.noAlerts')}</p>}{items.length > 200 && <p>{t('engineering.moreAlerts')}</p>}</details>
}
function Header({ name, hint }: { name: string; hint: string }) {
  const { t } = useTranslation()
  return <header className="deploy-header"><div><h2>{t(name)}</h2><p>{t(hint)}</p><LayerPicker /></div><div className="deploy-actions"><button className="btn" onClick={() => useExportPdf.getState().setOpen(true)}>PDF</button><button className="btn" onClick={() => void exportWorkbook(useProject.getState().project, t).catch(() => notifyError(t('xlsx.exportError')))}>Excel</button></div></header>
}
function Pager({ page, total, size, set }: { page: number; total: number; size: number; set: (n: number) => void }) {
  const { t } = useTranslation(), last = Math.max(0, Math.ceil(total / size) - 1)
  const at = Math.min(page, last)
  return total > size ? <div className="deploy-pager"><button className="btn" disabled={at === 0} aria-label={t('engineering.previous')} onClick={() => set(at - 1)}>‹</button><span>{at + 1} / {last + 1}</span><button className="btn" disabled={at === last} aria-label={t('engineering.next')} onClick={() => set(at + 1)}>›</button></div> : null
}
function useRows<T>(rows: T[], size = 100) {
  const [page, set] = useState(0), current = Math.min(page, Math.max(0, Math.ceil(rows.length / size) - 1))
  return { rows: rows.slice(current * size, (current + 1) * size), pager: <Pager page={current} total={rows.length} size={size} set={set} /> }
}

export function NetworkView() {
  const { t } = useTranslation(), p = useProject(s => s.project), edit = useEditing()
  const [filter, setFilter] = useState('')
  const loads = poeLoads(p)
  const all = networkPorts(p), list = useRows(all.filter(x => `${portName(x.e, x.port)} ${x.port.network?.address ?? ''} ${x.port.network?.vlan ?? ''}`.toLowerCase().includes(filter.toLowerCase())))
  const flows = useRows(Object.values(p.links).filter(l => {
    const a = p.equipment[l.source.equipmentId]?.ports.find(x => x.id === l.source.portId), b = p.equipment[l.target.equipmentId]?.ports.find(x => x.id === l.target.portId)
    return a && b && isNetworkPort(a) && isNetworkPort(b)
  }))
  const update = (e: Equipment, port: PortDef, patch: Partial<NetworkInterface>) => {
    const next = { ...port.network, ...patch }
    if (!isNetwork(next)) return false
    useProject.getState().updatePort(e.id, port.id, { network: next }); return true
  }
  return <section className="deployment-view" data-view="network"><Header name="pages.network" hint="engineering.networkHint" /><input className="deploy-search" aria-label={t('engineering.filter')} placeholder={t('engineering.filter')} value={filter} onChange={e => setFilter(e.target.value)} /><p className="dim">{t('engineering.ipCount', { count: all.filter(x => !!x.port.network?.address).length, total: all.length })}</p><div className="deploy-scroll"><table><thead><tr>{['equipment', 'port', 'address', 'prefix', 'vlan', 'tagged', 'capacity', 'poe', 'poeW'].map(k => <th key={k}>{t(`engineering.${k}`)}</th>)}</tr></thead><tbody>{list.rows.map(({ e, port }) => {
    const n = port.network, disabled = !edit.port(e, port), label = portName(e, port)
    return <tr key={`${e.id}/${port.id}`}><td><button className="text-btn" onClick={() => selectEq(e)}>{e.name}</button></td><td>{port.name}</td><td><Cell label={`${label} IPv4`} disabled={disabled} value={n?.address} commit={s => update(e, port, { address: s || undefined })} /></td>{(['prefix', 'vlan'] as const).map(k => <td key={k}><Cell label={`${label} ${t(`engineering.${k}`)}`} disabled={disabled} value={n?.[k]} commit={s => update(e, port, { [k]: number(s) })} /></td>)}<td><Cell label={`${label} ${t('engineering.tagged')}`} disabled={disabled} value={n?.taggedVlans?.join(', ')} commit={s => update(e, port, { taggedVlans: s ? s.split(/[,;\s]+/).map(v => /^\d+$/.test(v) ? Number(v) : NaN) : undefined })} /></td><td><Cell label={`${label} ${t('engineering.capacity')}`} disabled={disabled} value={n?.capacityMbps} commit={s => update(e, port, { capacityMbps: number(s) })} /></td><td><select aria-label={`${label} PoE`} disabled={disabled} value={n?.poe ?? ''} onChange={event => update(e, port, { poe: (event.target.value || undefined) as NetworkInterface['poe'] })}>{['', 'source', 'sink', 'none'].map(v => <option key={v} value={v}>{t(`engineering.poeRoles.${v || 'unknown'}`)}</option>)}</select></td><td><Cell label={`${label} PoE W`} disabled={disabled} value={n?.poeW} commit={s => update(e, port, { poeW: number(s) })} /></td></tr>
  })}</tbody></table></div>{!all.length && <p>{t('engineering.noPorts')}</p>}{list.pager}<h3>{t('engineering.budgets')}</h3><div className="deploy-cards">{Object.values(p.equipment).filter(e => e.ports.some(x => x.network?.poe === 'source')).map(e => <label key={e.id}>{e.name} · W<Cell label={`${e.name} ${t('engineering.budgets')}`} value={e.poeBudgetW} disabled={!edit.equipment(e)} commit={s => { const patch = { poeBudgetW: number(s) }; if (!isEquipmentDeployment(patch)) return false; useProject.getState().updateEquipment(e.id, patch); return true }} /><small> · {t('engineering.knownDemand')}: {fmt(loads.get(e.id)?.watts ?? 0)} W {(loads.get(e.id)?.unknown ?? 0) > 0 && t('engineering.incomplete')}</small></label>)}</div><h3>{t('engineering.flows')}</h3><p className="dim">{t('engineering.flowsHint')}</p><div className="deploy-scroll"><table><thead><tr>{['link', 'source', 'target', 'bitrate'].map(k => <th key={k}>{t(`engineering.${k}`)}</th>)}</tr></thead><tbody>{flows.rows.map(l => {
    const a = p.equipment[l.source.equipmentId], b = p.equipment[l.target.equipmentId], ap = a.ports.find(x => x.id === l.source.portId)!, bp = b.ports.find(x => x.id === l.target.portId)!
    return <tr key={l.id}><td><button className="text-btn" onClick={() => useUi.getState().select([], [l.id])}>{l.label}</button></td><td>{portName(a, ap)}</td><td>{portName(b, bp)}</td><td><Cell label={`${l.label} Mbit/s`} value={l.bitrateMbps} disabled={!edit.link(ap,bp)} commit={s => { const n = number(s); if (n !== undefined && (!Number.isFinite(n) || n < 0)) return false; useProject.getState().updateLink(l.id, { bitrateMbps: n }); return true }} /></td></tr>
  })}</tbody></table></div>{flows.pager}<Issues items={networkIssues(p)} /></section>
}

export function PowerView() {
  const { t } = useTranslation(), p = useProject(s => s.project), edit = useEditing()
  const [name, setName] = useState(''), [phaseCount, setPhaseCount] = useState<1 | 3>(1), [error, setError] = useState(false), [filter, setFilter] = useState('')
  const circuits = p.settings.powerCircuits ?? [], list = useRows(Object.values(p.equipment).filter(e => e.name.toLowerCase().includes(filter.toLowerCase())))
  const circuit = (c: PowerCircuit, patch: Partial<PowerCircuit>) => {
    const next = circuits.map(x => x.id === c.id ? { ...x, ...patch } : x)
    if (!isPowerCircuits(next)) return false
    useProject.getState().updateSettings({ powerCircuits: next }); return true
  }
  const eq = (e: Equipment, patch: Partial<Equipment>) => { if (!isEquipmentDeployment(patch) || (patch.powerW !== undefined && (!Number.isFinite(patch.powerW) || patch.powerW < 0))) return false; useProject.getState().updateEquipment(e.id, patch); return true }
  return <section className="deployment-view" data-view="power"><Header name="pages.power" hint="engineering.powerHint" /><form className="deploy-actions" onSubmit={event => { event.preventDefault(); const c: PowerCircuit = { id: uid('circuit'), name: name.trim(), phases: phaseCount, voltage: p.settings.mainsVoltage }; if (!edit.common || !isPowerCircuits([...circuits, c])) { setError(true); return } useProject.getState().updateSettings({ powerCircuits: [...circuits, c] }); setName(''); setError(false) }}><input aria-label={t('engineering.circuitName')} placeholder={t('engineering.circuitName')} disabled={!edit.common} value={name} onChange={e => setName(e.target.value)} /><select aria-label={t('engineering.phases')} disabled={!edit.common} value={phaseCount} onChange={e => setPhaseCount(Number(e.target.value) as 1 | 3)}><option value={1}>{t('engineering.single')}</option><option value={3}>{t('engineering.three')}</option></select><button className="btn" disabled={!edit.common || !name.trim()}>{t('engineering.addCircuit')}</button>{error && <span role="alert">{t('engineering.invalid')}</span>}</form><div className="deploy-cards">{circuits.map(c => { const load = circuitLoad(p, c); return <article className="deploy-card" key={c.id}><h3><Cell label={t('engineering.circuitName')} value={c.name} disabled={!edit.common} commit={s => circuit(c, { name: s })} /></h3><p>{t(c.phases === 1 ? 'engineering.single' : 'engineering.three')}</p><label>{t('engineering.voltage')}<Cell label={`${c.name} V`} value={c.voltage} disabled={!edit.common} commit={s => circuit(c, { voltage: number(s) ?? NaN })} /></label><label>{t('engineering.rated')}<Cell label={`${c.name} A`} value={c.ratedA} disabled={!edit.common} commit={s => circuit(c, { ratedA: number(s) })} /></label>{load.loads.map(l => <p className={c.ratedA !== undefined && l.amps > c.ratedA ? 'err-text' : ''} key={l.phase}><strong>{l.phase}</strong> : {fmt(l.watts)} W · {l.unknown || load.unphased ? '≥ ' : ''}{fmt(l.amps)} A {l.unknown > 0 && <span className="warn-text">{t('engineering.incomplete')}</span>}{c.ratedA !== undefined && l.amps > c.ratedA && <strong> · {t('engineering.overload')}</strong>}</p>)}{load.unphased > 0 && <p className="warn-text">{t('engineering.unphased', { count: load.unphased })}</p>}<button className="btn" disabled={!edit.common} onClick={() => useProject.getState().replaceProject(removeCircuit(useProject.getState().project, c.id))}>{t('engineering.removeCircuit')}</button></article> })}</div><input className="deploy-search" aria-label={t('engineering.filter')} placeholder={t('engineering.filter')} value={filter} onChange={e => setFilter(e.target.value)} /><div className="deploy-scroll"><table><thead><tr>{['equipment', 'powerW', 'factor', 'circuit', 'phase', 'knownPower'].map(k => <th key={k}>{t(`engineering.${k}`)}</th>)}</tr></thead><tbody>{list.rows.map(e => { const disabled = !edit.equipment(e), c = circuits.find(x => x.id === e.powerCircuitId), power = equipmentPower(e); return <tr key={e.id}><td><button className="text-btn" onClick={() => selectEq(e)}>{e.name}</button></td><td><Cell label={`${e.name} W`} value={e.powerW} disabled={disabled} commit={s => eq(e, { powerW: number(s) })} /></td><td><Cell label={`${e.name} ${t('engineering.factor')}`} value={e.powerFactor} disabled={disabled} commit={s => eq(e, { powerFactor: number(s) })} /></td><td><select aria-label={`${e.name} ${t('engineering.circuit')}`} disabled={disabled} value={e.powerCircuitId ?? ''} onChange={event => { const chosen = circuits.find(x => x.id === event.target.value); eq(e, { powerCircuitId: chosen?.id, powerPhase: chosen?.phases === 1 ? 'L1' : undefined }) }}><option value="">{t('engineering.unassigned')}</option>{e.powerCircuitId && !c && <option value={e.powerCircuitId}>{t('engineering.missingCircuit')}</option>}{circuits.map(x => <option value={x.id} key={x.id}>{x.name}</option>)}</select></td><td><select aria-label={`${e.name} ${t('engineering.phase')}`} value={e.powerPhase ?? ''} disabled={disabled || !c} onChange={event => eq(e, { powerPhase: event.target.value as Equipment['powerPhase'] || undefined })}><option value="">{t('engineering.unassigned')}</option>{(c?.phases === 3 ? ['L1', 'L2', 'L3', 'ABC'] : ['L1']).map(x => <option key={x} value={x}>{x === 'ABC' ? t('engineering.balanced') : x}</option>)}</select></td><td>{power.unknown ? '≥ ' : ''}{fmt(power.watts)} W{power.unknown > 0 && <small className="warn-text"> · {t('engineering.incomplete')}</small>}</td></tr> })}</tbody></table></div>{list.pager}<p className="dim">{t('engineering.unassignedCount', { count: Object.values(p.equipment).filter(e => !circuits.some(c => c.id === e.powerCircuitId)).length })}</p></section>
}

export function CommunicationsView({ sync }: { sync: boolean }) {
  const { t } = useTranslation(), p = useProject(s => s.project), edit = useEditing(), [filter, setFilter] = useState(''), [matrixPage, setMatrixPage] = useState(0), [targetPage, setTargetPage] = useState(0)
  const ports = communicationPorts(p, sync).filter(x => portName(x.e, x.port).toLowerCase().includes(filter.toLowerCase())), list = useRows(ports)
  const sources = ports.filter(x => x.port.direction !== 'in'), targets = ports.filter(x => x.port.direction !== 'out')
  const sourceAt = Math.min(matrixPage, Math.max(0, Math.ceil(sources.length / 20) - 1)), targetAt = Math.min(targetPage, Math.max(0, Math.ceil(targets.length / 20) - 1))
  const update = (e: Equipment, port: PortDef, patch: Partial<PortDef>) => { if (!isPortDeployment({ ...port, ...patch })) return false; useProject.getState().updatePort(e.id, port.id, patch); return true }
  return <section className="deployment-view" data-view={sync ? 'sync' : 'intercom'}><Header name={sync ? 'pages.sync' : 'pages.intercom'} hint={sync ? 'engineering.syncHint' : 'engineering.intercomHint'} /><input className="deploy-search" aria-label={t('engineering.filter')} placeholder={t('engineering.filter')} value={filter} onChange={e => { setFilter(e.target.value); setMatrixPage(0); setTargetPage(0) }} /><div className="deploy-scroll"><table><thead><tr>{(sync ? ['equipment', 'port', 'protocol', 'domain', 'role', 'rate'] : ['equipment', 'port', 'channel', 'group']).map(k => <th key={k}>{t(`engineering.${k}`)}</th>)}</tr></thead><tbody>{list.rows.map(({ e, port }) => { const label = portName(e, port), disabled = !edit.port(e, port), c = port.clock; return <tr key={`${e.id}/${port.id}`}><td><button className="text-btn" onClick={() => selectEq(e)}>{e.name}</button></td><td>{port.name}</td>{sync ? <><td><Cell label={`${label} ${t('engineering.protocol')}`} value={c?.protocol} disabled={disabled} commit={s => update(e, port, { clock: s ? { protocol: s, domain: c?.domain ?? '0', role: c?.role ?? 'auto', rate: c?.rate } : undefined })} /></td><td><Cell label={`${label} ${t('engineering.domain')}`} value={c?.domain} disabled={disabled || !c} commit={s => update(e, port, { clock: c ? { ...c, domain: s } : undefined })} /></td><td><select aria-label={`${label} ${t('engineering.role')}`} disabled={disabled || !c} value={c?.role ?? 'auto'} onChange={event => update(e, port, { clock: c ? { ...c, role: event.target.value as NonNullable<PortDef['clock']>['role'] } : undefined })}>{['auto', 'master', 'follower'].map(role => <option key={role} value={role}>{t(`engineering.roles.${role}`)}</option>)}</select></td><td><Cell label={`${label} ${t('engineering.rate')}`} value={c?.rate} disabled={disabled || !c} commit={s => update(e, port, { clock: c ? { ...c, rate: s || undefined } : undefined })} /></td></> : (['channel', 'group'] as const).map(k => <td key={k}><Cell label={`${label} ${t(`engineering.${k}`)}`} value={port.intercom?.[k]} disabled={disabled} commit={s => update(e, port, { intercom: { ...port.intercom, [k]: s || undefined } })} /></td>)}</tr> })}</tbody></table></div>{!ports.length && <p>{t('engineering.noPorts')}</p>}{list.pager}<CommunicationLinks sync={sync} />{sync ? <Issues items={clockIssues(p)} /> : <><h3>{t('engineering.matrix')}</h3><p className="dim">{t('engineering.matrixHint')}</p><div className="deploy-actions"><span>{t('engineering.source')}</span><Pager page={sourceAt} total={sources.length} size={20} set={setMatrixPage} /><span>{t('engineering.target')}</span><Pager page={targetAt} total={targets.length} size={20} set={setTargetPage} /></div><div className="deploy-scroll"><table className="deploy-matrix"><thead><tr><th>{t('engineering.source')} → {t('engineering.target')}</th>{targets.slice(targetAt * 20, targetAt * 20 + 20).map(x => <th key={`${x.e.id}/${x.port.id}`}>{portName(x.e, x.port)}</th>)}</tr></thead><tbody>{sources.slice(sourceAt * 20, sourceAt * 20 + 20).map(a => <tr key={`${a.e.id}/${a.port.id}`}><th>{portName(a.e, a.port)}</th>{targets.slice(targetAt * 20, targetAt * 20 + 20).map(b => {
    const l = Object.values(p.links).find(x => x.source.equipmentId === a.e.id && x.source.portId === a.port.id && x.target.equipmentId === b.e.id && x.target.portId === b.port.id)
    const label = `${portName(a.e, a.port)} → ${portName(b.e, b.port)}`
    return <td key={`${b.e.id}/${b.port.id}`}><button className={`matrix-cross ${l ? 'active' : ''}`} aria-label={label} aria-pressed={!!l} title={l?.label ?? label} disabled={!edit.link(a.port,b.port) || (a.e.id === b.e.id && a.port.id === b.port.id)} onClick={() => {
      const store = useProject.getState()
      if (l) { store.remove([], [l.id]); return }
      const id = store.connect({ equipmentId: a.e.id, portId: a.port.id }, { equipmentId: b.e.id, portId: b.port.id })
      const next = useProject.getState().project
      if (id && next.links[id]) { useUi.getState().select([], [id]); if (checkLink(next, next.links[id]).some(i => i.severity !== 'info')) useUi.getState().setLinkCheck(id) }
    }}>{l ? '●' : '·'}</button></td>
  })}</tr>)}</tbody></table></div></>}</section>
}

export function ListsView() {
  const { t } = useTranslation()
  const edit = useEditing()
  return <section className="deployment-view"><Header name="pages.lists" hint="xlsx.patchHint" /><p>{t('xlsx.snapshot')}</p><p>{t('xlsx.unknown')}</p><button className="btn" disabled={!edit.common} onClick={() => void startPatchImport(t)}>{t('xlsx.importMenu')}</button></section>
}

function CommunicationLinks({ sync }: { sync: boolean }) {
  const { t } = useTranslation(), p = useProject(s => s.project), edit = useEditing(), [source, setSource] = useState(''), [target, setTarget] = useState('')
  const ports = communicationPorts(p,sync).filter(x => !sync || x.port.signal === 'sync' || x.port.clock)
  const key = (e: Equipment, port: PortDef) => JSON.stringify([e.id,port.id])
  const a = ports.find(x => key(x.e,x.port) === source && x.port.direction !== 'in'), b = ports.find(x => key(x.e,x.port) === target && x.port.direction !== 'out')
  const refs = new Set(ports.map(x => key(x.e,x.port)))
  const links = useRows(Object.values(p.links).filter(l => refs.has(JSON.stringify([l.source.equipmentId,l.source.portId])) || refs.has(JSON.stringify([l.target.equipmentId,l.target.portId]))))
  return <><h3>{t('engineering.connections')}</h3><div className="deploy-actions">{(['source','target'] as const).map((side,i) => <label key={side}>{t(`engineering.${side}`)}<select aria-label={`${t('engineering.connections')} ${t(`engineering.${side}`)}`} value={side === 'source' ? source : target} onChange={e => (side === 'source' ? setSource : setTarget)(e.target.value)}><option value="">{t('engineering.unassigned')}</option>{ports.filter(x => x.port.direction !== (i ? 'out' : 'in')).map(x => <option value={key(x.e,x.port)} key={key(x.e,x.port)}>{portName(x.e,x.port)}</option>)}</select></label>)}<button className="btn" disabled={!a || !b || source === target || !edit.link(a.port,b.port)} onClick={() => {
    if (!a || !b) return
    const id = useProject.getState().connect({equipmentId:a.e.id,portId:a.port.id},{equipmentId:b.e.id,portId:b.port.id}), next = useProject.getState().project
    if (id && next.links[id]) { useUi.getState().select([],[id]); if (checkLink(next,next.links[id]).some(i => i.severity !== 'info')) useUi.getState().setLinkCheck(id) }
  }}>{t('engineering.connect')}</button></div><div className="deploy-scroll"><table><thead><tr>{['link','source','target'].map(k => <th key={k}>{t(`engineering.${k}`)}</th>)}</tr></thead><tbody>{links.rows.map(l => { const a = p.equipment[l.source.equipmentId], b = p.equipment[l.target.equipmentId]; return <tr key={l.id}><td><button className="text-btn" onClick={() => useUi.getState().select([],[l.id])}>{l.label}</button></td><td>{a?.name} / {a?.ports.find(x => x.id === l.source.portId)?.name}</td><td>{b?.name} / {b?.ports.find(x => x.id === l.target.portId)?.name}</td></tr> })}</tbody></table></div>{links.pager}</>
}
