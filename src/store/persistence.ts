// Sauvegarde automatique locale (IndexedDB) : le projet survit à la fermeture de l'application, hors
// ligne. Aucune donnée ne quitte l'appareil. Les derniers projets ouverts sont aussi gardés, pour les
// rouvrir depuis la fenêtre d'accueil (un nouveau projet ne fait donc pas perdre le précédent).
import { del, get, set } from 'idb-keyval'
import { copyToSaveFolder } from '../io/files'
import { isProject } from '../model/project'
import type { Project } from '../model/types'
import { useProject } from './projectStore'

const KEY = 'avd.currentProject'
const RECENT_KEY = 'avd.recent'
const projectKey = (id: string) => `avd.project.${id}`
const DELAY_MS = 600
const RECENT_MAX = 8

export interface RecentProject {
  id: string
  name: string
  updatedAt: string
  equipment: number
}

const entryOf = (p: Project): RecentProject => ({ id: p.id, name: p.name, updatedAt: p.updatedAt, equipment: Object.keys(p.equipment).length })

/** Projet retrouvé au lancement (null : premier lancement ou stockage indisponible) */
let restored: RecentProject | null = null
export const restoredProject = () => restored

export async function listRecent(): Promise<RecentProject[]> {
  try {
    const v = await get(RECENT_KEY)
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

async function remember(p: Project) {
  const list = (await listRecent()).filter((r) => r.id !== p.id)
  const next = [entryOf(p), ...list]
  await set(projectKey(p.id), p)
  for (const old of next.slice(RECENT_MAX)) await del(projectKey(old.id))
  await set(RECENT_KEY, next.slice(0, RECENT_MAX))
}

export async function loadRecent(id: string): Promise<Project | null> {
  try {
    const p = await get(projectKey(id))
    return isProject(p) ? p : null
  } catch {
    return null
  }
}

export async function forgetRecent(id: string): Promise<void> {
  try {
    await set(RECENT_KEY, (await listRecent()).filter((r) => r.id !== id))
    await del(projectKey(id))
  } catch {
    // stockage indisponible : rien à oublier
  }
}

export async function restoreProject(): Promise<void> {
  try {
    const stored = await get(KEY)
    if (!isProject(stored)) return
    useProject.getState().load(stored)
    restored = entryOf(stored)
    // Projet enregistré par une version précédente, sans liste des récents
    if (!(await listRecent()).some((r) => r.id === stored.id)) await remember(stored)
  } catch {
    // IndexedDB indisponible : on garde le projet vide de départ
  }
}

export function startAutosave(): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined
  return useProject.subscribe((state, prev) => {
    if (state.project === prev.project) return
    clearTimeout(timer)
    timer = setTimeout(async () => {
      try {
        const p = useProject.getState().project
        await set(KEY, p)
        await remember(p)
        useProject.getState().markSaved()
        await copyToSaveFolder(p)
      } catch {
        // Échec silencieux : l'indicateur "non enregistré" reste affiché
      }
    }, DELAY_MS)
  })
}
