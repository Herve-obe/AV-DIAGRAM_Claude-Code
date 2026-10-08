// Réglages d'export partagés par les Paramètres et la fenêtre d'export : format (avec choix entre mise à
// l'échelle et taille fixe quand il change), filigrane, protection, champs du cartouche, modèle de
// cartouche du poste. Composants contrôlés : la valeur et sa modification viennent du parent.
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { fitScale, pageSize, protectionLevel, recipientsOf, sheetBounds, sheetLayout, tilesFor, watermarkLayout, watermarkText, type ProtectionLevel } from '../io/exportOptions'
import { DEFAULT_SHEET_ID } from '../model/project'
import { SIGNAL_FAMILIES } from '../model/signals'
import {
  DOCUMENT_STATUSES, PAPER_SIZES, type DocumentStatus, type ExportSettings, type PaperSize, type Project, type ProjectInfo,
  type RevisionEntry, type WatermarkSettings,
} from '../model/types'
import { logoFromFile, useTitleBlock, type TitleBlockTemplate } from '../store/titleBlockStore'
import { Icon } from './Icon'

// ---------- Format ----------

/** Effet d'un format sur les feuilles du projet : réduction pour tenir sur une page, ou nombre de pages. */
export function formatImpact(project: Project, opts: ExportSettings) {
  const { area } = sheetLayout(opts.paper, opts.orientation, SIGNAL_FAMILIES.length, project.info?.revisions?.length ?? 0)
  const sheets = project.sheets?.length ? project.sheets : [{ id: DEFAULT_SHEET_ID, name: '' }]
  let minFit = Infinity
  let pages = 0
  let maxPages = 0
  for (const s of sheets) {
    const b = sheetBounds(project, s.id, DEFAULT_SHEET_ID)
    if (!b) continue
    minFit = Math.min(minFit, fitScale(b, area))
    const t = tilesFor(b, area, opts.printScale)
    pages += t.cols * t.rows
    maxPages = Math.max(maxPages, t.cols * t.rows)
  }
  return { fit: Number.isFinite(minFit) ? Math.round(minFit) : 100, pages, maxPages }
}

