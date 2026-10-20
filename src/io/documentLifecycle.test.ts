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
const panelsWindow = vi.hoisted(() => ({ destroy: vi.fn() }))
const webviews = vi.hoisted(() => ({ getByLabel: vi.fn() }))
const layout = vi.hoisted(() => ({ saveDesktopLayout: vi.fn() }))
vi.mock('@tauri-apps/api/core', () => ({ isTauri: () => true }))
vi.mock('@tauri-apps/api/window', () => ({ getCurrentWindow: () => nativeWindow }))
vi.mock('@tauri-apps/api/webviewWindow', () => ({ WebviewWindow: webviews }))
vi.mock('@tauri-apps/plugin-dialog', () => dialog)
vi.mock('./files', () => files)
vi.mock('../store/persistence', () => recovery)
vi.mock('../store/windowLayout', () => layout)

beforeEach(() => {
  vi.resetAllMocks()
  webviews.getByLabel.mockResolvedValue(panelsWindow)
  panelsWindow.destroy.mockResolvedValue(undefined)
  setDocumentSessionActive(false)
  useProject.setState({ project: createProject('Concert'), saved: false })
})
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
    expect(webviews.getByLabel).toHaveBeenCalledWith('panels')
    expect(panelsWindow.destroy).toHaveBeenCalledOnce()
    expect(layout.saveDesktopLayout).toHaveBeenCalledWith(panelsWindow)
    expect(layout.saveDesktopLayout.mock.invocationCallOrder[0]).toBeLessThan(panelsWindow.destroy.mock.invocationCallOrder[0])
  })
  it('peut annuler la fermeture puis la demander de nouveau', async () => {
    dialog.message.mockResolvedValueOnce(i18n.t('series.cancel')).mockResolvedValueOnce(i18n.t('storage.discard'))
    await guardWindowClose()
    const closeRequested = nativeWindow.onCloseRequested.mock.calls[0][0]
    const cancelled = { preventDefault: vi.fn() }, confirmed = { preventDefault: vi.fn() }
    await closeRequested(cancelled)
    expect(cancelled.preventDefault).toHaveBeenCalledOnce()
    expect(panelsWindow.destroy).not.toHaveBeenCalled()
    expect(layout.saveDesktopLayout).not.toHaveBeenCalled()
    await closeRequested(confirmed)
    expect(confirmed.preventDefault).not.toHaveBeenCalled()
    expect(dialog.message).toHaveBeenCalledTimes(2)
    expect(panelsWindow.destroy).toHaveBeenCalledOnce()
  })
  it('garde la fenêtre ouverte si l’enregistrement échoue, puis autorise un nouvel essai', async () => {
    dialog.message.mockResolvedValue(i18n.t('menu.save'))
    files.saveProjectFile.mockRejectedValueOnce(new Error('Disque absent')).mockImplementationOnce(async () => { useProject.setState({ saved: true }); return true })
    await guardWindowClose()
    const closeRequested = nativeWindow.onCloseRequested.mock.calls[0][0]
    const failed = { preventDefault: vi.fn() }, retried = { preventDefault: vi.fn() }
    await closeRequested(failed)
    expect(failed.preventDefault).toHaveBeenCalledOnce()
    expect(panelsWindow.destroy).not.toHaveBeenCalled()
    await closeRequested(retried)
    expect(retried.preventDefault).not.toHaveBeenCalled()
    expect(files.notifyError).toHaveBeenCalledOnce()
    expect(panelsWindow.destroy).toHaveBeenCalledOnce()
  })
  it('attend la fermeture de la fenêtre Infos avant d’autoriser celle de la principale, même sans modification', async () => {
    useProject.setState({ saved: true })
    let finish!: () => void
    panelsWindow.destroy.mockImplementationOnce(() => new Promise<void>(resolve => { finish = resolve }))
    await guardWindowClose()
    const event = { preventDefault: vi.fn() }
    let completed = false
    const closing = nativeWindow.onCloseRequested.mock.calls[0][0](event).then(() => { completed = true })
    await vi.waitFor(() => expect(panelsWindow.destroy).toHaveBeenCalledOnce())
    expect(completed).toBe(false)
    expect(dialog.message).not.toHaveBeenCalled()
    const second = { preventDefault: vi.fn() }
    await nativeWindow.onCloseRequested.mock.calls[0][0](second)
    expect(second.preventDefault).toHaveBeenCalledOnce()
    expect(panelsWindow.destroy).toHaveBeenCalledOnce()
    finish(); await closing
    expect(event.preventDefault).not.toHaveBeenCalled()
    expect(nativeWindow.close).not.toHaveBeenCalled()
  })
  it('ne ferme Infos qu’après la fin d’un enregistrement réussi', async () => {
    dialog.message.mockResolvedValue(i18n.t('menu.save'))
    let finish!: () => void
    files.saveProjectFile.mockImplementationOnce(() => new Promise<boolean>(resolve => {
      finish = () => { useProject.setState({ saved: true }); resolve(true) }
    }))
    await guardWindowClose()
    const event = { preventDefault: vi.fn() }
    const closing = nativeWindow.onCloseRequested.mock.calls[0][0](event)
    await vi.waitFor(() => expect(files.saveProjectFile).toHaveBeenCalledOnce())
    expect(panelsWindow.destroy).not.toHaveBeenCalled()
    finish(); await closing
    expect(panelsWindow.destroy).toHaveBeenCalledOnce()
    expect(event.preventDefault).not.toHaveBeenCalled()
  })
  it('ferme normalement la principale si Infos a déjà été fermée', async () => {
    useProject.setState({ saved: true })
    webviews.getByLabel.mockResolvedValue(null)
    await guardWindowClose()
    const event = { preventDefault: vi.fn() }
    await nativeWindow.onCloseRequested.mock.calls[0][0](event)
    expect(event.preventDefault).not.toHaveBeenCalled()
    expect(panelsWindow.destroy).not.toHaveBeenCalled()
  })
  it('garde la principale ouverte si Infos refuse de se fermer, signale l’erreur et permet de réessayer', async () => {
    useProject.setState({ saved: true })
    panelsWindow.destroy.mockRejectedValueOnce(new Error('Accès refusé'))
    await guardWindowClose()
    const closeRequested = nativeWindow.onCloseRequested.mock.calls[0][0]
    const failed = { preventDefault: vi.fn() }, retried = { preventDefault: vi.fn() }
    await closeRequested(failed)
    expect(failed.preventDefault).toHaveBeenCalledOnce()
    expect(files.notifyError).toHaveBeenCalledWith(i18n.t('dual.closeError', { error: 'Error: Accès refusé' }))
    await closeRequested(retried)
    expect(retried.preventDefault).not.toHaveBeenCalled()
    expect(panelsWindow.destroy).toHaveBeenCalledTimes(2)
    expect(nativeWindow.close).not.toHaveBeenCalled()
  })
  it('une seconde demande pendant le dialogue ne ferme pas Infos avant la réponse', async () => {
    let answer!: (choice: string) => void
    dialog.message.mockImplementationOnce(() => new Promise<string>(resolve => { answer = resolve }))
    await guardWindowClose()
    const closeRequested = nativeWindow.onCloseRequested.mock.calls[0][0]
    const first = { preventDefault: vi.fn() }, second = { preventDefault: vi.fn() }
    const closing = closeRequested(first)
    await vi.waitFor(() => expect(dialog.message).toHaveBeenCalledOnce())
    await closeRequested(second)
    expect(second.preventDefault).toHaveBeenCalledOnce()
    expect(panelsWindow.destroy).not.toHaveBeenCalled()
    answer(i18n.t('storage.discard')); await closing
    expect(first.preventDefault).not.toHaveBeenCalled()
    expect(panelsWindow.destroy).toHaveBeenCalledOnce()
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
