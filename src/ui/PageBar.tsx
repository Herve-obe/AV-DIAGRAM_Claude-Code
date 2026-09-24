// Barre des pages, en bas de l'écran (inspirée de la navigation par pages de DaVinci Resolve),
// suivie de la barre d'état.
import { useTranslation } from 'react-i18next'
import { useProject } from '../store/projectStore'
import { Icon, type IconName } from './Icon'

const PAGES: { id: string; icon: IconName; lot?: number }[] = [
  { id: 'synoptic', icon: 'synoptic' },
  { id: 'rack', icon: 'rack', lot: 3 },
  { id: 'plan', icon: 'plan', lot: 3 },
  { id: 'network', icon: 'network', lot: 3 },
  { id: 'lists', icon: 'lists', lot: 3 },
  { id: 'deliver', icon: 'deliver', lot: 2 },
]

export function PageBar() {
  const { t } = useTranslation()
  const eqCount = useProject((s) => Object.keys(s.project.equipment).length)
  const linkCount = useProject((s) => Object.keys(s.project.links).length)
  const saved = useProject((s) => s.saved)
  return (
    <footer className="pagebar">
      <div className="status-left">
        <span>{t('status.equipment', { count: eqCount })}</span>
        <span>{t('status.links', { count: linkCount })}</span>
      </div>
      <nav className="pages" aria-label="Pages">
        {PAGES.map((p) => (
          <button
            key={p.id}
            className="page-btn"
            aria-current={p.id === 'synoptic' ? 'page' : undefined}
            disabled={!!p.lot}
            title={p.lot ? t('pages.soon', { lot: p.lot }) : undefined}
          >
            <Icon name={p.icon} size={18} />
            <span>{t(`pages.${p.id}`)}</span>
          </button>
        ))}
      </nav>
      <div className="status-right">
        <span className={saved ? 'ok-text' : 'dim'}>{saved ? t('status.saved') : t('status.unsaved')}</span>
      </div>
    </footer>
  )
}
