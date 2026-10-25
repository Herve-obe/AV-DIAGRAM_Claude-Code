// Récupération locale distincte du fichier principal .avd, enregistré uniquement par l'utilisateur.
import { del, get, set } from 'idb-keyval'
import { readProjectFile } from '../io/files'
import { isProject } from '../model/project'
import type { Project } from '../model/types'
import { useProject } from './projectStore'
import { useSaveFolder } from './saveFolderStore'

const KEY = 'avd.currentProject'
const RECENT_KEY = 'avd.recent'
const projectKey = (id: string) => 'avd.project.' + id
const RECENT_MAX = 8
export interface RecentProject { id: string; name: string; updatedAt: string; equipment: number }
const entryOf = (p: Project): RecentProject => ({ id: p.id, name: p.name, updatedAt: p.updatedAt, equipment: Object.keys(p.equipment).length })
let restored: RecentProject | null = null
export const restoredProject = () => restored
// L’écran d’accueil utilise un projet vide transitoire, qui ne doit pas devenir un récent.
let idleProjectId: string | null = null
export const setRecoveryIdleProject = (id: string) => { idleProjectId = id }

export async function listRecent(): Promise<RecentProject[]> {
  try { const v = await get(RECENT_KEY); return Array.isArray(v) ? v : [] } catch { return [] }
}
async function remember(p: Project) {
  const list = (await listRecent()).filter(r => r.id !== p.id)
  // La limite porte uniquement sur les raccourcis. Les anciens projets locaux sont conservés.
  await set(projectKey(p.id), p)
  await set(RECENT_KEY, [entryOf(p), ...list].slice(0, RECENT_MAX))
}
export async function loadRecent(id: string): Promise<Project | null> {
  try {
    const path = useSaveFolder.getState().projectFiles[id]
    const p = path ? await readProjectFile(path) : await get(projectKey(id))
    return isProject(p) ? p : null
  } catch { return null }
}
export async function forgetRecent(id: string): Promise<void> {
  try { await set(RECENT_KEY, (await listRecent()).filter(r => r.id !== id)) }
  catch { /* Stockage indisponible : le raccourci reste affiché. */ }
}
export async function restoreProject(): Promise<void> {
  try {
    const stored = await get(KEY)
    const p = isProject(stored) ? stored : stored?.project
    if (!isProject(p)) return
    const path = useSaveFolder.getState().projectFiles[p.id]
    if (stored?.saved === true && path) {
      try { useProject.getState().load(await readProjectFile(path)) }
      catch {
        // Disque retiré ou fichier déplacé : la copie interne reste récupérable.
        useProject.getState().load(p)
        useProject.setState({ saved: false })
      }
    } else {
      useProject.getState().load(p)
      useProject.setState({ saved: false })
    }
    // Une récupération après plantage n'est jamais présentée comme un fichier principal enregistré.
    restored = entryOf(p)
    if (!(await listRecent()).some(r => r.id === p.id)) await remember(p)
  } catch { /* Premier lancement ou stockage indisponible. */ }
}

let timer: ReturnType<typeof setTimeout> | undefined
let pending: Project | null = null
let writes: Promise<void> = Promise.resolve()
const waiting = new Map<string, { project: Project; saved: boolean }>()
/** Capture le projet sortant avant toute attente, puis ordonne les écritures de récupération. */
export function flushRecovery(): Promise<void> {
  clearTimeout(timer)
  const p = pending
  pending = null
  if (p) {
    const saved = useProject.getState().project === p && useProject.getState().saved
    waiting.set(p.id, { project: p, saved })
  }
  writes = writes.catch(() => {}).then(async () => {
    for (const [id, snapshot] of waiting) {
      await remember(snapshot.project)
      await set(KEY, snapshot)
      if (waiting.get(id) === snapshot) waiting.delete(id)
    }
  })
  return writes
}
export async function discardRecovery(): Promise<void> {
  await flushRecovery()
  await del(KEY)
  restored = null
}
export function startAutosave(): () => void {
  const unsubscribe = useProject.subscribe((s, prev) => {
    if (s.project.id === idleProjectId) {
      if (s.saved) return
      idleProjectId = null
    }
    if (s.project === prev.project && s.saved === prev.saved) return
    if (s.project.id !== prev.project.id && pending) void flushRecovery().catch(() => {})
    pending = s.project
    clearTimeout(timer)
    timer = setTimeout(() => { void flushRecovery().catch(() => {}) }, 600)
  })
  return () => { unsubscribe(); void flushRecovery().catch(() => {}) }
}
