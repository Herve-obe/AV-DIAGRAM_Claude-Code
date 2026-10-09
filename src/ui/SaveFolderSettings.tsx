// Paramètres > Enregistrement (ce poste) : dossier par défaut des projets et copie automatique.
import { isTauri } from '@tauri-apps/api/core'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n'
import { copyToSaveFolder, pickSaveFolder } from '../io/files'
import { useProject } from '../store/projectStore'
import { useSaveFolder } from '../store/saveFolderStore'
import { Icon } from './Icon'

export function SaveFolderSettings() {
  const { t } = useTranslation()
  const { dir, autoCopy, lastCopy, lastError } = useSaveFolder()
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
      <h3 className="group-title">{t('storage.internal')}</h3>
      <p className="dialog-hint">{t('storage.internalHint')}</p>
    </div>
  )
}
