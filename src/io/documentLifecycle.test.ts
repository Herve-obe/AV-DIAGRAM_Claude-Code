import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '../i18n'
import { createProject } from '../model/project'
import { useProject } from '../store/projectStore'
import capability from '../../src-tauri/capabilities/default.json'
import { guardWindowClose, openDocument, prepareToLeave, setDocumentSessionActive } from './documentLifecycle'

const files = vi.hoisted(() => ({ saveProjectFile: vi.fn(), openProjectFile: vi.fn(), notifyError: vi.fn() }))
const recovery = vi.hoisted(() => ({ flushRecovery: vi.fn(), discardRecovery: vi.fn() }))
const dialog = vi.hoisted(() => ({ message: vi.fn() }))
const nativeWindow = vi.hoisted(() => ({ onCloseRequested: vi.fn(), close: vi.fn() }))
vi.mock('@tauri-apps/api/core', () => ({ isTauri: () => true }))
vi.mock('@tauri-apps/api/window', () => ({ getCurrentWindow: () => nativeWindow }))
vi.mock('@tauri-apps/plugin-dialog', () => dialog)
vi.mock('./files', () => files)
vi.mock('../store/persistence', () => recovery)

beforeEach(() => { vi.resetAllMocks(); setDocumentSessionActive(false); useProject.setState({ project: createProject('Concert'), saved: false }) })
afterEach(() => setDocumentSessionActive(false))
describe('changement et fermeture de document', () => {
  it('autorise la destruction native utilisée par Tauri après validation de la fermeture', () => {
    expect(capability.permissions).toContain('core:window:allow-destroy')
  })
  it('ferme après Ne pas enregistrer sans relancer une demande de fermeture', async () => {
    dialog.message.mockResolvedValue(i18n.t('storage.discard'))
    await guardWindowClose()
    const preventDefault = vi.fn()
    await nativeWindow.onCloseRequested.mock.calls[0][0]({ preventDefault })
    expect(preventDefault).not.toHaveBeenCalled()
    expect(nativeWindow.close).not.toHaveBeenCalled()
    expect(recovery.discardRecovery).toHaveBeenCalledOnce()
    expect(files.saveProjectFile).not.toHaveBeenCalled()
  })
  it('peut annuler la fermeture puis la demander de nouveau', async () => {
    dialog.message.mockResolvedValueOnce(i18n.t('series.cancel')).mockResolvedValueOnce(i18n.t('storage.discard'))
    await guardWindowClose()
    const closeRequested = nativeWindow.onCloseRequested.mock.calls[0][0]
    const cancelled = { preventDefault: vi.fn() }, confirmed = { preventDefault: vi.fn() }
    await closeRequested(cancelled)
    expect(cancelled.preventDefault).toHaveBeenCalledOnce()
    await closeRequested(confirmed)
    expect(confirmed.preventDefault).not.toHaveBeenCalled()
    expect(dialog.message).toHaveBeenCalledTimes(2)
  })
  it('garde la fenêtre ouverte si l’enregistrement échoue, puis autorise un nouvel essai', async () => {
    dialog.message.mockResolvedValue(i18n.t('menu.save'))
    files.saveProjectFile.mockRejectedValueOnce(new Error('Disque absent')).mockImplementationOnce(async () => { useProject.setState({ saved: true }); return true })
    await guardWindowClose()
    const closeRequested = nativeWindow.onCloseRequested.mock.calls[0][0]
    const failed = { preventDefault: vi.fn() }, retried = { preventDefault: vi.fn() }
    await closeRequested(failed)
    expect(failed.preventDefault).toHaveBeenCalledOnce()
    await closeRequested(retried)
    expect(retried.preventDefault).not.toHaveBeenCalled()
    expect(files.notifyError).toHaveBeenCalledOnce()
  })
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
