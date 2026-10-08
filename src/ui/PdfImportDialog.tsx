// Import d'un synoptique PDF venu d'un autre logiciel : le document est lu sur ce poste (pdf.js),
// interprété (cadres -> équipements, traits -> liaisons), puis montré avec ce qui a été reconnu
// avant d'être ajouté au projet sur une nouvelle feuille. Ce qui est déduit est signalé.
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { create } from 'zustand'
import { isTauri } from '@tauri-apps/api/core'
import { notifyError } from '../io/files'
import { buildImport, defaultChoices, type ImportChoices } from '../io/pdfImport/build'
import { extractPdf } from '../io/pdfImport/extract'
import { interpretPage, type Evidence, type PageInterpretation } from '../io/pdfImport/interpret'
import { LIBRARY, LIBRARY_INDEX } from '../library'
import { SIGNAL_FAMILIES } from '../model/signals'
import type { EquipmentFamily } from '../model/types'
import { useProject } from '../store/projectStore'
import { useUi } from '../store/uiStore'
import { Icon } from './Icon'

const FAMILIES: EquipmentFamily[] = [
  'capture', 'wireless', 'console', 'stagebox', 'processing', 'amplification', 'speaker', 'recording', 'intercom',
  'camera', 'videoSwitcher', 'videoRouting', 'display', 'network', 'sync', 'control', 'power', 'passive',
  'luminaire', 'lightingControl', 'dmxDistribution',
]

interface PdfImportState {
  name: string
  data: Uint8Array | null
  pages: PageInterpretation[]
  page: number
  choices: ImportChoices[]
  close: () => void
}

const usePdfImport = create<PdfImportState>((set) => ({
  name: '',
  data: null,
  pages: [],
  page: 0,
  choices: [],
  close: () => set({ data: null, pages: [], choices: [] }),
}))

async function loadPdfjs() {
  const pdfjs = await import('pdfjs-dist')
  const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default
  return pdfjs
}

async function pickPdf(): Promise<{ name: string; data: Uint8Array } | null> {
  if (isTauri()) {
    const { open } = await import('@tauri-apps/plugin-dialog')
    const { readFile } = await import('@tauri-apps/plugin-fs')
    const path = await open({ multiple: false, directory: false, filters: [{ name: 'PDF', extensions: ['pdf'] }] })
    if (!path) return null
    return { name: path.split(/[\\/]/).pop() ?? 'import.pdf', data: await readFile(path) }
  }
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.pdf,application/pdf'
    input.onchange = async () => {
      const file = input.files?.[0]
      resolve(file ? { name: file.name, data: new Uint8Array(await file.arrayBuffer()) } : null)
    }
    input.click()
  })
}

/** Choisit un PDF, le lit et l'interprète, puis ouvre la fenêtre de vérification. */
export async function startPdfImport(t: (k: string) => string) {
  try {
    const file = await pickPdf()
    if (!file) return
    const pdfjs = await loadPdfjs()
    // pdf.js transfère le tableau au fil de lecture : on garde une copie pour l'aperçu
    const raw = await extractPdf(pdfjs, file.data.slice())
    const pages = raw.map((p) => interpretPage(p, LIBRARY))
    // Page de départ : celle où le plus de liaisons ont été reconnues
    const page = pages.reduce((best, p, i) => (p.links.length > pages[best].links.length ? i : best), 0)
    usePdfImport.setState({ name: file.name, data: file.data, pages, page, choices: pages.map((p) => defaultChoices(p, file.name)) })
  } catch {
    notifyError(t('pdfImport.readError'))
  }
}

const EVIDENCE_CLASS: Record<Evidence, string> = { document: 'ev-doc', keyword: 'ev-key', color: 'ev-color', side: 'ev-side', default: 'ev-default' }

function Preview({ data, page, r, choices, hover }: { data: Uint8Array; page: number; r: PageInterpretation; choices: ImportChoices; hover: string | null }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const width = 560
  const scale = width / r.width
  useEffect(() => {
    let cancelled = false
    let destroy: (() => void) | null = null
    void (async () => {
      const pdfjs = await loadPdfjs()
      const doc = await pdfjs.getDocument({ data: data.slice(), isEvalSupported: false }).promise
      destroy = () => void doc.destroy()
      if (cancelled) return destroy()
      const p = await doc.getPage(page)
      const vp = p.getViewport({ scale: scale * window.devicePixelRatio })
      const c = canvas.current
      if (!c || cancelled) return
      c.width = vp.width
      c.height = vp.height
      await p.render({ canvasContext: c.getContext('2d')!, viewport: vp }).promise
    })()
    return () => {
      cancelled = true
      destroy?.()
    }
  }, [data, page, scale])
  const h = r.height * scale
  return (
    <div className="pdf-preview" style={{ width, height: h }}>
      <canvas ref={canvas} style={{ width, height: h }} />
      <svg width={width} height={h} viewBox={`0 0 ${r.width} ${r.height}`}>
        {r.links.map((l) => {
          const on = choices.links[l.key]?.include
          return (
            <g key={l.key} className={`pdf-ov-link${on ? '' : ' is-off'}${hover === l.key ? ' is-hover' : ''}`}>
              {l.points.map((_, i) => i % 2 === 0 && (
                <line key={i} x1={l.points[i][0]} y1={l.points[i][1]} x2={l.points[i + 1][0]} y2={l.points[i + 1][1]} />
              ))}
            </g>
          )
        })}
        {r.equipment.map((e) => (
          <rect
            key={e.key}
            className={`pdf-ov-eq${choices.equipment[e.key]?.include ? '' : ' is-off'}${hover === e.key ? ' is-hover' : ''}`}
            x={e.box.x - 2} y={e.box.y - 2} width={e.box.w + 4} height={e.box.h + 4} rx={3}
          />
        ))}
      </svg>
    </div>
  )
}

