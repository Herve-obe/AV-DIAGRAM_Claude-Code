import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { create } from 'zustand'
import { LIBRARY } from '../library'
import { DOMAIN_FAMILIES } from '../library/domains'
import { pickFile } from '../io/pickFile'
import { readXlsx } from '../io/xlsxRead'
import type { WorkbookRead } from '../io/xlsx'
import { notifyError } from '../io/files'
import { catalogueColumns, catalogueCsv, catalogueEntries, catalogueTemplate } from '../model/catalogueImport'
import type { EquipmentFamily } from '../model/types'
import { useLibrary } from '../store/libraryStore'
import { Icon } from './Icon'

const state = create<{ file: string; data: WorkbookRead | null; busy: boolean }>(() => ({ file: '', data: null, busy: false }))
let serial = 0
const close = () => { serial++; state.setState({ file: '', data: null, busy: false }) }
export async function startCatalogueImport(t: (key: string) => string) {
  if (state.getState().busy) return
  const token = ++serial
  state.setState({ busy: true, data: null, file: '' })
  try {
    const file = await pickFile(['csv', 'xlsx'])
    if (token !== serial) return
    if (!file) { close(); return }
    state.setState({ file: file.name })
    let data: WorkbookRead
    if (/\.xlsx$/i.test(file.name)) data = await readXlsx(file.data)
    else {
      let text: string
      try { text = new TextDecoder('utf-8', { fatal: true }).decode(file.data) }
      catch { text = new TextDecoder('windows-1252').decode(file.data) }
      data = { sheets: [catalogueCsv(text)] }
    }
    if (!data.sheets.length || !data.sheets[0].rows.length) throw new Error('invalid')
    if (token === serial) state.setState({ data, busy: false })
  } catch (e) {
    if (token !== serial) return
    close(); await notifyError(t('catalogue.errors.' + (e instanceof Error && e.message === 'large' ? 'large' : 'invalid')))
  }
}

