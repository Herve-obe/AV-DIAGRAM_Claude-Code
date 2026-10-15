import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createProject } from '../model/project'
import { useSaveFolder } from '../store/saveFolderStore'
import { backupName, backupsToDelete, startBackups, writeBackup } from './backups'

const fs = vi.hoisted(() => ({ mkdir: vi.fn(), readDir: vi.fn(), remove: vi.fn(), writeTextFile: vi.fn() }))
vi.mock('@tauri-apps/api/core', () => ({ isTauri: () => true }))
vi.mock('@tauri-apps/plugin-fs', () => fs)
vi.mock('@tauri-apps/api/path', () => ({
  join: async (...parts: string[]) => parts.join('/'),
  dirname: async (p: string) => p.slice(0, p.lastIndexOf('/')),
}))

describe('sauvegardes tournantes', () => {
  it('nomme les sauvegardes dans l\'ordre chronologique', () => {
    expect(backupName('concert', new Date(2026, 9, 10, 14, 5, 3))).toBe('concert_2026-10-10_14-05-03.avd')
  })
  it('ne garde que les plus récentes, sans toucher aux autres fichiers', () => {
    const names = [
      'concert_2026-10-10_14-00-00.avd', 'concert_2026-10-10_14-10-00.avd', 'concert_2026-10-10_14-05-00.avd',
      'concert-2_2026-10-10_14-00-00.avd', 'notes.txt', 'concert.avd',
    ]
    expect(backupsToDelete(names, 'concert', 2)).toEqual(['concert_2026-10-10_14-00-00.avd'])
    expect(backupsToDelete(names, 'concert', 10)).toEqual([])
  })
})

describe('écriture et reprise des sauvegardes', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    fs.mkdir.mockResolvedValue(undefined)
    fs.readDir.mockResolvedValue([])
    fs.remove.mockResolvedValue(undefined)
    fs.writeTextFile.mockResolvedValue(undefined)
    useSaveFolder.setState({ dir: '/projets', projectFiles: {}, backups: true, backupEvery: 1, backupCount: 10, lastBackup: null, lastError: null })
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 13, 12, 0, 0))
    vi.stubGlobal('window', { setInterval, clearInterval })
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('retente après une erreur de disque, sans nouvelle modification du projet', async () => {
    const p = createProject('Concert')
    fs.writeTextFile.mockRejectedValueOnce(new Error('Disque absent'))
    const stop = startBackups(() => p)
    await vi.advanceTimersByTimeAsync(60_000)
    expect(fs.writeTextFile).toHaveBeenCalledTimes(1)
    expect(useSaveFolder.getState().lastError).toBe('Disque absent')
    await vi.advanceTimersByTimeAsync(30_000)
    expect(fs.writeTextFile).toHaveBeenCalledTimes(2)
    expect(useSaveFolder.getState().lastBackup).not.toBeNull()
    expect(useSaveFolder.getState().lastError).toBeNull()
    await vi.advanceTimersByTimeAsync(60_000)
    expect(fs.writeTextFile).toHaveBeenCalledTimes(2)
    stop()
  })

  it('respecte l’intervalle après réussite et sauvegarde la version modifiée', async () => {
    let p = createProject('Concert')
    const stop = startBackups(() => p)
    await vi.advanceTimersByTimeAsync(60_000)
    p = { ...p, name: 'Concert modifié' }
    await vi.advanceTimersByTimeAsync(30_000)
    expect(fs.writeTextFile).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(30_000)
    expect(fs.writeTextFile).toHaveBeenCalledTimes(2)
    expect(JSON.parse(fs.writeTextFile.mock.calls[1][1]).name).toBe('Concert modifié')
    stop()
  })

  it('ne lance pas deux sauvegardes automatiques pendant une écriture lente', async () => {
    let finish!: () => void
    fs.writeTextFile.mockImplementationOnce(() => new Promise<void>((resolve) => { finish = resolve }))
    const stop = startBackups(() => createProject('Concert'))
    await vi.advanceTimersByTimeAsync(120_000)
    expect(fs.writeTextFile).toHaveBeenCalledTimes(1)
    finish()
    await vi.advanceTimersByTimeAsync(0)
    expect(useSaveFolder.getState().lastBackup).not.toBeNull()
    stop()
  })

  it('la onzième sauvegarde supprime seulement la plus ancienne quand dix sont gardées', async () => {
    const old = Array.from({ length: 10 }, (_, n) => backupName('concert', new Date(2026, 9, 12, 12, n, 0)))
    const current = backupName('concert', new Date())
    fs.readDir.mockResolvedValue([...old, current, 'notes.txt'].map((name) => ({ name, isFile: true })))
    expect(await writeBackup(createProject('Concert'))).toBe(true)
    expect(fs.remove).toHaveBeenCalledExactlyOnceWith(`/projets/Sauvegardes/concert/${old[0]}`)
  })
})

describe('feuille dessinée sur le canevas (mode page)', () => {
  it('la zone de dessin commence à l\'origine et suit l\'échelle d\'impression', async () => {
    const { pageFrame } = await import('./exportOptions')
    const f100 = pageFrame({ paper: 'A3', orientation: 'landscape', printScale: 100 })
    const f50 = pageFrame({ paper: 'A3', orientation: 'landscape', printScale: 50 })
    expect(f100.area.x).toBe(0)
    expect(f100.area.y).toBe(0)
    // 1 unité = 0,25 mm à 100 % : la feuille A3 paysage (420 mm) fait 1680 unités
    expect(Math.round(f100.sheet.w)).toBe(1680)
    expect(Math.round(f50.sheet.w)).toBe(3360)
    expect(f100.titleBlock.x + f100.titleBlock.w).toBeLessThanOrEqual(f100.sheet.x + f100.sheet.w)
  })
  it('feuille ajustée : un petit schéma reste à 100 %, un grand fait grandir la feuille, centrée, cartouche compris', async () => {
    const { fittedPage } = await import('./exportOptions')
    const small = fittedPage({ paper: 'A3', orientation: 'landscape' }, 0, { x: 100, y: 100, w: 300, h: 200 })
    expect(small.scale).toBe(100)
    expect(small.area.x + small.area.w / 2).toBeCloseTo(250)
    // Stagebox 32 entrées (environ 700 unités de haut) : la feuille grandit, l'échelle baisse
    const big = fittedPage({ paper: 'A3', orientation: 'landscape' }, 0, { x: 0, y: 0, w: 260, h: 1100 })
    expect(big.scale).toBeLessThan(100)
    expect(big.area.h).toBeGreaterThanOrEqual(1100)
    expect(big.area.w / big.area.h).toBeCloseTo(small.area.w / small.area.h)
    // Le cartouche reste sur la feuille, hors de la zone de dessin
    expect(big.titleBlock.y + big.titleBlock.h).toBeLessThanOrEqual(big.sheet.y + big.sheet.h + 1e-6)
    expect(big.titleBlock.y).toBeGreaterThanOrEqual(big.area.y + big.area.h - 1e-6)
  })
})