export function FormatPicker({ project, value, onChange }: { project: Project; value: ExportSettings; onChange: (v: ExportSettings) => void }) {
  const { t } = useTranslation()
  const [pending, setPending] = useState<ExportSettings | null>(null)
  const size = pageSize(value.paper, value.orientation)
  const impact = useMemo(() => formatImpact(project, value), [project, value])
  // Changement de format : on demande quoi faire du synoptique
  const propose = (paper: PaperSize, orientation: ExportSettings['orientation']) => {
    if (paper === value.paper && orientation === value.orientation) return
    setPending({ ...value, paper, orientation })
  }
  const pendingImpact = useMemo(() => (pending ? formatImpact(project, pending) : null), [project, pending])

  return (
    <div className="format-picker">
      <div className="export-row">
        <div className="segmented" role="radiogroup" aria-label={t('exportPdf.format')}>
          {PAPER_SIZES.map((p) => (
            <button key={p} role="radio" aria-checked={value.paper === p} aria-pressed={value.paper === p} onClick={() => propose(p, value.orientation)}>{p}</button>
          ))}
        </div>
        <div className="segmented" role="radiogroup" aria-label={t('exportPdf.orientation')}>
          {(['landscape', 'portrait'] as const).map((o) => (
            <button key={o} role="radio" aria-checked={value.orientation === o} aria-pressed={value.orientation === o} onClick={() => propose(value.paper, o)}>
              {t(`exportPdf.${o}`)}
            </button>
          ))}
        </div>
      </div>
      <p className="dialog-hint">{t('exportPdf.size', { w: size.w, h: size.h })}</p>

      {pending && pendingImpact && (
        <div className="format-warning" role="alertdialog" aria-labelledby="format-warning-title">
          <p id="format-warning-title"><Icon name="alert" size={14} /> {t('exportPdf.changeTitle', { from: `${value.paper} ${t(`exportPdf.${value.orientation}`)}`, to: `${pending.paper} ${t(`exportPdf.${pending.orientation}`)}` })}</p>
          <button className="btn" onClick={() => { onChange({ ...pending, scaleMode: 'fit' }); setPending(null) }}>
            <strong>{t('exportPdf.choiceFit')}</strong>
            <span>{t('exportPdf.choiceFitHint', { scale: pendingImpact.fit })}</span>
          </button>
          <button className="btn" onClick={() => { onChange({ ...pending, scaleMode: 'tile' }); setPending(null) }}>
            <strong>{t('exportPdf.choiceTile')}</strong>
            <span>{t('exportPdf.choiceTileHint', { count: pendingImpact.pages, scale: pending.printScale, paper: pending.paper })}</span>
          </button>
          <button className="btn btn-ghost" onClick={() => setPending(null)}>{t('pdfImport.cancel')}</button>
        </div>
      )}

      <div className="segmented export-mode" role="radiogroup" aria-label={t('exportPdf.scaleMode')}>
        {(['fit', 'tile'] as const).map((m) => (
          <button key={m} role="radio" aria-checked={value.scaleMode === m} aria-pressed={value.scaleMode === m} onClick={() => onChange({ ...value, scaleMode: m })}>
            {t(`exportPdf.mode.${m}`)}
          </button>
        ))}
      </div>
      {value.scaleMode === 'fit' ? (
        <p className="dialog-hint">{t('exportPdf.fitHint', { scale: impact.fit })}</p>
      ) : (
        <>
          <div className="field export-scale">
            <label htmlFor="print-scale">{t('exportPdf.printScale')}</label>
            <input
              id="print-scale" type="number" min={10} max={400} step={5} value={value.printScale}
              onChange={(e) => onChange({ ...value, printScale: Math.min(400, Math.max(10, Number(e.target.value) || 100)) })}
            />
          </div>
          <p className={impact.maxPages > 1 ? 'dialog-hint ev-default' : 'dialog-hint'}>
            {t('exportPdf.tileHint', { count: impact.pages, max: impact.maxPages, paper: value.paper })}
          </p>
        </>
      )}
    </div>
  )
}

// ---------- Filigrane ----------

const PLACEMENTS: WatermarkSettings['placement'][] = ['tiled', 'diagonal', 'top', 'bottom', 'corner']
const COLORS = ['#282828', '#868e96', '#c92a2a', '#1c7ed6']

