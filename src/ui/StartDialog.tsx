// Fenêtre d'accueil, au lancement : nouveau projet, reprise du dernier, projet récent, fichier .avd
// du poste ou session de collaboration.
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCollab } from '../collab/session'
import i18n from '../i18n'
import { notifyError } from '../io/files'
import { openDocument, prepareToLeave } from '../io/documentLifecycle'
import { useSaveFolder } from '../store/saveFolderStore'
import { forgetRecent, listRecent, loadRecent, restoredProject, type RecentProject } from '../store/persistence'
import { useProject } from '../store/projectStore'
import { useUi } from '../store/uiStore'
import { Icon, type IconName } from './Icon'

const when = (iso: string) => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString(i18n.language, { dateStyle: 'short', timeStyle: 'short' })
}

/** Après ouverture d'un autre projet : feuille racine, rien de sélectionné */
function afterLoad() {
  const ui = useUi.getState()
  ui.select([], [])
  ui.setSheet(useProject.getState().project.sheets?.[0]?.id ?? '')
  ui.setStartOpen(false)
}

export function StartDialog() {
  const { t } = useTranslation()
  const open = useUi((s) => s.startOpen)
  const [recent, setRecent] = useState<RecentProject[]>([])
  const projectId = useProject(s => s.project.id)
  const restored = restoredProject()
  const last = restored?.id === projectId ? restored : recent[0] ?? null
  const close = () => useUi.getState().setStartOpen(false)

  useEffect(() => {
    if (!open) return
    listRecent().then(setRecent)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (!open) return null
  const others = recent.filter((r) => r.id !== last?.id)

  const action = (icon: IconName, title: string, desc: string, onClick: () => void, disabled = false) => (
    <button className="template-card" onClick={onClick} disabled={disabled}>
      <span className="template-icon"><Icon name={icon} size={22} /></span>
      <span className="template-name">{title}</span>
      <span className="template-desc">{desc}</span>
    </button>
  )
  const openFile = async () => { if (await openDocument()) afterLoad() }
  const openRecent = async (id: string) => {
    if (!(await prepareToLeave())) return
    const p = await loadRecent(id)
    if (!p) { notifyError(t('start.recentMissing')); return }
    useProject.getState().load(p)
    if (!useSaveFolder.getState().projectFiles[id]) useProject.setState({ saved: false })
    afterLoad()
  }

  return (
    <div className="overlay">
      <div className="dialog start-dialog" role="dialog" aria-modal="true" aria-labelledby="start-title">
        <header className="dialog-head">
          <h2 id="start-title">{t('start.title')}</h2>
          <button className="icon-btn" onClick={close} aria-label={t('settings.close')}><Icon name="close" /></button>
        </header>
        <div className="dialog-body">
          <div className="template-grid">
            {action('plus', t('start.new'), t('start.newDesc'), () => { close(); useUi.getState().setNewProjectOpen(true) })}
            {action('synoptic', t('start.last'), last ? t('start.lastDesc', { name: last.name, count: last.equipment, date: when(last.updatedAt) }) : t('start.lastNone'), () => { if (last?.id === restored?.id && last?.id === projectId) close(); else if (last) void openRecent(last.id) }, !last)}
            {action('folder', t('start.file'), t('start.fileDesc'), openFile)}
            {action('users', t('start.collab'), t('start.collabDesc'), () => { close(); useCollab.getState().setDialogOpen(true) })}
          </div>
          {others.length > 0 && (
            <section className="start-recent">
              <h3 className="group-title">{t('start.recent')}</h3>
              <ul>
                {others.map((r) => (
                  <li key={r.id}>
                    <button className="start-recent-open" onClick={() => openRecent(r.id)}>
                      <span>{r.name}</span>
                      <span className="dim">{t('start.recentMeta', { count: r.equipment, date: when(r.updatedAt) })}</span>
                    </button>
                    <button
                      className="icon-btn small"
                      title={t('start.forget')}
                      aria-label={t('start.forget')}
                      onClick={async () => { await forgetRecent(r.id); setRecent(await listRecent()) }}
                    >
                      <Icon name="close" size={12} />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <p className="dialog-hint">{t('start.storageHint')}</p>
        </div>
      </div>
    </div>
  )
}
