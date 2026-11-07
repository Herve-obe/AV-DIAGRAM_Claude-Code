import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createProject } from '../model/project'
import { useProject } from '../store/projectStore'
import { useSaveFolder } from '../store/saveFolderStore'
import { createProjectFile, openProjectFile, projectFolderName, saveContent, saveMany, saveProjectFile } from './files'
import { writeBackup } from './backups'

const fs = vi.hoisted(() => ({ writeTextFile: vi.fn(), writeFile: vi.fn(), readTextFile: vi.fn(), exists: vi.fn(), mkdir: vi.fn(), readDir: vi.fn(), remove: vi.fn() }))
const dialog = vi.hoisted(() => ({ save: vi.fn(), open: vi.fn(), message: vi.fn() }))
vi.mock('@tauri-apps/api/core', () => ({ isTauri: () => true }))
vi.mock('@tauri-apps/plugin-fs', () => fs)
vi.mock('@tauri-apps/plugin-dialog', () => dialog)
vi.mock('@tauri-apps/api/path', () => ({ join: async (...p: string[]) => p.join('/'), dirname: async (p: string) => p.slice(0, p.lastIndexOf('/')) }))

beforeEach(() => {
  vi.resetAllMocks()
  dialog.message.mockResolvedValue(undefined)
  fs.writeTextFile.mockResolvedValue(undefined)
  fs.mkdir.mockResolvedValue(undefined)
  fs.exists.mockResolvedValue(false)
  fs.readDir.mockResolvedValue([])
  useSaveFolder.setState({ dir: '/p', projectFiles: {}, savedToFile: [], backups: true })
})
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
  it('lire un candidat à fusionner ne change pas l’emplacement du fichier principal', async () => {
    const p = createProject('Concert')
    dialog.open.mockResolvedValue('/ailleurs/autre.avd'); fs.readTextFile.mockResolvedValue(JSON.stringify(p))
    await openProjectFile(false)
    expect(useSaveFolder.getState().projectFiles[p.id]).toBeUndefined()
  })
})

describe('dossier autonome à la création', () => {
  it('crée le .avd et Save Back Up dans le dossier nommé, puis Ctrl+S et les copies automatiques le réutilisent', async () => {
    const p = createProject('Concert été')
    expect(await createProjectFile(p, '/p')).toBe('/p/Concert été/concert-ete.avd')
    expect(fs.mkdir.mock.calls).toEqual([['/p/Concert été'], ['/p/Concert été/Save Back Up']])
    expect(useSaveFolder.getState().dir).toBe('/p')
    useProject.setState({ project: p, saved: false })
    const modified = { ...p, name: 'Concert modifié' }
    await saveProjectFile(modified)
    expect(fs.writeTextFile.mock.calls[1][0]).toBe('/p/Concert été/concert-ete.avd')
    expect(dialog.save).not.toHaveBeenCalled()
    expect(await writeBackup(modified)).toBe(true)
    expect(fs.writeTextFile.mock.calls[2][0]).toMatch(/^\/p\/Concert été\/Save Back Up\/project-[0-9a-f]+\//)
    expect(await createProjectFile(createProject('Suivant'), '/p')).toBe('/p/Suivant/suivant.avd')
  })
  it('ne réutilise aucun dossier ou fichier homonyme, même en cas de création simultanée', async () => {
    fs.exists.mockResolvedValueOnce(true).mockResolvedValueOnce(false).mockResolvedValueOnce(true)
    fs.mkdir.mockRejectedValueOnce(new Error('Already exists'))
    expect(await createProjectFile(createProject('Concert'), '/p')).toBe('/p/Concert (3)/concert.avd')
    expect(fs.mkdir).not.toHaveBeenCalledWith('/p/Concert')
    expect(fs.writeTextFile.mock.calls.map(c => c[0])).toEqual(['/p/Concert (3)/concert.avd'])
    expect(fs.remove).not.toHaveBeenCalled()
    expect(dialog.message).toHaveBeenCalledWith(expect.stringContaining('/p/Concert (3)'), expect.objectContaining({ kind: 'info' }))
  })
  it.each(['mkdir', 'backup', 'write'])('un échec à l’étape %s garde le document courant et ne mémorise aucun faux enregistrement', async step => {
    const p = createProject('Autre'), current = useProject.getState().project
    if (step === 'mkdir') fs.mkdir.mockRejectedValueOnce(new Error('Disque'))
    else if (step === 'backup') fs.mkdir.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('Disque'))
    else fs.writeTextFile.mockRejectedValueOnce(new Error('Disque'))
    await expect(createProjectFile(p, '/p')).rejects.toThrow('Disque')
    expect(useProject.getState().project).toBe(current)
    expect(useSaveFolder.getState().projectFiles[p.id]).toBeUndefined()
    expect(useSaveFolder.getState().savedToFile).not.toContain(p.id)
    if (step !== 'write') expect(fs.writeTextFile).not.toHaveBeenCalled()
  })
  it('conserve le dossier parent par défaut même si aucun emplacement n’était configuré', async () => {
    useSaveFolder.setState({ dir: null, backups: false })
    await createProjectFile(createProject('Concert'), '/choisi')
    expect(useSaveFolder.getState().dir).toBe('/choisi')
    expect(fs.mkdir).toHaveBeenCalledWith('/choisi/Concert/Save Back Up')
  })
  it.each([
    ['  Concert été  ', 'Concert été'], ['../CON:live?*', '..-CON-live--'], ['..', 'Projet'],
    ['CON', '_CON'], ['aux.txt', '_aux.txt'], ['LPT1', '_LPT1'], ['Concert... ', 'Concert'],
    ['A/B\\C', 'A-B-C'], ['é'.repeat(100), 'é'.repeat(80)],
  ])('adapte le nom de dossier %s sans perdre les accents ou créer de chemin', (name, expected) => {
    expect(projectFolderName(name)).toBe(expected)
  })
})

