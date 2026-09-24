// Bibliothèque complète : blocs génériques + fiches constructeur (src/library/devices/*.json).
// Une fiche invalide est écartée (et signalée dans la console) plutôt que de casser l'application.
import { validateTemplate } from '../model/validateTemplate'
import type { EquipmentTemplate } from '../model/types'
import { GENERIC_LIBRARY } from './generic'

const files = import.meta.glob<EquipmentTemplate>('./devices/*.json', { eager: true, import: 'default' })

export const DEVICE_LIBRARY: EquipmentTemplate[] = Object.entries(files).flatMap(([path, tpl]) => {
  const errors = validateTemplate(tpl)
  if (errors.length) {
    console.warn(`Fiche ignorée ${path} :`, errors)
    return []
  }
  return [tpl]
})

export const LIBRARY: EquipmentTemplate[] = [...DEVICE_LIBRARY, ...GENERIC_LIBRARY]
export const LIBRARY_INDEX = new Map(LIBRARY.map((t) => [t.id, t]))
