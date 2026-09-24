// Sauvegarde automatique locale (IndexedDB) : le projet survit à la fermeture du navigateur, hors ligne.
// Aucune donnée ne quitte l'appareil.
import { get, set } from 'idb-keyval'
import { isProject } from '../model/project'
import { useProject } from './projectStore'

const KEY = 'avd.currentProject'
const DELAY_MS = 600

export async function restoreProject(): Promise<void> {
  try {
    const stored = await get(KEY)
    if (isProject(stored)) useProject.getState().load(stored)
  } catch {
    // IndexedDB indisponible : on garde le projet d'exemple
  }
}

export function startAutosave(): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined
  return useProject.subscribe((state, prev) => {
    if (state.project === prev.project) return
    clearTimeout(timer)
    timer = setTimeout(async () => {
      try {
        await set(KEY, useProject.getState().project)
        useProject.getState().markSaved()
      } catch {
        // Échec silencieux : l'indicateur "non enregistré" reste affiché
      }
    }, DELAY_MS)
  })
}
