// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from 'vitest'
const db = vi.hoisted(() => ({ get: vi.fn(), update: vi.fn() }))
vi.mock('idb-keyval', () => db)
vi.mock('../library', async () => ({ LIBRARY: (await import('../library/generic')).GENERIC_LIBRARY }))
import { useLibrary } from './libraryStore'
import type { EquipmentTemplate } from '../model/types'
const fixture = (id = 'user-test'): EquipmentTemplate => ({ id, manufacturer: 'Test', model: 'Modèle fictif', family: 'camera', pictogram: 'camera', status: 'user', ports: [], portStatus: 'pending' })
let stored: EquipmentTemplate[] | undefined
beforeEach(() => { vi.resetAllMocks(); stored = undefined; db.update.mockImplementation(async (_key, change) => { stored = change(stored) }); useLibrary.setState({ userTemplates: [] }) })
it('enregistre le lot local avant de l’afficher et ignore les identités déjà importées', async () => {
  expect(await useLibrary.getState().importTemplates([fixture(), fixture('user-duplicate')])).toBe(1)
  expect(stored).toHaveLength(1); expect(useLibrary.getState().userTemplates).toHaveLength(1)
  expect(await useLibrary.getState().importTemplates([fixture('user-next')])).toBe(0)
  expect(stored).toHaveLength(1)
})
it('préserve la bibliothèque si le stockage échoue ou si un modèle est invalide', async () => {
  db.update.mockRejectedValueOnce(new Error('storage'))
  await expect(useLibrary.getState().importTemplates([fixture()])).rejects.toThrow('storage')
  expect(useLibrary.getState().userTemplates).toEqual([])
  await expect(useLibrary.getState().importTemplates([{ ...fixture(), status: 'verified' }])).rejects.toThrow('invalid')
  expect(db.update).toHaveBeenCalledOnce()
})
it('fusionne le stockage de l’autre fenêtre sans perdre une modification locale pendant l’écriture', async () => {
  const other = { ...fixture('user-other'), model: 'Autre modèle fictif' }
  stored = [other]
  const local = { ...fixture('user-local'), model: 'Modèle local fictif' }
  db.update.mockImplementationOnce(async (_key, change) => { stored = change(stored); useLibrary.getState().addUserTemplate(local) })
  expect(await useLibrary.getState().importTemplates([fixture()])).toBe(1)
  expect(useLibrary.getState().userTemplates.map(t => t.id)).toEqual(['user-other', 'user-test', 'user-local'])
  expect(stored?.map(t => t.id)).toEqual(['user-other', 'user-test', 'user-local'])
})
