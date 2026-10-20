import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { create } from 'zustand'
import { useEditing } from '../collab/useEditing'
import { pickFile } from '../io/pickFile'
import { notifyError } from '../io/files'
import { readXlsx } from '../io/xlsxRead'
import type { WorkbookRead } from '../io/xlsx'
import { buildPatch, patchRows } from '../model/patchImport'
import { useProject } from '../store/projectStore'
import { useUi } from '../store/uiStore'
import { Icon } from './Icon'
import { translateParams } from './Inspector'

const state = create<{ file: string; data: WorkbookRead | null; projectId: string; busy: boolean }>(() => ({ file: '', data: null, projectId: '', busy: false }))
let serial = 0
const close = () => { serial++; state.setState({ file: '', data: null, busy: false }) }
export async function startPatchImport(t: (k: string) => string) {
  const projectId = useProject.getState().project.id
  try {
    const file = await pickFile(['xlsx']); if (!file || useProject.getState().project.id !== projectId) return
    const token = ++serial
    state.setState({ file: file.name, projectId, data: null, busy: true })
    const data = await readXlsx(file.data)
    if (token === serial) state.setState({ data, busy: false })
  } catch (e) { close(); const key = e instanceof Error ? e.message : 'invalid'; await notifyError(t(`xlsx.errors.${['large', 'encrypted', 'timeout'].includes(key) ? key : 'invalid'}`)) }
}

export function PatchImportDialog() {
  const { t } = useTranslation()
  const { file, data, projectId, busy } = state()
  const project = useProject(s => s.project)
  const editing = useEditing()
  const [index, setIndex] = useState(0)
  const [acknowledged, setAcknowledged] = useState(false)
  useEffect(() => { if (file && project.id !== projectId) close() }, [file, project.id, projectId])
  useEffect(() => { if (data) { const found = data.sheets.findIndex(s => s.name.toLowerCase() === 'patch'); setIndex(found >= 0 ? found : 0) } setAcknowledged(false) }, [data])
  useEffect(() => {
    if (!file) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey)
  }, [file])
  const table = data?.sheets[index]
  const parsed = useMemo(() => table ? patchRows(table) : { rows: [], problems: [] }, [table])
  const candidate = useMemo(() => buildPatch(project, parsed.rows), [project, parsed])
  const problems = [...parsed.problems, ...candidate.problems]
  useEffect(() => setAcknowledged(false), [table, project])
  if (!file) return null
  const apply = () => {
    const current = useProject.getState().project
    if (!editing.common || current.id !== projectId || parsed.problems.length || !candidate.changed) return
    const latest = buildPatch(current, parsed.rows)
    if (latest.problems.length || (!acknowledged && latest.warnings.length)) return
    useProject.getState().replaceProject(latest.project)
    if (useProject.getState().project === current) return
    useUi.getState().select([], latest.links.map(l => l.id)); close()
  }
  return <div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget) close() }}><section className="dialog patch-dialog" role="dialog" aria-modal="true" aria-labelledby="patch-title">
    <header className="dialog-head"><h2 id="patch-title">{t('xlsx.importTitle', { name: file })}</h2><button className="icon-btn" aria-label={t('settings.close')} onClick={close}><Icon name="close" /></button></header>
    <div className="dialog-body">
      <p>{t('xlsx.importHint')}</p>
      {busy && <p role="status">{t('xlsx.reading')}</p>}
      {data && <><div className="field"><label htmlFor="patch-sheet">{t('xlsx.sheet')}</label><select id="patch-sheet" value={index} onChange={e => setIndex(Number(e.target.value))}>{data.sheets.map((s, i) => <option key={i} value={i}>{s.name}</option>)}</select></div>
        <p>{t('xlsx.summary', { rows: parsed.rows.length, changed: candidate.changed, errors: problems.length })}</p>
        {!!problems.length && <ul className="patch-problems" role="alert">{problems.slice(0, 100).map((p, i) => <li key={i}>{p.row ? `${t('xlsx.row', { row: p.row })} : ` : ''}{t(`xlsx.problems.${p.code}`)}{p.code === 'rule' ? ` ${t(`rules.${p.value}.msg`, translateParams(p.params ?? {},t))}` : p.value ? ` (${p.code === 'number' ? t(`xlsx.columns.${p.value}`) : p.value})` : ''}</li>)}</ul>}
        <div className="patch-preview"><table><thead><tr>{['sourceEquipment', 'sourcePort', 'targetEquipment', 'targetPort', 'lengthM'].map(k => <th key={k}>{t(`xlsx.columns.${k}`)}</th>)}</tr></thead><tbody>{candidate.links.slice(0, 200).map(l => <tr key={l.id}><td>{candidate.project.equipment[l.source.equipmentId]?.name ?? project.equipment[l.source.equipmentId]?.name}</td><td>{project.equipment[l.source.equipmentId]?.ports.find(q => q.id === l.source.portId)?.name}</td><td>{project.equipment[l.target.equipmentId]?.name}</td><td>{project.equipment[l.target.equipmentId]?.ports.find(q => q.id === l.target.portId)?.name}</td><td>{l.lengthM ?? '—'}</td></tr>)}</tbody></table></div>
        {candidate.links.length > 200 && <p className="dim">{t('xlsx.previewLimit')}</p>}
        {!!candidate.warnings.length && <><ul className="rack-warning">{candidate.warnings.slice(0, 30).map((w, i) => <li key={i}>{t(`rules.${w.code}.msg`, translateParams(w.params,t))}</li>)}</ul><label><input type="checkbox" checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)} />{t('xlsx.acceptWarnings')}</label></>}
        {!parsed.rows.length && !parsed.problems.length && <p>{t('xlsx.empty')}</p>}
      </>}
      {!editing.common && <p>{t('cad.hostOnly')}</p>}
    </div><footer className="dialog-foot"><button className="btn" onClick={close}>{t('cad.cancel')}</button><button className="btn btn-primary" onClick={apply} disabled={busy || !data || !editing.common || !!problems.length || !candidate.changed || (!!candidate.warnings.length && !acknowledged)}>{t('xlsx.apply')}</button></footer>
  </section></div>
}