export function WatermarkEditor({ project, value, onChange }: { project: Project; value: WatermarkSettings; onChange: (v: WatermarkSettings) => void }) {
  const { t } = useTranslation()
  const set = (patch: Partial<WatermarkSettings>) => onChange({ ...value, ...patch })
  const text = watermarkText(value.text, project)
  const recipients = recipientsOf(value)
  return (
    <div className="watermark-editor">
      <label className="collab-check">
        <input type="checkbox" checked={value.enabled} onChange={(e) => set({ enabled: e.target.checked })} />
        <span>{t('exportPdf.watermarkEnable')}</span>
      </label>
      {value.enabled && (
        <>
          <div className="field">
            <label htmlFor="wm-text">{t('exportPdf.watermarkText')}</label>
            <input id="wm-text" value={value.text} maxLength={120} onChange={(e) => set({ text: e.target.value })} />
          </div>
          <p className="field-hint">{t('exportPdf.watermarkFields')}</p>
          <div className="field-grid">
            <div className="field">
              <label htmlFor="wm-place">{t('exportPdf.placement')}</label>
              <select id="wm-place" value={value.placement} onChange={(e) => set({ placement: e.target.value as WatermarkSettings['placement'] })}>
                {PLACEMENTS.map((p) => <option key={p} value={p}>{t(`exportPdf.placements.${p}`)}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="wm-zone">{t('exportPdf.zone')}</label>
              <select id="wm-zone" value={value.zone} onChange={(e) => set({ zone: e.target.value as WatermarkSettings['zone'] })}>
                <option value="diagram">{t('exportPdf.zones.diagram')}</option>
                <option value="sheet">{t('exportPdf.zones.sheet')}</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="wm-size">{t('exportPdf.textSize')}</label>
              <select id="wm-size" value={value.size} onChange={(e) => set({ size: e.target.value as WatermarkSettings['size'] })}>
                {(['small', 'medium', 'large'] as const).map((s) => <option key={s} value={s}>{t(`exportPdf.sizes.${s}`)}</option>)}
              </select>
            </div>
            <div className="field">
              <span className="field-label">{t('exportPdf.color')}</span>
              <div className="wm-colors">
                {COLORS.map((c) => (
                  <button key={c} className="wm-color" style={{ background: c }} aria-pressed={value.color === c} aria-label={c} onClick={() => set({ color: c })} />
                ))}
                <input type="color" value={value.color} onChange={(e) => set({ color: e.target.value })} aria-label={t('exportPdf.customColor')} />
              </div>
            </div>
          </div>
          <div className="field">
            <label htmlFor="wm-opacity">{t('exportPdf.opacity', { value: Math.round(value.opacity * 100) })}</label>
            <input id="wm-opacity" type="range" min={0.05} max={0.6} step={0.01} value={value.opacity} onChange={(e) => set({ opacity: Number(e.target.value) })} />
          </div>
          <WatermarkPreview text={recipients.length ? watermarkText(value.text, project, undefined, recipients[0]) : text} value={value} />
          <div className="field">
            <label htmlFor="wm-recipients">{t('exportPdf.recipients')}</label>
            <textarea
              id="wm-recipients" rows={3} value={(value.recipients ?? []).join('\n')} placeholder={t('exportPdf.recipientsPlaceholder')}
              onChange={(e) => set({ recipients: e.target.value.split('\n') })}
            />
          </div>
          <p className="field-hint">
            {recipients.length ? t('exportPdf.recipientsHint', { count: recipients.length }) : t('exportPdf.recipientsNone')}
          </p>
          <label className="collab-check">
            <input type="checkbox" checked={value.images} onChange={(e) => set({ images: e.target.checked })} />
            <span>{t('exportPdf.watermarkImages')}</span>
          </label>
          <p className="dialog-hint">{t(value.zone === 'diagram' ? 'exportPdf.zoneDiagramHint' : 'exportPdf.zoneSheetHint')}</p>
        </>
      )}
    </div>
  )
}

/** Aperçu sur une planche miniature (proportions A3 paysage) avec la même disposition que l'export. */
function WatermarkPreview({ text, value }: { text: string; value: WatermarkSettings }) {
  const { t } = useTranslation()
  const W = 420
  const H = 297
  const zoneArea = value.zone === 'diagram' ? { x: 10, y: 10, w: 400, h: 220 } : { x: 0, y: 0, w: W, h: H }
  const items = text ? watermarkLayout(zoneArea.w, zoneArea.h, text, value.placement, value.size) : []
  const anchor = { center: 'middle', left: 'start', right: 'end' } as const
  return (
    <svg className="wm-preview" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t('exportPdf.preview')}>
      <rect x="5" y="5" width={W - 10} height={H - 10} fill="#fff" stroke="#999" />
      <rect x="10" y="10" width="400" height="220" fill="#f1f3f5" />
      <rect x={W - 190} y={H - 58} width="180" height="48" fill="none" stroke="#666" />
      <defs><clipPath id="wm-clip"><rect x={zoneArea.x} y={zoneArea.y} width={zoneArea.w} height={zoneArea.h} /></clipPath></defs>
      <g clipPath="url(#wm-clip)" transform={`translate(${zoneArea.x} ${zoneArea.y})`} fill={value.color} fillOpacity={value.opacity} fontFamily="Helvetica, Arial, sans-serif" fontWeight={600}>
        {items.map((it, i) => (
          <text key={i} x={it.x} y={it.y} fontSize={it.size} textAnchor={anchor[it.align]} transform={it.angle ? `rotate(${-it.angle} ${it.x} ${it.y})` : undefined}>{text}</text>
        ))}
      </g>
    </svg>
  )
}

// ---------- Protection ----------

export function ProtectionEditor({ value, onChange, passwords, onPasswords }: {
  value: ExportSettings['protection']
  onChange: (v: ExportSettings['protection']) => void
  passwords?: { open: string; owner: string }
  onPasswords?: (p: { open: string; owner: string }) => void
}) {
  const { t } = useTranslation()
  const set = (patch: Partial<ExportSettings['protection']>) => onChange({ ...value, ...patch })
  return (
    <div className="protection-editor">
      <label className="collab-check">
        <input type="checkbox" checked={value.enabled} onChange={(e) => set({ enabled: e.target.checked })} />
        <span>{t('exportPdf.protect')}</span>
      </label>
      {value.enabled && (
        <>
          <div className="protect-rights">
            {(['allowPrint', 'allowCopy', 'allowModify'] as const).map((k) => (
              <label key={k} className="collab-check">
                <input type="checkbox" checked={value[k]} onChange={(e) => set({ [k]: e.target.checked })} />
                <span>{t(`exportPdf.${k}`)}</span>
              </label>
            ))}
          </div>
          {passwords && onPasswords && (
            <div className="field-grid">
              <div className="field">
                <label htmlFor="pw-open">{t('exportPdf.openPassword')}</label>
                <input id="pw-open" type="password" autoComplete="new-password" value={passwords.open} onChange={(e) => onPasswords({ ...passwords, open: e.target.value })} />
              </div>
              <div className="field">
                <label htmlFor="pw-owner">{t('exportPdf.ownerPassword')}</label>
                <input id="pw-owner" type="password" autoComplete="new-password" value={passwords.owner} onChange={(e) => onPasswords({ ...passwords, owner: e.target.value })} />
              </div>
            </div>
          )}
          <p className="dialog-hint">{t('exportPdf.protectHint')}</p>
        </>
      )}
      <ProtectionBadge level={protectionLevel(value, passwords?.open ?? '')} />
    </div>
  )
}

/** Niveau réel de protection, expliqué en une phrase */
export function ProtectionBadge({ level, compact = false }: { level: ProtectionLevel; compact?: boolean }) {
  const { t } = useTranslation()
  return (
    <span className={`protect-level level-${level}${compact ? ' is-compact' : ''}`}>
      <Icon name={level === 'none' ? 'alert' : 'lock'} size={13} />
      <strong>{t(`exportPdf.level.${level}`)}</strong>
      {!compact && <span>{t(`exportPdf.levelHint.${level}`)}</span>}
    </span>
  )
}

// ---------- Cartouche ----------

/** Champs du cartouche du projet ; le modèle du poste complète les champs vides. */
export function infoWithTemplate(info: ProjectInfo | undefined, tpl: TitleBlockTemplate, date = new Date()): ProjectInfo {
  const i = info ?? {}
  return {
    ...i,
    owner: i.owner || tpl.owner || undefined,
    author: i.author || tpl.author || undefined,
    approver: i.approver || tpl.approver || undefined,
    docType: i.docType || tpl.docType || undefined,
    classification: i.classification || tpl.classification || undefined,
    language: i.language || tpl.language || undefined,
    docNumber: i.docNumber || (tpl.numberPrefix ? `${tpl.numberPrefix}${date.getFullYear()}-001` : undefined),
    status: i.status ?? 'draft',
  }
}

const TEXT_FIELDS: (keyof ProjectInfo)[] = [
  'owner', 'docNumber', 'subtitle', 'client', 'venue', 'eventDate', 'author', 'approver', 'docType', 'revision', 'classification', 'techRef', 'language',
]

export function TitleBlockFields({ value, onChange }: { value: ProjectInfo; onChange: (v: ProjectInfo) => void }) {
  const { t } = useTranslation()
  const set = (patch: Partial<ProjectInfo>) => onChange({ ...value, ...patch })
  const revisions = value.revisions ?? []
  const setRev = (i: number, patch: Partial<RevisionEntry>) => set({ revisions: revisions.map((r, j) => (j === i ? { ...r, ...patch } : r)) })
  const addRev = () =>
    set({ revisions: [...revisions, { index: value.revision || String.fromCharCode(65 + revisions.length), date: new Date().toLocaleDateString(), description: '', author: value.author }] })
  return (
    <div className="titleblock-fields">
      <div className="field-grid">
        {TEXT_FIELDS.map((k) => (
          <div className="field" key={k}>
            <label htmlFor={`tb-${k}`}>{t(`titleBlock.${k}`)}</label>
            <input id={`tb-${k}`} value={(value[k] as string | undefined) ?? ''} onChange={(e) => set({ [k]: e.target.value || undefined })} />
          </div>
        ))}
        <div className="field">
          <label htmlFor="tb-status">{t('titleBlock.status')}</label>
          <select id="tb-status" value={value.status ?? 'draft'} onChange={(e) => set({ status: e.target.value as DocumentStatus })}>
            {DOCUMENT_STATUSES.map((s) => <option key={s} value={s}>{t(`titleBlock.statuses.${s}`)}</option>)}
          </select>
        </div>
      </div>
      <p className="field-hint">{t('titleBlock.autoFields')}</p>
      <h4 className="subgroup-title">{t('titleBlock.revisions')}</h4>
      <table className="zone-table rev-table">
        <thead>
          <tr><th>{t('titleBlock.revIndex')}</th><th>{t('titleBlock.revDate')}</th><th>{t('titleBlock.revDescription')}</th><th>{t('titleBlock.revBy')}</th><th /></tr>
        </thead>
        <tbody>
          {revisions.map((r, i) => (
            <tr key={i}>
              <td><input aria-label={t('titleBlock.revIndex')} value={r.index} onChange={(e) => setRev(i, { index: e.target.value })} /></td>
              <td><input aria-label={t('titleBlock.revDate')} value={r.date} onChange={(e) => setRev(i, { date: e.target.value })} /></td>
              <td><input aria-label={t('titleBlock.revDescription')} value={r.description} onChange={(e) => setRev(i, { description: e.target.value })} /></td>
              <td><input aria-label={t('titleBlock.revBy')} value={r.author ?? ''} onChange={(e) => setRev(i, { author: e.target.value })} /></td>
              <td className="num">
                <button className="icon-btn small" onClick={() => set({ revisions: revisions.filter((_, j) => j !== i) })} aria-label={t('titleBlock.removeRevision')}><Icon name="trash" size={13} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="btn btn-ghost" onClick={addRev}><Icon name="plus" size={13} />{t('titleBlock.addRevision')}</button>
    </div>
  )
}

// ---------- Modèle de cartouche du poste ----------

export function TemplateEditor() {
  const { t } = useTranslation()
  const { template, update } = useTitleBlock()
  const [error, setError] = useState<string | null>(null)
  const fields: (keyof TitleBlockTemplate)[] = ['owner', 'ownerDetail', 'author', 'approver', 'docType', 'classification', 'language', 'numberPrefix']
  const pickLogo = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/png,image/jpeg,image/svg+xml'
    input.onchange = async () => {
      const f = input.files?.[0]
      if (!f) return
      try {
        if (!update({ logo: await logoFromFile(f) })) setError(t('titleBlock.logoTooBig'))
        else setError(null)
      } catch {
        setError(t('titleBlock.logoError'))
      }
    }
    input.click()
  }
  return (
    <div className="template-editor">
      <p className="dialog-hint">{t('titleBlock.templateHint')}</p>
      <div className="template-logo">
        <div className="logo-box">{template.logo ? <img src={template.logo} alt={t('titleBlock.logo')} /> : <span>{t('titleBlock.noLogo')}</span>}</div>
        <div className="collab-row">
          <button className="btn" onClick={pickLogo}>{t('titleBlock.chooseLogo')}</button>
          {template.logo && <button className="btn btn-ghost" onClick={() => update({ logo: null })}>{t('titleBlock.removeLogo')}</button>}
        </div>
      </div>
      {error && <p className="collab-error" role="alert">{error}</p>}
      <div className="field-grid">
        {fields.map((k) => (
          <div className="field" key={k}>
            <label htmlFor={`tpl-${k}`}>{t(`titleBlock.tpl.${k}`)}</label>
            <input id={`tpl-${k}`} value={(template[k] as string) ?? ''} onChange={(e) => update({ [k]: e.target.value })} />
          </div>
        ))}
      </div>
      <p className="field-hint">{t('titleBlock.dateAuto')}</p>
    </div>
  )
}
