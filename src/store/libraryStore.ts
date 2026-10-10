// Modèles perso de l'utilisateur ("Mes modèles"), enregistrés sur l'ordinateur (IndexedDB).
import { get, set } from 'idb-keyval'
import { create } from 'zustand'
import { LIBRARY } from '../library'
import type { EquipmentTemplate } from '../model/types'
import { validateTemplate } from '../model/validateTemplate'

const KEY = 'avd.userLibrary'

interface LibraryState {
  userTemplates: EquipmentTemplate[]
  addUserTemplate: (t: EquipmentTemplate) => void
  removeUserTemplate: (id: string) => void
}

const persist = (list: EquipmentTemplate[]) => set(KEY, list).catch(() => undefined)

export const useLibrary = create<LibraryState>((setState, getState) => ({
  userTemplates: [],
  addUserTemplate: (t) => {
    const list = [...getState().userTemplates, t]
    setState({ userTemplates: list })
    persist(list)
  },
  removeUserTemplate: (id) => {
    const list = getState().userTemplates.filter((t) => t.id !== id)
    setState({ userTemplates: list })
    persist(list)
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
