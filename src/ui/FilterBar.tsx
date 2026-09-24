// Filtres d'affichage par famille de signal (au-dessus du canevas).
import { useTranslation } from 'react-i18next'
import { SIGNAL_FAMILIES, SIGNAL_STYLE } from '../model/signals'
import { useUi } from '../store/uiStore'

export function FilterBar() {
  const { t } = useTranslation()
  const { hiddenSignals, toggleSignal, mode } = useUi()
  // En mode débutant, seules les familles les plus courantes sont proposées
  const families = mode === 'beginner'
    ? SIGNAL_FAMILIES.filter((f) => ['audioAnalog', 'audioDigital', 'audioIp', 'video', 'network'].includes(f))
    : SIGNAL_FAMILIES
  return (
    <div className="filterbar" role="group" aria-label={t('filters.label')}>
      {families.map((f) => {
        const st = SIGNAL_STYLE[f]
        const on = !hiddenSignals.includes(f)
        return (
          <button key={f} className="chip" aria-pressed={on} onClick={() => toggleSignal(f)}>
            <svg width="18" height="6" aria-hidden="true">
              <line x1="0" y1="3" x2="18" y2="3" stroke={on ? st.color : 'var(--text-3)'} strokeWidth={Math.min(st.width + 0.5, 3)} strokeDasharray={st.dash || undefined} />
            </svg>
            {t(`signal.${f}`)}
          </button>
        )
      })}
    </div>
  )
}
