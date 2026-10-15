import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createProject } from '../model/project'
import { useProject } from './projectStore'
import { useSaveFolder } from './saveFolderStore'
import { flushRecovery, forgetRecent, listRecent, loadRecent, restoreProject, startAutosave } from './persistence'

const data = vi.hoisted(() => new Map<string, unknown>())
const disk = vi.hoisted(() => ({ readProjectFile: vi.fn() }))
vi.mock('idb-keyval', () => ({ get: async (k: string) => data.get(k), set: async (k: string, v: unknown) => { data.set(k, v) }, del: async (k: string) => { data.delete(k) } }))
vi.mock('../io/files', () => disk)
beforeEach(() => { data.clear(); useSaveFolder.setState({ projectFiles: {} }); vi.useFakeTimers() })
afterEach(() => vi.useRealTimers())
describe('récupération locale et raccourcis récents', () => {
  it('le neuvième projet et le retrait d’un raccourci ne suppriment aucun ancien projet', async () => {
    const stop = startAutosave(), ids: string[] = []
    for (let n = 0; n < 9; n++) {
      const p = createProject('Projet ' + n); ids.push(p.id)
      useProject.getState().load(p); await flushRecovery()
    }
    expect(await listRecent()).toHaveLength(8)
    expect(await loadRecent(ids[0])).not.toBeNull()
    await forgetRecent(ids[8])
    expect(await loadRecent(ids[8])).not.toBeNull()
    stop()
  })
  it('capture le projet sortant quand on change de projet avant le délai de 600 ms', async () => {
    const stop = startAutosave(), a = createProject('A'), b = createProject('B')
    useProject.getState().load(a); useProject.getState().rename('A modifié')
    useProject.getState().load(b)
    await flushRecovery()
    expect((await loadRecent(a.id))?.name).toBe('A modifié')
    expect((await loadRecent(b.id))?.name).toBe('B')
    stop()
  })
  it('la récupération ne marque jamais le fichier principal comme enregistré', async () => {
    const stop = startAutosave(), p = createProject('A')
    useProject.getState().load(p); useProject.getState().rename('B')
    await vi.advanceTimersByTimeAsync(600)
    expect(useProject.getState().saved).toBe(false)
    await restoreProject()
    expect(useProject.getState().project.name).toBe('B')
    expect(useProject.getState().saved).toBe(false)
    stop(); await flushRecovery()
  })
  it('un récent associé relit le fichier physique au lieu de la copie interne', async () => {
    const p = createProject('Sur disque')
    useSaveFolder.getState().setProjectFile(p.id, '/p/a.avd')
    data.set('avd.project.' + p.id, { ...p, name: 'Cache' })
    disk.readProjectFile.mockResolvedValue(p)
    expect((await loadRecent(p.id))?.name).toBe('Sur disque')
  })
})
