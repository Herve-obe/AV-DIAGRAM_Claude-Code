// Changer de document ou fermer : choix explicite de l'utilisateur, sans écrasement automatique.
import { isTauri } from '@tauri-apps/api/core'
import i18n from '../i18n'
import { discardRecovery, flushRecovery } from '../store/persistence'
import { useProject } from '../store/projectStore'
import { notifyError, openProjectFile, saveProjectFile } from './files'
import { saveDesktopLayout } from '../store/windowLayout'

let sessionActive = false
export const setDocumentSessionActive = (active: boolean) => { sessionActive = active }
let asking = false
export async function saveCurrentProject(as = false): Promise<boolean> {
  try { return await saveProjectFile(useProject.getState().project, { as }) }
  catch (e) { await notifyError(i18n.t('storage.saveError', { error: String(e) })); return false }
}
export async function prepareToLeave(closing = false): Promise<boolean> {
  if (asking) return false
  if (sessionActive && !closing) { await notifyError(i18n.t('storage.leaveSession')); return false }
  asking = true
  try {
    await flushRecovery()
    const { project, saved } = useProject.getState()
    if (saved) return true
    let choice: string
    if (isTauri()) {
      const { message } = await import('@tauri-apps/plugin-dialog')
      choice = await message(i18n.t('storage.savePrompt', { name: project.name }), {
        title: 'AV Diagram', kind: 'warning',
        buttons: { yes: i18n.t('menu.save'), no: i18n.t('storage.discard'), cancel: i18n.t('series.cancel') },
      })
    } else {
      choice = window.confirm(i18n.t('storage.savePrompt', { name: project.name })) ? i18n.t('menu.save') : i18n.t('series.cancel')
    }
    if (choice === i18n.t('menu.save')) return await saveCurrentProject() && useProject.getState().saved
    if (choice !== i18n.t('storage.discard') || useProject.getState().project !== project) return false
    await discardRecovery()
    return true
  } catch (e) { await notifyError(i18n.t('storage.saveError', { error: String(e) })); return false }
  finally { asking = false }
}
export async function openDocument(): Promise<boolean> {
  if (!(await prepareToLeave())) return false
  try { const p = await openProjectFile(); if (!p) return false; useProject.getState().load(p); return true }
  catch { await notifyError(i18n.t('menu.openError')); return false }
}
export async function guardWindowClose() {
  if (isTauri()) {
    const { getCurrentWindow } = await import('@tauri-apps/api/window')
    const w = getCurrentWindow()
    let closing = false
    await w.onCloseRequested(async e => {
      if (closing) { e.preventDefault(); return }
      closing = true
      try {
        if (!(await prepareToLeave(true))) { e.preventDefault(); return }
        // Tauri ferme ensuite la principale ; Infos ne doit pas garder l'application ouverte seule.
        const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow')
        const panels = await WebviewWindow.getByLabel('panels')
        await saveDesktopLayout(panels)
        await panels?.destroy()
      } catch (error) {
        e.preventDefault()
        await notifyError(i18n.t('dual.closeError', { error: String(error) }))
      } finally { closing = false }
    })
  } else {
    window.addEventListener('beforeunload', e => { if (!useProject.getState().saved) e.preventDefault() })
  }
}
