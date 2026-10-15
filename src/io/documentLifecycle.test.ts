import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '../i18n'
import { createProject } from '../model/project'
import { useProject } from '../store/projectStore'
import { openDocument, prepareToLeave, setDocumentSessionActive } from './documentLifecycle'

const files = vi.hoisted(() => ({ saveProjectFile: vi.fn(), openProjectFile: vi.fn(), notifyError: vi.fn() }))
const recovery = vi.hoisted(() => ({ flushRecovery: vi.fn(), discardRecovery: vi.fn() }))
const dialog = vi.hoisted(() => ({ message: vi.fn() }))
vi.mock('@tauri-apps/api/core', () => ({ isTauri: () => true }))
vi.mock('@tauri-apps/plugin-dialog', () => dialog)
vi.mock('./files', () => files)
vi.mock('../store/persistence', () => recovery)

beforeEach(() => { vi.resetAllMocks(); setDocumentSessionActive(false); useProject.setState({ project: createProject('Concert'), saved: false }) })
afterEach(() => setDocumentSessionActive(false))
describe('changement et fermeture de document', () => {
  it('Annuler garde le document et ne lance aucune ouverture', async () => {
    const p = useProject.getState().project
    dialog.message.mockResolvedValue(i18n.t('series.cancel'))
    expect(await openDocument()).toBe(false)
    expect(useProject.getState().project).toBe(p)
    expect(files.openProjectFile).not.toHaveBeenCalled()
  })
  it('un échec d’enregistrement interdit le changement et garde le projet courant', async () => {
    dialog.message.mockResolvedValue(i18n.t('menu.save'))
    files.saveProjectFile.mockRejectedValue(new Error('Disque absent'))
    expect(await openDocument()).toBe(false)
    expect(files.notifyError).toHaveBeenCalled()
    expect(files.openProjectFile).not.toHaveBeenCalled()
  })
  it('attend la fin de l’écriture et refuse de fermer si une révision plus récente est apparue', async () => {
    dialog.message.mockResolvedValue(i18n.t('menu.save'))
    files.saveProjectFile.mockImplementation(async () => { useProject.getState().rename('Pendant la sauvegarde'); return true })
    expect(await prepareToLeave(true)).toBe(false)
  })
  it('le choix de ne pas enregistrer abandonne la récupération sans écrire le fichier principal', async () => {
    dialog.message.mockResolvedValue(i18n.t('storage.discard'))
    expect(await prepareToLeave(true)).toBe(true)
    expect(recovery.discardRecovery).toHaveBeenCalledOnce()
    expect(files.saveProjectFile).not.toHaveBeenCalled()
  })
  it('bloque le changement pendant une session, y compris chez l’hôte', async () => {
    setDocumentSessionActive(true); useProject.setState({ saved: true })
    expect(await openDocument()).toBe(false)
    expect(files.openProjectFile).not.toHaveBeenCalled()
    expect(await prepareToLeave(true)).toBe(true)
  })
  it('une récupération indisponible empêche la fermeture sans perdre le projet', async () => {
    recovery.flushRecovery.mockRejectedValueOnce(new Error('Stockage'))
    expect(await prepareToLeave(true)).toBe(false)
    expect(files.notifyError).toHaveBeenCalled()
  })
})