const FAMILIES = [...new Set(Object.values(DOMAIN_FAMILIES).flat())].filter(f => f !== 'module')
export function CatalogueImportDialog() {
  const { t } = useTranslation()
  const { file, data, busy } = state()
  const userTemplates = useLibrary(s => s.userTemplates)
  const [sheet, setSheet] = useState(0)
  const [columns, setColumns] = useState({ model: 0, manufacturer: -1 })
  const [family, setFamily] = useState<EquipmentFamily>('passive')
  const [overrides, setOverrides] = useState<Record<number, EquipmentFamily>>({})
  const [excluded, setExcluded] = useState<number[]>([])
  const [ack, setAck] = useState(false)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [page, setPage] = useState(0)
  const ref = useRef<HTMLElement>(null)
  const open = busy || !!data
  const table = data?.sheets[sheet]
  const clear = () => { setExcluded([]); setOverrides({}); setAck(false); setDone(null); setError(''); setPage(0) }
  useEffect(() => { if (data) { setSheet(0); setColumns(catalogueColumns(data.sheets[0].rows[0] ?? [])); clear() } }, [data])
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    ref.current?.querySelector<HTMLButtonElement>('button')?.focus()
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !ref.current?.getAttribute('aria-busy')) close()
      if (e.key !== 'Tab') return
      const controls = Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled), select:not(:disabled), input:not(:disabled)') ?? [])
      const first = controls[0], last = controls.at(-1)
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus() }
      if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus() }
    }
    window.addEventListener('keydown', key)
    return () => { window.removeEventListener('keydown', key); previous?.focus() }
  }, [open])
  const parsed = useMemo(() => table ? catalogueEntries(table, columns, [...userTemplates, ...LIBRARY], family) : { entries: [], problems: [] }, [table, columns, userTemplates, family])
  const selected = parsed.entries.filter(e => !excluded.includes(e.row))
  const pending = selected.filter(e => !e.template || e.template.portStatus === 'pending').length
  const apply = async () => {
    if (saving || busy || !selected.length || parsed.problems.length || pending && !ack) return
    setSaving(true); setError(''); state.setState({ busy: true })
    try {
      const count = await useLibrary.getState().importTemplates(selected.map(e => catalogueTemplate({ ...e, family: overrides[e.row] ?? e.family })))
      setDone(count)
    } catch { setError(t('catalogue.errors.save')) }
    finally { setSaving(false); state.setState({ busy: false }) }
  }
  if (!open) return null
  const familyPicker = (value: EquipmentFamily, change: (f: EquipmentFamily) => void, label: string) => <select aria-label={label} value={value} disabled={saving} onChange={e => change(e.target.value as EquipmentFamily)}>{FAMILIES.map(f => <option value={f} key={f}>{t('family.' + f)}</option>)}</select>
  return <div className="overlay"><section className="dialog catalogue-dialog" role="dialog" aria-modal="true" aria-labelledby="catalogue-title" aria-busy={saving || undefined} ref={ref}>
    <header className="dialog-head"><h2 id="catalogue-title">{t('catalogue.title')}</h2><button className="icon-btn" disabled={saving} aria-label={t('settings.close')} onClick={close}><Icon name="close" /></button></header>
    <div className="dialog-body">
      <p className="dialog-hint">{t('catalogue.hint')}</p>
      {busy && <p role="status">{t(saving ? 'catalogue.saving' : 'xlsx.reading')}</p>}
      {!!file && <p className="mono">{file}</p>}
      {error && <p role="alert">{error}</p>}
      {done !== null ? <p role="status">{t('catalogue.done', { count: done })}</p> : table && <>
        <div className="field-grid">
          <label className="field">{t('xlsx.sheet')}<select disabled={saving} value={sheet} onChange={e => { const i = Number(e.target.value); setSheet(i); setColumns(catalogueColumns(data!.sheets[i].rows[0] ?? [])); clear() }}>{data!.sheets.map((s, i) => <option key={i} value={i}>{s.name}</option>)}</select></label>
          {(['model', 'manufacturer'] as const).map(k => <label className="field" key={k}>{t('catalogue.' + k)}<select disabled={saving} value={columns[k]} onChange={e => { setColumns({ ...columns, [k]: Number(e.target.value) }); clear() }}>
            {k === 'manufacturer' && <option value={-1}>{t('catalogue.noColumn')}</option>}
            {table.rows[0].map((v, i) => <option value={i} key={i}>{typeof v === 'string' || typeof v === 'number' ? String(v) : t('catalogue.column', { n: i + 1 })}</option>)}
          </select></label>)}
          <label className="field">{t('catalogue.defaultFamily')}{familyPicker(family, f => { setFamily(f); clear() }, t('catalogue.defaultFamily'))}</label>
        </div>
        <p>{t('catalogue.summary', { count: selected.length, pending })}</p>
        {!!parsed.problems.length && <p role="alert">{t('catalogue.badRows', { rows: parsed.problems.slice(0, 30).join(', ') })}</p>}
        <div className="patch-preview"><table><thead><tr><th>{t('catalogue.include')}</th><th>{t('catalogue.manufacturer')}</th><th>{t('catalogue.model')}</th><th>{t('catalogue.family')}</th><th>{t('catalogue.sheetStatus')}</th></tr></thead><tbody>
          {parsed.entries.slice(page * 100, (page + 1) * 100).map(e => <tr key={e.row}>
            <td><input type="checkbox" disabled={saving} checked={!excluded.includes(e.row)} aria-label={t('catalogue.includeName', { name: e.model })} onChange={() => { setExcluded(excluded.includes(e.row) ? excluded.filter(n => n !== e.row) : [...excluded, e.row]); setAck(false) }} /></td>
            <td>{e.manufacturer}</td><td>{e.model}</td><td>{e.template ? t('family.' + e.family) : familyPicker(overrides[e.row] ?? e.family, f => setOverrides({ ...overrides, [e.row]: f }), t('catalogue.familyName', { name: e.model }))}</td>
            <td>{t(e.template ? e.template.portStatus === 'pending' ? 'catalogue.pending' : 'catalogue.matched' : 'catalogue.pending')}</td>
          </tr>)}
        </tbody></table></div>
        {parsed.entries.length > 100 && <div className="dialog-actions"><button className="btn" disabled={!page || saving} onClick={() => setPage(page - 1)}>{t('catalogue.previous')}</button><span>{page + 1} / {Math.ceil(parsed.entries.length / 100)}</span><button className="btn" disabled={(page + 1) * 100 >= parsed.entries.length || saving} onClick={() => setPage(page + 1)}>{t('catalogue.next')}</button></div>}
        {!!pending && <label className="catalogue-accept"><input type="checkbox" disabled={saving} checked={ack} onChange={e => setAck(e.target.checked)} />{t('catalogue.acceptPending')}</label>}
      </>}
    </div>
    <footer className="dialog-foot"><button className="btn" disabled={saving} onClick={close}>{t(done === null ? 'cad.cancel' : 'settings.close')}</button>{done === null && <button className="btn btn-primary" disabled={saving || busy || !selected.length || !!parsed.problems.length || !!pending && !ack} onClick={() => void apply()}>{t('catalogue.apply')}</button>}</footer>
  </section></div>
}