export function PdfImportDialog() {
  const { t } = useTranslation()
  const { name, data, pages, page, choices, close } = usePdfImport()
  const [tab, setTab] = useState<'equipment' | 'links' | 'text'>('equipment')
  const [hover, setHover] = useState<string | null>(null)
  const r = pages[page]
  const c = choices[page]

  useEffect(() => {
    if (!data) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [data, close])

  const eqName = useMemo(() => new Map(r?.equipment.map((e) => [e.key, e]) ?? []), [r])
  if (!data || !r || !c) return null

  const update = (fn: (c: ImportChoices) => ImportChoices) =>
    usePdfImport.setState((s) => ({ choices: s.choices.map((x, i) => (i === s.page ? fn(x) : x)) }))
  const setEq = (key: string, patch: Partial<ImportChoices['equipment'][string]>) =>
    update((x) => ({ ...x, equipment: { ...x.equipment, [key]: { ...x.equipment[key], ...patch } } }))
  const setLink = (key: string, patch: Partial<ImportChoices['links'][string]>) =>
    update((x) => ({ ...x, links: { ...x.links, [key]: { ...x.links[key], ...patch } } }))

  const keptEq = r.equipment.filter((e) => c.equipment[e.key]?.include)
  const keptLinks = r.links.filter((l) => c.links[l.key]?.include && c.equipment[l.from.eq]?.include && c.equipment[l.to.eq]?.include)
  const toCheck = r.links.filter((l) => l.signalFrom === 'default').length
  const portLabel = (eqKey: string, portKey: string) => {
    const e = eqName.get(eqKey)
    const p = e?.ports.find((x) => x.key === portKey)
    return `${c.equipment[eqKey]?.name ?? e?.name} · ${p?.name ?? '?'}`
  }

  const apply = () => {
    const out = buildImport(useProject.getState().project, r, c, LIBRARY_INDEX)
    useProject.getState().replaceProject(out.project)
    useUi.getState().setSheet(out.sheetId)
    close()
  }

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="dialog pdf-dialog" role="dialog" aria-modal="true" aria-labelledby="pdf-title">
        <header className="dialog-head">
          <h2 id="pdf-title">{t('pdfImport.title', { name })}</h2>
          <button className="icon-btn" onClick={close} aria-label={t('settings.close')}><Icon name="close" /></button>
        </header>
        <div className="dialog-body pdf-body">
          {pages.length > 1 && (
            <div className="pdf-pages">
              {pages.map((p, i) => (
                <button key={p.page} className="chip" aria-pressed={i === page} onClick={() => usePdfImport.setState({ page: i })}>
                  {t('pdfImport.page', { n: p.page })} ({p.equipment.length} / {p.links.length})
                </button>
              ))}
            </div>
          )}
          {r.kind !== 'vector' ? (
            <p className="dialog-hint pdf-raster">
              <Icon name="alert" size={14} /> {t(r.kind === 'raster' ? 'pdfImport.raster' : 'pdfImport.empty')}
            </p>
          ) : (
            <div className="pdf-columns">
              <Preview data={data} page={r.page} r={r} choices={c} hover={hover} />
              <div className="pdf-lists">
                <p className="dialog-hint">{t('pdfImport.hint')}</p>
                <div className="segmented pdf-tabs" role="tablist">
                  <button role="tab" aria-pressed={tab === 'equipment'} onClick={() => setTab('equipment')}>{t('pdfImport.tabEquipment', { n: keptEq.length, total: r.equipment.length })}</button>
                  <button role="tab" aria-pressed={tab === 'links'} onClick={() => setTab('links')}>{t('pdfImport.tabLinks', { n: keptLinks.length, total: r.links.length })}</button>
                  <button role="tab" aria-pressed={tab === 'text'} onClick={() => setTab('text')}>{t('pdfImport.tabText', { n: r.looseText.length })}</button>
                </div>
                {tab === 'equipment' && (
                  <ul className="pdf-list">
                    {r.equipment.map((e) => {
                      const ch = c.equipment[e.key]
                      return (
                        <li key={e.key} onMouseEnter={() => setHover(e.key)} onMouseLeave={() => setHover(null)} className={ch.include ? '' : 'is-off'}>
                          <div className="pdf-row">
                            <input type="checkbox" checked={ch.include} onChange={(ev) => setEq(e.key, { include: ev.target.checked })} aria-label={t('pdfImport.include')} />
                            <input className="pdf-name" value={ch.name} onChange={(ev) => setEq(e.key, { name: ev.target.value })} aria-label={t('pdfImport.name')} />
                            <select value={ch.family} onChange={(ev) => setEq(e.key, { family: ev.target.value as EquipmentFamily })} aria-label={t('pdfImport.family')} disabled={ch.useTemplate && !!e.match}>
                              {FAMILIES.map((f) => <option key={f} value={f}>{t(`family.${f}`)}</option>)}
                            </select>
                          </div>
                          <div className="pdf-sub">
                            {e.model && <span>{e.model}</span>}
                            <span>{t('pdfImport.ports', { count: e.ports.length })}</span>
                            <span>{t('pdfImport.linksCount', { count: e.links })}</span>
                            {e.familyFrom !== 'document' && !e.match && <span className={EVIDENCE_CLASS[e.familyFrom]}>{t(`pdfImport.evidence.${e.familyFrom}`)}</span>}
                            {e.ports.some((p) => p.directionFrom === 'side') && <span className="ev-side">{t('pdfImport.directionBySide')}</span>}
                          </div>
                          {e.match && (
                            <label className="pdf-match">
                              <input type="checkbox" checked={ch.useTemplate} onChange={(ev) => setEq(e.key, { useTemplate: ev.target.checked })} />
                              <span>{t('pdfImport.useTemplate', { label: e.match.label })}</span>
                            </label>
                          )}
                          {e.links === 0 && <div className="pdf-sub ev-default">{t('pdfImport.noLinks')}</div>}
                        </li>
                      )
                    })}
                  </ul>
                )}
                {tab === 'links' && (
                  <>
                    {toCheck > 0 && <p className="dialog-hint ev-default">{t('pdfImport.signalsToCheck', { count: toCheck })}</p>}
                    <ul className="pdf-list">
                      {r.links.map((l) => {
                        const ch = c.links[l.key]
                        const ends = c.equipment[l.from.eq]?.include && c.equipment[l.to.eq]?.include
                        return (
                          <li key={l.key} onMouseEnter={() => setHover(l.key)} onMouseLeave={() => setHover(null)} className={ch.include && ends ? '' : 'is-off'}>
                            <div className="pdf-row">
                              <input type="checkbox" checked={ch.include} disabled={!ends} onChange={(ev) => setLink(l.key, { include: ev.target.checked })} aria-label={t('pdfImport.include')} />
                              <span className="pdf-link-ends">{portLabel(l.from.eq, l.from.port)} <span aria-hidden="true">→</span> {portLabel(l.to.eq, l.to.port)}</span>
                            </div>
                            <div className="pdf-sub">
                              <span className="pdf-swatch" style={{ background: l.color }} />
                              <select value={ch.signal} onChange={(ev) => setLink(l.key, { signal: ev.target.value as typeof ch.signal })} aria-label={t('pdfImport.signal')}>
                                {SIGNAL_FAMILIES.map((s) => <option key={s} value={s}>{t(`signal.${s}`)}</option>)}
                              </select>
                              {ch.signal === l.signal && <span className={EVIDENCE_CLASS[l.signalFrom]}>{t(`pdfImport.evidence.${l.signalFrom}`)}</span>}
                              {l.ref && <span className="mono">{l.ref}</span>}
                              {l.lengthM != null && <span>{l.lengthM} m</span>}
                              {l.note && <span>{l.note}</span>}
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                    {r.unresolved > 0 && <p className="dialog-hint">{t('pdfImport.unresolved', { count: r.unresolved })}</p>}
                  </>
                )}
                {tab === 'text' && (
                  <ul className="pdf-list pdf-text">
                    {r.looseText.length === 0 && <li>{t('pdfImport.noText')}</li>}
                    {r.looseText.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
        {r.kind === 'vector' && (
          <footer className="dialog-foot pdf-foot">
            <div className="field pdf-sheet">
              <label htmlFor="pdf-sheet">{t('pdfImport.sheet')}</label>
              <input id="pdf-sheet" value={c.sheetName} onChange={(e) => update((x) => ({ ...x, sheetName: e.target.value }))} />
            </div>
            <span className="dialog-hint">{t('pdfImport.summary', { eq: keptEq.length, links: keptLinks.length })}</span>
            <button className="btn" onClick={close}>{t('pdfImport.cancel')}</button>
            <button className="btn btn-primary" disabled={!keptEq.length || !c.sheetName.trim()} onClick={apply}>
              <Icon name="check" size={14} />{t('pdfImport.apply')}
            </button>
          </footer>
        )}
      </div>
    </div>
  )
}
