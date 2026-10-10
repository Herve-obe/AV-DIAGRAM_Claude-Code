// Sauvegardes de sécurité tournantes (comme les « Session File Backups » de Pro Tools) : toutes les
// N minutes, si le projet a changé, une copie horodatée est écrite dans
// <dossier>/Sauvegardes/<nom-du-projet>/ ; au-delà du nombre gardé, la plus ancienne est supprimée.
import { isTauri } from '@tauri-apps/api/core'
import type { Project } from '../model/types'
import { useSaveFolder } from '../store/saveFolderStore'
import { slug } from './files'

export const BACKUP_DIR = 'Sauvegardes'
export const BACKUP_INTERVALS = [1, 2, 5, 10, 15, 30] as const
export const BACKUP_COUNTS = [3, 5, 10, 20, 50] as const

const pad = (n: number) => String(n).padStart(2, '0')

/** Nom d'une sauvegarde : nom-du-projet_2026-10-10_14-05-30.avd (l'ordre alphabétique est l'ordre chronologique) */
export function backupName(base: string, date: Date): string {
  const d = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  const t = `${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`
  return `${base}_${d}_${t}.avd`
}

/** Sauvegardes à supprimer pour n'en garder que `keep` (les plus anciennes d'abord). */
export function backupsToDelete(names: string[], base: string, keep: number): string[] {
  const re = new RegExp(`^${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}_\\d{4}-\\d{2}-\\d{2}_\\d{2}-\\d{2}-\\d{2}\\.avd$`)
  const mine = names.filter((n) => re.test(n)).sort()
  return mine.slice(0, Math.max(0, mine.length - keep))
}

/** Écrit une sauvegarde et supprime les plus anciennes. Sans effet hors de l'application de bureau. */
export async function writeBackup(project: Project): Promise<void> {
  const st = useSaveFolder.getState()
  if (!isTauri() || !st.dir || !st.backups) return
  const { join } = await import('@tauri-apps/api/path')
  const { mkdir, readDir, remove, writeTextFile } = await import('@tauri-apps/plugin-fs')
  const base = slug(project.name)
  try {
    const folder = await join(st.dir, BACKUP_DIR, base)
    await mkdir(folder, { recursive: true })
    const path = await join(folder, backupName(base, new Date()))
    await writeTextFile(path, JSON.stringify(project, null, 2))
    const names = (await readDir(folder)).filter((e) => e.isFile).map((e) => e.name)
    for (const old of backupsToDelete(names, base, st.backupCount)) await remove(await join(folder, old))
    useSaveFolder.getState().setBackupResult({ at: new Date().toISOString(), path })
  } catch (e) {
    useSaveFolder.getState().setBackupResult(null, e instanceof Error ? e.message : String(e))
  }
}

/**
 * Minuterie des sauvegardes : vérifie chaque minute s'il faut sauvegarder (projet modifié depuis la
 * dernière sauvegarde et délai écoulé). Renvoie la fonction d'arrêt.
 */
export function startBackups(getProject: () => Project): () => void {
  let lastSaved: Project | null = null
  let lastAt = Date.now()
  const tick = () => {
    const st = useSaveFolder.getState()
    const p = getProject()
    if (!st.dir || !st.backups || p === lastSaved) return
    if (Date.now() - lastAt < st.backupEvery * 60_000) return
    lastSaved = p
    lastAt = Date.now()
    void writeBackup(p)
  }
  const id = window.setInterval(tick, 30_000)
  return () => window.clearInterval(id)
}
