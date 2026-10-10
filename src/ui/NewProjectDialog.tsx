// Création d'un projet : projet vide ou modèle de départ (concert, plateau TV, salle de conférence).
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { buildTemplate, type TemplateId } from '../library/templates'
import { useProject } from '../store/projectStore'
import { useUi } from '../store/uiStore'
import { Icon, type IconName } from './Icon'

const CHOICES: { id: TemplateId; icon: IconName }[] = [
  { id: 'blank', icon: 'file' },
  { id: 'concert', icon: 'synoptic' },
  { id: 'tvStudio', icon: 'present' },
  { id: 'conference', icon: 'network' },
]

export function NewProjectDialog() {
  const { t } = useTranslation()
  const open = useUi((s) => s.newProjectOpen)
  const close = () => useUi.getState().setNewProjectOpen(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (!open) return null
  const create = (id: TemplateId) => {
    useProject.getState().replaceProject(buildTemplate(id, t('menu.newProjectName')))
    const ui = useUi.getState()
    ui.select([], [])
    ui.setSheet(useProject.getState().project.sheets?.[0]?.id ?? '')
    close()
  }

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="new-title">
        <header className="dialog-head">
          <h2 id="new-title">{t('newProject.title')}</h2>
          <button className="icon-btn" onClick={close} aria-label={t('settings.close')}><Icon name="close" /></button>
        </header>
        <div className="dialog-body">
          <p className="dialog-hint">{t('newProject.hint')}</p>
          <div className="template-grid">
            {CHOICES.map((c) => (
              <button key={c.id} className="template-card" onClick={() => create(c.id)}>
                <span className="template-icon"><Icon name={c.icon} size={22} /></span>
                <span className="template-name">{t(`newProject.${c.id}.name`)}</span>
                <span className="template-desc">{t(`newProject.${c.id}.desc`)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
