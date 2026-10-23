// Modèles perso de l'utilisateur ("Mes modèles"), enregistrés sur l'ordinateur (IndexedDB).
import { get, update } from 'idb-keyval'
import { create } from 'zustand'
import { LIBRARY } from '../library'
import type { EquipmentTemplate } from '../model/types'
import { validateTemplate } from '../model/validateTemplate'
import { catalogueIdentity } from '../model/catalogueImport'

const KEY = 'avd.userLibrary'

interface LibraryState {
  userTemplates: EquipmentTemplate[]
  setCompanyQuantity: (id: string, quantity: number | undefined) => Promise<boolean>
  addUserTemplate: (t: EquipmentTemplate) => void
  removeUserTemplate: (id: string) => void
  importTemplates: (templates: EquipmentTemplate[]) => Promise<number>
}

const persist = (change: (list: EquipmentTemplate[]) => EquipmentTemplate[]) => update<EquipmentTemplate[]>(KEY, stored => change(stored ?? [])).catch(() => undefined)

export const useLibrary = create<LibraryState>((setState, getState) => ({
  userTemplates: [],
  setCompanyQuantity: async (id, quantity) => {
    const template = getState().userTemplates.find(t => t.id === id)
    if (!template || validateTemplate({ ...template, companyQuantity: quantity }).length) return false
    const change = (list: EquipmentTemplate[]) => list.map(t => t.id === id ? { ...t, companyQuantity: quantity } : t)
    setState({ userTemplates: change(getState().userTemplates) })
    try { await update<EquipmentTemplate[]>(KEY, stored => change(stored ?? getState().userTemplates)); return true }
    catch { return false }
  },
  importTemplates: async templates => {
    if (templates.some(t => validateTemplate(t).length || t.status !== 'user' || !t.id.startsWith('user-'))) throw new Error('invalid')
    const before = getState().userTemplates
    let next: EquipmentTemplate[] = [], count = 0
    await update<EquipmentTemplate[]>(KEY, stored => {
      const base = stored ?? before
      if (!Array.isArray(base) || base.some(t => validateTemplate(t).length)) throw new Error('invalid')
      const ids = new Set([...LIBRARY, ...base].map(t => t.id)), identities = new Set(base.map(catalogueIdentity))
      const added = templates.filter(t => { const key = catalogueIdentity(t); if (ids.has(t.id) || identities.has(key)) return false; ids.add(t.id); identities.add(key); return true })
      count = added.length; next = [...base, ...added]; return next
    })
    // Une autre fenêtre peut avoir ajouté un modèle ; l'écriture fusionne le stockage, pas un ancien instantané.
    const current = getState().userTemplates
    if (current !== before) {
      const previousIds = new Set(before.map(t => t.id)), currentIds = new Set(current.map(t => t.id))
      next = next.filter(t => !previousIds.has(t.id) || currentIds.has(t.id))
      for (const t of current) if (!previousIds.has(t.id) && !next.some(n => n.id === t.id)) next.push(t)
    }
    setState({ userTemplates: next })
    return count
  },
  addUserTemplate: (t) => {
    const list = [...getState().userTemplates, t]
    setState({ userTemplates: list })
    persist(current => [...current.filter(existing => existing.id !== t.id), t])
  },
  removeUserTemplate: (id) => {
    const list = getState().userTemplates.filter((t) => t.id !== id)
    setState({ userTemplates: list })
    persist(current => current.filter(t => t.id !== id))
  },
}))

export async function restoreUserLibrary(): Promise<void> {
  try {
    const stored = await get<EquipmentTemplate[]>(KEY)
    if (Array.isArray(stored)) useLibrary.setState({ userTemplates: stored.filter((t) => validateTemplate(t).length === 0) })
  } catch {
    // IndexedDB indisponible : pas de modèles perso
  }
}

/** Retrouve un modèle par son identifiant : modèles perso, fiches constructeur puis génériques. */
export function getTemplate(id: string): EquipmentTemplate | undefined {
  return useLibrary.getState().userTemplates.find((t) => t.id === id) ?? LIBRARY.find((t) => t.id === id)
}

/** Bloc vide, point de départ d'un équipement personnalisé. */
export const BLANK_TEMPLATE: EquipmentTemplate = {
  id: 'user-blank',
  family: 'passive',
  model: 'Bloc personnalisé',
  pictogram: 'patch',
  ports: [],
  status: 'user',
}
