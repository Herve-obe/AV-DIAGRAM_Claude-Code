// Barre d'alignement et de répartition (menu clic droit et inspecteur, sélection de 2 blocs ou plus).
import { useReactFlow } from '@xyflow/react'
import { useTranslation } from 'react-i18next'
import type { ArrangeAction } from '../editor/arrange'
import { ALIGN_ACTIONS, arrangeSelection, SPREAD_ACTIONS } from './arrangeActions'

/** Pictogrammes 16 x 16 : trait de référence et blocs */
const GLYPHS: Record<ArrangeAction, string> = {
  left: 'M2 1v14 M4 3h9v3H4z M4 10h6v3H4z',
  centerX: 'M8 1v14 M3 3h10v3H3z M5 10h6v3H5z',
  right: 'M14 1v14 M3 3h9v3H3z M6 10h6v3H6z',
  top: 'M1 2h14 M3 4h3v9H3z M10 4h3v6h-3z',
  centerY: 'M1 8h14 M3 3h3v10H3z M10 5h3v6h-3z',
  bottom: 'M1 14h14 M3 3h3v9H3z M10 6h3v6h-3z',
  distributeX: 'M1 2v12 M15 2v12 M4 5h2v6H4z M10 5h2v6h-2z',
  distributeY: 'M2 1h12 M2 15h12 M5 4h6v2H5z M5 10h6v2H5z',
  column: 'M4 1h8v4H4z M4 6h8v4H4z M4 11h8v4H4z',
  row: 'M1 4h4v8H1z M6 4h4v8H6z M11 4h4v8h-4z',
}

export function ArrangeToolbar({ onDone }: { onDone?: () => void }) {
  const { t } = useTranslation()
  const rf = useReactFlow()
  const button = (a: ArrangeAction) => (
    <button
      key={a}
      className="icon-btn small arrange-btn"
      title={t(`arrange.${a}`)}
      aria-label={t(`arrange.${a}`)}
      onClick={() => { arrangeSelection(rf, a); onDone?.() }}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
        <path d={GLYPHS[a]} />
      </svg>
    </button>
  )
  return (
    <div className="arrange-toolbar" role="group" aria-label={t('arrange.title')}>
      <div className="arrange-row">{ALIGN_ACTIONS.map(button)}</div>
      <div className="arrange-row">{SPREAD_ACTIONS.map(button)}</div>
    </div>
  )
}
