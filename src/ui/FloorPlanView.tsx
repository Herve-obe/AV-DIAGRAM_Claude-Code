import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useEditing } from '../collab/useEditing'
import { DND_MIME } from '../editor/Canvas'
import { equipmentInView } from '../model/layers'
import { isFloorPlan, isPlanPlacement, metresBetween, onPlan, placeOnPlan, planBounds, planOf, snapMetres } from '../model/floorPlan'
import type { Equipment, PlanPlacement } from '../model/types'
import { getTemplate } from '../store/libraryStore'
import { useProject } from '../store/projectStore'
import { useUi } from '../store/uiStore'
import { Field } from './Field'
import { Pictogram } from './Pictogram'
import { useExportPdf } from './ExportPdfDialog'
import { startCadImport } from './CadImportDialog'

type Point = { x: number; y: number }
export function PlanFields({ eq }: { eq: Equipment }) {
  const { t } = useTranslation()
  const editing = useEditing()
  const view = useUi(s => s.view)
  const [error, setError] = useState(false)
  const p = eq.plan
  if (!p && view !== 'plan') return null
  const set = (patch: Partial<PlanPlacement>) => { const next = { x: 0, y: 0, angle: 0, ...p, ...patch }; setError(!isPlanPlacement(next)); if (isPlanPlacement(next)) useProject.getState().placeOnPlan(eq.id,next) }
  const numeric = (key: keyof PlanPlacement, v: string) => {
    if (!v.trim() && (key === 'width' || key === 'depth')) return set({ [key]: undefined })
    const n = Number(v.replace(',', '.'))
    set({ [key]: n })
  }
  return <fieldset className="plan-fields" disabled={!editing.equipment(eq)}>
    <legend>{t('plan.title')}</legend>
    {error && <p role="alert">{t('engineering.invalid')}</p>}
    {p ? <>
      <div className="field-row"><Field id="plan-x" type="number" min={-1e6} label={t('plan.x')} value={p.x} onCommit={v => numeric('x', v)} /><Field id="plan-y" type="number" min={-1e6} label={t('plan.y')} value={p.y} onCommit={v => numeric('y', v)} /></div>
      <div className="field-row"><Field id="plan-width" type="number" label={t('plan.footprintWidth')} value={p.width} onCommit={v => numeric('width', v)} /><Field id="plan-depth" type="number" label={t('plan.footprintDepth')} value={p.depth} onCommit={v => numeric('depth', v)} /></div>
      <Field id="plan-angle" type="number" min={-1e6} label={t('plan.angle')} value={p.angle} onCommit={v => numeric('angle', v)} />
      {(!p.width || !p.depth) && <p className="source-note">{t('plan.unknownSize')}</p>}
      <button className="btn" onClick={() => useProject.getState().placeOnPlan(eq.id, undefined)}>{t('plan.unplace')}</button>
    </> : <button className="btn" onClick={() => set({})}>{t('plan.place')}</button>}
  </fieldset>
}

