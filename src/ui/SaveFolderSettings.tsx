// Paramètres > Enregistrement (ce poste) : dossier par défaut des projets et copie automatique.
import { isTauri } from '@tauri-apps/api/core'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n'
import { BACKUP_COUNTS, BACKUP_DIR, BACKUP_INTERVALS, writeBackup } from '../io/backups'
import { copyToSaveFolder, pickSaveFolder } from '../io/files'
import { useProject } from '../store/projectStore'
import { useSaveFolder } from '../store/saveFolderStore'
import { Icon } from './Icon'

export function SaveFolderSettings() {
  const { t } = useTranslation()
  const { dir, autoCopy, lastCopy, lastError, backups, backupEvery, backupCount, lastBackup } = useSaveFolder()
  const desktop = isTauri()
  const choose = async () => {
    const d = await pickSaveFolder()
    if (!d) return
    useSaveFolder.getState().setDir(d)
    // Première copie tout de suite : l'utilisateur voit le fichier apparaître
    await copyToSaveFolder(useProject.getState().project)
  }
  return (
    <div className="save-folder">
      <h3 className="group-title">{t('storage.folder')}</h3>
      <p className="dialog-hint">{t('storage.folderHint')}</p>
      {!desktop && <p className="format-warning">{t('storage.desktopOnly')}</p>}
      <div className="save-folder-row">
        <code className="save-folder-path">{dir ?? t('storage.none')}</code>
        <button className="btn" onClick={choose} disabled={!desktop}><Icon name="folder" size={14} />{t('storage.choose')}</button>
        {dir && <button className="btn btn-ghost" onClick={() => useSaveFolder.getState().setDir(null)}>{t('storage.reset')}</button>}
      </div>
      <label className="check-line">
        <input
          type="checkbox"
          checked={autoCopy}
          disabled={!desktop || !dir}
          onChange={async (e) => {
            useSaveFolder.getState().setAutoCopy(e.target.checked)
            if (e.target.checked) await copyToSaveFolder(useProject.getState().project)
          }}
        />
        {t('storage.autoCopy')}
      </label>
      {dir && autoCopy && lastCopy && (
        <p className="dim small">{t('storage.lastCopy', { path: lastCopy.path, date: new Date(lastCopy.at).toLocaleTimeString(i18n.language) })}</p>
      )}
      {lastError && <p className="format-warning">{t('storage.error', { error: lastError })}</p>}
      <h3 className="group-title">{t('storage.backupsTitle')}</h3>
      <p className="dialog-hint">{t('storage.backupsHint', { folder: BACKUP_DIR })}</p>
      <label className="check-line">
        <input type="checkbox" checked={backups} disabled={!desktop || !dir} onChange={(e) => useSaveFolder.getState().setBackups({ backups: e.target.checked })} />
        {t('storage.backupsOn')}
      </label>
      <div className="save-folder-row">
        <label className="backup-field">
          {t('storage.backupEvery')}
          <select value={backupEvery} disabled={!desktop || !dir || !backups} onChange={(e) => useSaveFolder.getState().setBackups({ backupEvery: Number(e.target.value) })}>
            {BACKUP_INTERVALS.map((m) => <option key={m} value={m}>{t('storage.minutes', { count: m })}</option>)}
          </select>
        </label>
        <label className="backup-field">
          {t('storage.backupCount')}
          <select value={backupCount} disabled={!desktop || !dir || !backups} onChange={(e) => useSaveFolder.getState().setBackups({ backupCount: Number(e.target.value) })}>
            {BACKUP_COUNTS.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <button className="btn" disabled={!desktop || !dir || !backups} onClick={() => void writeBackup(useProject.getState().project)}>{t('storage.backupNow')}</button>
      </div>
      {dir && backups && lastBackup && (
        <p className="dim small">{t('storage.lastBackup', { path: lastBackup.path, date: new Date(lastBackup.at).toLocaleTimeString(i18n.language) })}</p>
      )}
      <h3 className="group-title">{t('storage.internal')}</h3>
      <p className="dialog-hint">{t('storage.internalHint')}</p>
    </div>
  )
}
