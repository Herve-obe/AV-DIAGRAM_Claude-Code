// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import i18n from '../i18n'
import { useLibrary } from '../store/libraryStore'
import { CatalogueImportDialog, startCatalogueImport } from './CatalogueImportDialog'
const actions = vi.hoisted(() => ({ pick: vi.fn(), read: vi.fn(), error: vi.fn(), update: vi.fn() }))
vi.mock('../io/pickFile', () => ({ pickFile: actions.pick }))
vi.mock('../io/xlsxRead', () => ({ readXlsx: actions.read }))
vi.mock('../io/files', () => ({ notifyError: actions.error }))
vi.mock('idb-keyval', () => ({ update: actions.update, get: vi.fn() }))
vi.mock('../library', () => ({ LIBRARY: [{ id: 'fictitious', manufacturer: 'Test', model: 'Micro 1', family: 'capture', pictogram: 'mic', status: 'verified', sources: [{ document: 'Notice de test fictive', accessed: '2026-10-22' }], ports: [{ id: 'out', name: 'Out', direction: 'out', signal: 'audioAnalog', connector: 'xlr3' }] }] }))
let element: HTMLDivElement, root: Root, stored: unknown
const button = (text: string) => [...element.querySelectorAll('button')].find(b => b.textContent === text)!
const click = (el: HTMLElement) => act(async () => el.click())
const open = () => act(async () => { await startCatalogueImport(k => i18n.t(k)) })
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); vi.clearAllMocks(); stored = undefined
  useLibrary.setState({ userTemplates: [] })
  actions.update.mockImplementation(async (_key, change) => { stored = change(stored) })
  actions.pick.mockResolvedValue({ name: 'Catalogue.csv', data: new TextEncoder().encode('Fabricant;Modèle;Tarif\nTest;Micro 1;123456\nTest;Micro 1;123456\nAutre;Nouveau;123456') })
  element = document.createElement('div'); document.body.append(element); root = createRoot(element)
  await act(async () => root.render(<CatalogueImportDialog />))
})
afterEach(async () => { await act(async () => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })) }); act(() => root.unmount()); element.remove() })
it('montre le bilan puis exige l’accord pour les prises non documentées avant l’enregistrement', async () => {
  await open()
  expect(element.querySelectorAll('tbody tr')).toHaveLength(2)
  expect(useLibrary.getState().userTemplates).toEqual([])
  expect(button('Ajouter à Mon entreprise').disabled).toBe(true)
  const ack = [...element.querySelectorAll('label')].find(l => l.textContent?.includes('Ajouter aussi les fiches'))!.querySelector('input')!
  await click(ack); await click(button('Ajouter à Mon entreprise'))
  expect(useLibrary.getState().userTemplates).toHaveLength(2)
  expect(useLibrary.getState().userTemplates[0].ports).toHaveLength(1)
  expect(useLibrary.getState().userTemplates[1]).toMatchObject({ portStatus: 'pending', ports: [] })
  expect(JSON.stringify(stored)).not.toContain('123456')
  expect(element.textContent).toContain('2 modèle(s) ajouté(s)')
})
it('lit un XLSX avec le lecteur existant et permet de choisir la famille d’un nouveau modèle', async () => {
  actions.pick.mockResolvedValue({ name: 'Catalogue.xlsx', data: new Uint8Array([1]) })
  actions.read.mockResolvedValue({ sheets: [{ name: 'Matériel', rows: [['Name'], ['Fictif']] }] })
  await open(); expect(actions.read).toHaveBeenCalledOnce()
  const select = element.querySelector<HTMLSelectElement>('tbody select')!
  await act(async () => { select.value = 'camera'; select.dispatchEvent(new Event('change', { bubbles: true })) })
  await click(element.querySelector<HTMLInputElement>('label input:not([aria-label])')!)
  await click(button('Ajouter à Mon entreprise'))
  expect(useLibrary.getState().userTemplates[0].family).toBe('camera')
})
it('ignore un fichier arrivé après l’annulation et laisse la bibliothèque intacte', async () => {
  let finish: (value: unknown) => void = () => undefined
  actions.pick.mockImplementation(() => new Promise(resolve => { finish = resolve }))
  let pending: Promise<void>
  await act(async () => { pending = startCatalogueImport(k => i18n.t(k)) })
  await click(element.querySelector<HTMLButtonElement>('[aria-label="Fermer"]')!)
  await act(async () => { finish({ name: 'tardif.csv', data: new TextEncoder().encode('Name\nFictif') }); await pending })
  expect(element.querySelector('[role="dialog"]')).toBeNull()
  expect(useLibrary.getState().userTemplates).toEqual([])
  expect(actions.update).not.toHaveBeenCalled()
})
