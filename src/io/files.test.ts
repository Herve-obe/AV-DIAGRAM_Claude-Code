import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createProject } from '../model/project'
import { useProject } from '../store/projectStore'
import { useSaveFolder } from '../store/saveFolderStore'
import { createProjectFile, openProjectFile, saveProjectFile } from './files'

const fs = vi.hoisted(() => ({ writeTextFile: vi.fn(), readTextFile: vi.fn(), exists: vi.fn() }))
const dialog = vi.hoisted(() => ({ save: vi.fn(), open: vi.fn() }))
vi.mock('@tauri-apps/api/core', () => ({ isTauri: () => true }))
vi.mock('@tauri-apps/plugin-fs', () => fs)
vi.mock('@tauri-apps/plugin-dialog', () => dialog)
vi.mock('@tauri-apps/api/path', () => ({ join: async (...p: string[]) => p.join('/') }))

beforeEach(() => { vi.resetAllMocks(); fs.writeTextFile.mockResolvedValue(undefined); useSaveFolder.setState({ dir: '/p', projectFiles: {} }) })
afterEach(() => vi.restoreAllMocks())
describe('fichier principal enregistré manuellement', () => {
  it('Ctrl+S remplace le fichier associé sans dialogue et marque uniquement sa version comme enregistrée', async () => {
    const p = createProject('Concert')
    useProject.setState({ project: p, saved: false })
    useSaveFolder.getState().setProjectFile(p.id, '/p/concert.avd')
    expect(await saveProjectFile(p)).toBe(true)
    expect(fs.writeTextFile).toHaveBeenCalledExactlyOnceWith('/p/concert.avd', JSON.stringify(p, null, 2))
    expect(dialog.save).not.toHaveBeenCalled()
    expect(useProject.getState().saved).toBe(true)
  })
  it('une écriture ancienne n’annonce pas une nouvelle modification comme enregistrée et les écritures restent ordonnées', async () => {
    const p = createProject('Concert'), newer = { ...p, name: 'Révision suivante' }
    useProject.setState({ project: p, saved: false })
    useSaveFolder.getState().setProjectFile(p.id, '/p/concert.avd')
    let finish!: () => void
    fs.writeTextFile.mockImplementationOnce(() => new Promise<void>(r => { finish = r }))
    const first = saveProjectFile(p)
    await vi.waitFor(() => expect(fs.writeTextFile).toHaveBeenCalledTimes(1))
    useProject.setState({ project: newer, saved: false })
    const second = saveProjectFile(newer)
    expect(fs.writeTextFile).toHaveBeenCalledTimes(1)
    finish(); await first
    expect(useProject.getState().saved).toBe(false)
    await second
    expect(JSON.parse(fs.writeTextFile.mock.calls[1][1]).name).toBe('Révision suivante')
    expect(useProject.getState().saved).toBe(true)
  })
  it('un échec suivi d’une annulation garde le projet non enregistré', async () => {
    const p = createProject('Concert')
    useProject.setState({ project: p, saved: false })
    useSaveFolder.getState().setProjectFile(p.id, '/p/concert.avd')
    fs.writeTextFile.mockRejectedValueOnce(new Error('Disque absent'))
    dialog.save.mockResolvedValue(null)
    expect(await saveProjectFile(p)).toBe(false)
    expect(useProject.getState().saved).toBe(false)
  })
  it('crée un nouveau fichier sans écraser un homonyme et ne change pas le document courant si l’écriture échoue', async () => {
    const p = createProject('Concert'), current = useProject.getState().project
    fs.exists.mockResolvedValueOnce(true).mockResolvedValueOnce(false)
    expect(await createProjectFile(p, '/p')).toBe('/p/concert-2.avd')
    fs.exists.mockResolvedValue(false); fs.writeTextFile.mockRejectedValueOnce(new Error('Disque'))
    await expect(createProjectFile(createProject('Autre'), '/p')).rejects.toThrow('Disque')
    expect(useProject.getState().project).toBe(current)
  })
  it('lire un candidat à fusionner ne change pas l’emplacement du fichier principal', async () => {
    const p = createProject('Concert')
    dialog.open.mockResolvedValue('/ailleurs/autre.avd'); fs.readTextFile.mockResolvedValue(JSON.stringify(p))
    await openProjectFile(false)
    expect(useSaveFolder.getState().projectFiles[p.id]).toBeUndefined()
  })
})