export function FloorPlanView() {
  const { t } = useTranslation()
  const project = useProject(s => s.project)
  const sheetId = useUi(s => s.currentSheetId)
  const layer = useUi(s => s.layer)
  const selection = useUi(s => s.selectedEquipment)
  const editing = useEditing()
  const plan = planOf(project, sheetId)
  const fit = () => { const b = planBounds(useProject.getState().project, sheetId); return { x: b.x - 1, y: b.y - 1, w: b.w + 2, h: b.h + 2 } }
  const [view, setView] = useState(fit)
  const [placing, setPlacing] = useState('')
  const [measuring, setMeasuring] = useState(false)
  const [measure, setMeasure] = useState<Point[]>([])
  const [preview, setPreview] = useState<{ id: string; position: Point } | null>(null)
  const [settingsError, setSettingsError] = useState(false)
  const gesture = useRef<{ id?: string; start: Point; position: Point; view: typeof view } | null>(null)
  const svg = useRef<SVGSVGElement>(null)
  const items = onPlan(project, sheetId).filter(e => equipmentInView(e, layer))
  const pending = Object.values(project.equipment).filter(e => e.sheetId === sheetId && !e.plan && equipmentInView(e, layer))
  const point = (x: number, y: number) => {
    const matrix = svg.current?.getScreenCTM()
    return matrix ? new DOMPoint(x, y).matrixTransform(matrix.inverse()) : { x: 0, y: 0 }
  }
  const snapped = (pt: Point): Point => ({ x: snapMetres(pt.x, plan.grid), y: snapMetres(pt.y, plan.grid) })
  const place = (id: string, pt: Point) => {
    const eq = useProject.getState().project.equipment[id]
    if (!eq || !editing.equipment(eq)) return
    useProject.getState().placeOnPlan(id, { angle: 0, ...eq.plan, ...snapped(pt) })
    useUi.getState().select([id], [])
  }
  const zoom = (factor: number) => setView(v => ({ x: v.x + v.w * (1 - factor) / 2, y: v.y + v.h * (1 - factor) / 2, w: Math.min(100000, Math.max(0.5, v.w * factor)), h: Math.min(100000, Math.max(0.5, v.h * factor)) }))
  const textSize = Math.max(0.12, view.w / 85)
  return <div className="plan-view">
    <div className="plan-toolbar" aria-label={t('plan.title')}>
      <fieldset disabled={!editing.common} className="plan-settings">
        {(['width', 'height', 'grid', 'scale'] as const).map(key => <Field key={key} id={`floor-${key}`} type="number" label={t(`plan.${key}`)} value={plan[key]} onCommit={v => { const n = Number(v.replace(',', '.')); const valid = !!v.trim() && isFloorPlan({...plan,[key]:n}); setSettingsError(!valid); if (valid) useProject.getState().updateFloorPlan(sheetId, { [key]: n }) }} />)}
      </fieldset>
      {settingsError && <span role="alert">{t('engineering.invalid')}</span>}
      <button className="btn" data-plan-fit onClick={() => setView(fit())}>{t('plan.fit')}</button>
      <button className="btn" aria-label={t('plan.zoomIn')} onClick={() => zoom(0.8)}>+</button>
      <button className="btn" aria-label={t('plan.zoomOut')} onClick={() => zoom(1.25)}>−</button>
      <button className="btn" aria-pressed={measuring} onClick={() => { setMeasuring(!measuring); setMeasure([]); setPlacing('') }}>{t('plan.measure')}</button>
      <button className="btn" onClick={() => useExportPdf.getState().setOpen(true)}>{t('plan.export')}</button>
      <button className="btn" disabled={!editing.common} onClick={() => startCadImport(t, 'background')}>{t('plan.background')}</button>
      {plan.background && <button className="btn" disabled={!editing.common} onClick={() => useProject.getState().updateFloorPlan(sheetId, { background: undefined, hiddenLayers: undefined })}>{t('plan.removeBackground')}</button>}
    </div>
    <div className="plan-toolbar">
      <label htmlFor="plan-pending">{t('plan.pending')}</label>
      <select id="plan-pending" value={pending.some(e => e.id === placing) ? placing : ''} onChange={e => { setPlacing(e.target.value); setMeasuring(false) }}><option value="">{t('plan.choose')}</option>{pending.map(e => <option key={e.id} value={e.id} disabled={!editing.equipment(e)}>{e.name}</option>)}</select>
      <button className="btn" disabled={!placing} onClick={() => { place(placing, { x: view.x + view.w / 2, y: view.y + view.h / 2 }); setPlacing('') }}>{t('plan.placeCenter')}</button>
      <span className="dim small">{placing ? t('plan.clickPlace') : t('plan.hint')}</span>
      {measure.length === 2 && <output>{t('plan.distance', { m: metresBetween(measure[0], measure[1]).toLocaleString(undefined, { maximumFractionDigits: 3 }) })}</output>}
    </div>
    {plan.background && <details className="plan-layers"><summary>{t('plan.layers', { name: plan.background.name })}</summary>{[...new Set([...plan.background.paths, ...plan.background.texts].map(e => e.layer))].map(name => <label key={name}><input type="checkbox" checked={!plan.hiddenLayers?.includes(name)} disabled={!editing.common} onChange={e => useProject.getState().updateFloorPlan(sheetId, { hiddenLayers: e.target.checked ? (plan.hiddenLayers ?? []).filter(l => l !== name) : [...(plan.hiddenLayers ?? []), name] })} />{name}</label>)}</details>}
    <svg ref={svg} className="plan-stage" role="application" aria-label={t('plan.canvas')} viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`} tabIndex={0}
      onDragOver={e => { if (e.dataTransfer.types.includes(DND_MIME)) e.preventDefault() }}
      onDrop={e => {
        e.preventDefault()
        const tpl = getTemplate(e.dataTransfer.getData(DND_MIME)); if (!tpl) return
        const pt = snapped(point(e.clientX, e.clientY))
        const existing = Object.values(project.equipment).filter(eq => eq.sheetId === sheetId)
        const id = useProject.getState().addEquipment(tpl, { x: existing.length ? Math.max(...existing.map(eq => eq.position.x)) + 320 : 0, y: 0 }, sheetId, { ...pt, angle: 0 })
        useUi.getState().select([id], [])
      }}
      onPointerDown={e => {
        if ((e.target as Element).closest('[data-plan-equipment]') || e.button !== 0) return
        const pt = point(e.clientX, e.clientY)
        if (placing) { place(placing, pt); setPlacing(''); return }
        if (measuring) { setMeasure(old => old.length === 1 ? [old[0], pt] : [pt]); return }
        gesture.current = { start: pt, position: { x: e.clientX, y: e.clientY }, view }; svg.current?.setPointerCapture(e.pointerId)
        useUi.getState().select([], [])
      }}
      onPointerMove={e => {
        const g = gesture.current; if (!g) return
        const pt = point(e.clientX, e.clientY)
        if (g.id) setPreview({ id: g.id, position: snapped({ x: g.position.x + pt.x - g.start.x, y: g.position.y + pt.y - g.start.y }) })
        else { const dx = (e.clientX - g.position.x) * g.view.w / (svg.current?.getBoundingClientRect().width || 1); const dy = (e.clientY - g.position.y) * g.view.w / (svg.current?.getBoundingClientRect().width || 1); setView({ ...g.view, x: g.view.x - dx, y: g.view.y - dy }) }
      }}
      onPointerUp={e => { const g = gesture.current; if (g?.id) { const pt = point(e.clientX, e.clientY); if (metresBetween(g.start, pt) > 0.001) place(g.id, { x: g.position.x + pt.x - g.start.x, y: g.position.y + pt.y - g.start.y }) } gesture.current = null; setPreview(null) }}
      onPointerCancel={() => { gesture.current = null; setPreview(null) }}
      onKeyDown={e => {
        if (e.key.toLowerCase() === 'f') { e.preventDefault(); e.stopPropagation(); setView(fit()); return }
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return
        e.preventDefault(); e.stopPropagation()
        const step = (plan.grid || 0.1) * (e.shiftKey ? 10 : 1)
        let next = project
        for (const id of selection) { const eq = project.equipment[id]; if (eq?.plan && editing.equipment(eq)) next = placeOnPlan(next, id, { ...eq.plan, x: snapMetres(eq.plan.x + (e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0), plan.grid), y: snapMetres(eq.plan.y + (e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0), plan.grid) }) }
        if (next !== project) useProject.getState().replaceProject(next)
      }}>
      <defs><pattern id="floor-grid" width={plan.grid || 1} height={plan.grid || 1} patternUnits="userSpaceOnUse"><path d={`M ${plan.grid || 1} 0 L 0 0 0 ${plan.grid || 1}`} fill="none" stroke="var(--border)" strokeWidth={0.005} /></pattern></defs>
      <rect x={view.x} y={view.y} width={view.w} height={view.h} fill="var(--canvas)" />
      <rect width={plan.width} height={plan.height} fill={plan.grid ? 'url(#floor-grid)' : 'none'} stroke="var(--text-2)" strokeWidth={0.03} />
      <text y={-0.2} fontSize={textSize} fill="var(--text-2)">{plan.width} × {plan.height} m</text>
      <g pointerEvents="none" fill="none" stroke="var(--text-2)" strokeWidth={0.02}>
        {plan.background?.paths.filter(p => !plan.hiddenLayers?.includes(p.layer)).map((p, i) => <path key={i} d={`${p.points.map((pt, n) => `${n ? 'L' : 'M'}${pt.x},${pt.y}`).join(' ')}${p.closed ? 'Z' : ''}`} />)}
      </g>
      <g pointerEvents="none" fill="var(--text-2)">{plan.background?.texts.filter(p => !plan.hiddenLayers?.includes(p.layer)).map((p, i) => <text key={i} x={p.x} y={p.y} fontSize={p.height} transform={`rotate(${p.angle},${p.x},${p.y})`}>{p.text}</text>)}</g>
      {items.map(eq => {
        const p = preview?.id === eq.id ? { ...eq.plan!, ...preview.position } : eq.plan!
        const known = !!p.width && !!p.depth
        return <g key={eq.id} data-plan-equipment={eq.id} tabIndex={0} role="button" aria-label={eq.name} aria-pressed={selection.includes(eq.id)} className="plan-equipment"
          transform={`translate(${p.x},${p.y})`} onFocus={() => useUi.getState().select([eq.id], [])}
          onPointerDown={e => { e.stopPropagation(); useUi.getState().select([eq.id], []); if (e.button !== 0 || !editing.equipment(eq)) return; gesture.current = { id: eq.id, start: point(e.clientX, e.clientY), position: { x: p.x, y: p.y }, view }; svg.current?.setPointerCapture(e.pointerId) }}>
          <title>{eq.name} · {p.x} m, {p.y} m{known ? ` · ${p.width} × ${p.depth} m` : ` · ${t('plan.unknownSize')}`}</title>
          <g transform={`rotate(${p.angle})`} fill="var(--bg-2)" stroke={selection.includes(eq.id) ? 'var(--accent)' : 'var(--text)'} strokeWidth={0.035}>
            {known ? <rect x={-p.width! / 2} y={-p.depth! / 2} width={p.width} height={p.depth} /> : <circle r={0.23} strokeDasharray="0.06 0.04" />}
            <g transform="translate(-0.15,-0.15) scale(0.0125)"><Pictogram id={eq.pictogram} size={24} /></g>
            <path d="M 0 -0.18 L 0 -0.4 L -0.07 -0.3 M 0 -0.4 L 0.07 -0.3" fill="none" />
          </g>
          <text y={(p.depth ?? 0.45) / 2 + textSize * 1.3} fontSize={textSize} textAnchor="middle" fill="var(--text)" paintOrder="stroke" stroke="var(--canvas)" strokeWidth={0.04}>{eq.name}</text>
        </g>
      })}
      {measure.length === 2 && <g pointerEvents="none" fill="var(--accent)" stroke="var(--accent)" strokeWidth={0.025}><line x1={measure[0].x} y1={measure[0].y} x2={measure[1].x} y2={measure[1].y} /><text stroke="none" x={(measure[0].x + measure[1].x) / 2} y={(measure[0].y + measure[1].y) / 2 - 0.15} fontSize={textSize}>{metresBetween(measure[0], measure[1]).toFixed(3)} m</text></g>}
    </svg>
    <p className="plan-legend">{t('plan.unknownSize')} · {t('plan.measureHint')}</p>
  </div>
}
