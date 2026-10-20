import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { create } from 'zustand'
import { useEditing } from '../collab/useEditing'
import { CAD_UNITS, cadPage, type CadImport } from '../io/cad'
import { readCad } from '../io/cadRead'
import { notifyError } from '../io/files'
import { cadText, pickFile } from '../io/pickFile'
import { addSheet } from '../model/project'
import { updateFloorPlan } from '../model/floorPlan'
import { useProject } from '../store/projectStore'
import { useUi } from '../store/uiStore'
import { openCadSynoptic } from './PdfImportDialog'
import { Icon } from './Icon'

interface State { file: { name: string; text: string } | null; projectId: string; sheetId: string; unit: string; result: CadImport | null; busy: boolean; error: string; mode: 'background' | 'synoptic' }
const state = create<State>(() => ({ file: null, projectId: '', sheetId: '', unit: '', result: null, busy: false, error: '', mode: 'background' }))
let generation = 0
const close = () => { generation++; state.setState({ file: null, result: null, busy: false }) }
async function analyse(unit: string) {
  const { file } = state.getState(); if (!file || !unit) return
  const token = ++generation
  state.setState({ unit, busy: true, result: null, error: '' })
  try { const result = await readCad(file.text, file.name, Number(unit)); if (generation === token) state.setState({ result, busy: false }) }
  catch (e) { if (generation === token) state.setState({ busy: false, error: e instanceof Error ? e.message : 'invalid' }) }
}
export async function startCadImport(t: (k: string) => string, mode?: 'background' | 'synoptic') {
  const projectId = useProject.getState().project.id, sheetId = useUi.getState().currentSheetId
  try {
    const file = await pickFile(['dxf', 'dwg']); if (!file) return
    if (/\.dwg$/i.test(file.name)) throw new Error('binary')
    const text = cadText(file.data)
    if (useProject.getState().project.id !== projectId) return
    const code = Number(/\$INSUNITS\s+70\s+(\d+)/.exec(text)?.[1] ?? 0)
    const unit = CAD_UNITS.some(u => u.code === code) ? String(code) : ''
    state.setState({ file: { name: file.name, text }, projectId, sheetId, unit, result: null, busy: false, error: '', mode: mode ?? (useUi.getState().view === 'plan' ? 'background' : 'synoptic') })
    if (unit) void analyse(unit)
  } catch (e) { const code = e instanceof Error ? e.message : 'invalid'; await notifyError(t(`cad.errors.${['large', 'binary', 'encoding'].includes(code) ? code : 'invalid'}`)) }
}

export function CadImportDialog() {
  const { t } = useTranslation()
  const s = state()
  const editing = useEditing()
  const project = useProject(p => p.project)
  const [target, setTarget] = useState('new')
  useEffect(() => { if (s.file && project.id !== s.projectId) close() }, [project.id, s.file, s.projectId])
  useEffect(() => {
    if (!s.file) return
    setTarget('new')
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key)
  }, [s.file])
  if (!s.file) return null
  const d = s.result?.drawing
  const apply = () => {
    if (!s.result || !editing.common || useProject.getState().project.id !== s.projectId) return
    if (s.mode === 'synoptic') { openCadSynoptic(s.file!.name, s.result.drawing, cadPage(s.result)); close(); return }
    let p = useProject.getState().project, id = s.sheetId
    if (target === 'new') { const added = addSheet(p, s.file!.name.replace(/\.dxf$/i, '').slice(0, 80)); p = added.project; id = added.id }
    if (!p.sheets?.some(sh => sh.id === id)) return
    p = updateFloorPlan(p, id, { width: s.result.drawing.width, height: s.result.drawing.height, background: s.result.drawing, hiddenLayers: s.result.hiddenLayers })
    useProject.getState().replaceProject(p); useUi.getState().setSheet(id); useUi.getState().setView('plan'); close()
  }
  return <div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget) close() }}><section className="dialog cad-dialog" role="dialog" aria-modal="true" aria-labelledby="cad-title">
    <header className="dialog-head"><h2 id="cad-title">{t('cad.title', { name: s.file.name })}</h2><button className="icon-btn" aria-label={t('settings.close')} onClick={close}><Icon name="close" /></button></header>
    <div className="dialog-body">
      <div className="segmented"><button aria-pressed={s.mode === 'background'} onClick={() => state.setState({ mode: 'background' })}>{t('cad.background')}</button><button aria-pressed={s.mode === 'synoptic'} onClick={() => state.setState({ mode: 'synoptic' })}>{t('cad.synoptic')}</button></div>
      <p>{t('cad.hint')}</p>
      <div className="field-row"><div className="field"><label htmlFor="cad-unit">{t('cad.unit')}</label><select id="cad-unit" value={s.unit} disabled={s.busy} onChange={e => { state.setState({ unit: e.target.value, result: null }); if (e.target.value) void analyse(e.target.value) }}><option value="">{t('cad.chooseUnit')}</option>{CAD_UNITS.map(u => <option key={u.code} value={u.code}>{u.name}</option>)}</select></div><span className="dim">{s.busy ? t('cad.reading') : d ? `${d.width.toLocaleString(undefined, { maximumFractionDigits: 3 })} × ${d.height.toLocaleString(undefined, { maximumFractionDigits: 3 })} m` : t('cad.unitsRequired')}</span></div>
      {s.error && <p role="alert" className="error-text">{t(`cad.errors.${['large', 'binary', 'encoding', 'units', 'recursive', 'empty', 'timeout'].includes(s.error) ? s.error : 'invalid'}`)}</p>}
      {s.result && <>
        <svg className="cad-background-preview" viewBox={`0 0 ${d!.width} ${d!.height}`} aria-label={t('cad.preview')}><g fill="none" stroke="#566274" strokeWidth={Math.max(d!.width, d!.height) / 1000}>{d!.paths.map((p, i) => <path key={i} d={`${p.points.map((pt, n) => `${n ? 'L' : 'M'}${pt.x},${pt.y}`).join(' ')}${p.closed ? 'Z' : ''}`} />)}</g>{d!.texts.map((p, i) => <text key={i} x={p.x} y={p.y} fontSize={p.height} fill="#333" transform={`rotate(${p.angle},${p.x},${p.y})`}>{p.text}</text>)}</svg>
        {s.result.curves > 0 && <p className="dialog-hint">{t('cad.curves', { count: s.result.curves })}</p>}
        {!!Object.keys(s.result.skipped).length && <p className="rack-warning" role="status">{t('cad.skipped', { types: Object.entries(s.result.skipped).map(([type, n]) => `${type} (${n})`).join(', ') })}</p>}
        {s.mode === 'background' && <div className="field"><label htmlFor="cad-target">{t('cad.target')}</label><select id="cad-target" value={target} onChange={e => setTarget(e.target.value)}><option value="new">{t('cad.newSheet')}</option><option value="current">{t('cad.currentSheet')}</option></select>{target === 'current' && <p className="dialog-hint">{t('cad.replaceHint')}</p>}</div>}
      </>}
      {!editing.common && <p role="status">{t('cad.hostOnly')}</p>}
    </div><footer className="dialog-foot"><button className="btn" onClick={close}>{t('cad.cancel')}</button><button className="btn btn-primary" disabled={!s.result || s.busy || !editing.common} onClick={apply}>{t(s.mode === 'background' ? 'cad.applyBackground' : 'cad.reviewSynoptic')}</button></footer>
  </section></div>
}