describe('destinations proposées pour les fichiers du projet', () => {
  it('propose le dossier du .avd pour les exports simples et multiples', async () => {
    const p = createProject('Concert')
    useProject.setState({ project: p })
    useSaveFolder.getState().setProjectFile(p.id, '/ailleurs/Concert/concert.avd')
    dialog.save.mockResolvedValue(null); dialog.open.mockResolvedValue(null)
    expect(await saveContent('concert.pdf', new Uint8Array(), 'application/pdf')).toBe(false)
    expect(dialog.save.mock.calls[0][0].defaultPath).toBe('/ailleurs/Concert/concert.pdf')
    expect(await saveMany([{ name: 'concert.pdf', content: new Uint8Array(), mime: 'application/pdf' }])).toBe(0)
    expect(dialog.open.mock.calls[0][0].defaultPath).toBe('/ailleurs/Concert')
  })
  it('Enregistrer sous change le fichier associé, sans déplacer les anciens fichiers', async () => {
    const p = createProject('Concert')
    useProject.setState({ project: p, saved: false })
    useSaveFolder.getState().setProjectFile(p.id, '/ancien/concert.avd')
    dialog.save.mockResolvedValueOnce('/nouveau/copie.avd').mockResolvedValueOnce(null)
    expect(await saveProjectFile(p, { as: true })).toBe(true)
    expect(dialog.save.mock.calls[0][0].defaultPath).toBe('/ancien/concert.avd')
    expect(useSaveFolder.getState().projectFiles[p.id]).toBe('/nouveau/copie.avd')
    await saveContent('export.csv', '', 'text/csv')
    expect(dialog.save.mock.calls[1][0].defaultPath).toBe('/nouveau/export.csv')
    expect(fs.mkdir).not.toHaveBeenCalled()
    expect(fs.remove).not.toHaveBeenCalled()
  })
  it('utilise le dossier global pour un projet sans fichier', async () => {
    dialog.save.mockResolvedValue(null)
    await saveContent('export.csv', '', 'text/csv')
    expect(dialog.save.mock.calls[0][0].defaultPath).toBe('/p/export.csv')
  })
})
