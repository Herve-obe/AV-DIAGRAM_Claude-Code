// @vitest-environment jsdom
import { ReactFlowProvider } from '@xyflow/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '../i18n'
import { createProject } from '../model/project'
import type { EquipmentTemplate } from '../model/types'
import { useLibrary } from '../store/libraryStore'
import { useProject } from '../store/projectStore'
import { useUi } from '../store/uiStore'
import { buttonByName, click, mount, typeInto, type Mounted } from '../test-utils/dom'
import { LibraryPanel } from './LibraryPanel'

// Le stockage persistant n'existe pas hors du navigateur : les écritures sont sans effet
vi.mock('idb-keyval', () => ({ update: async () => undefined, get: async () => undefined, set: async () => undefined, del: async () => undefined, createStore: () => ({}) }))
// Bibliothèque réduite aux blocs génériques : le test ne dépend pas des fiches constructeur
vi.mock('../library', async () => {
  const { GENERIC_LIBRARY } = await import('../library/generic')
  return { LIBRARY: GENERIC_LIBRARY, LIBRARY_INDEX: new Map(GENERIC_LIBRARY.map((t) => [t.id, t])) }
})

const t = (k: string, o?: Record<string, unknown>) => i18n.t(k, o) as string
const Panel = () => <ReactFlowProvider><LibraryPanel /></ReactFlowProvider>
const items = (el: HTMLElement) => [...el.querySelectorAll<HTMLElement>('.library-list [role="button"]')]
const search = (el: HTMLElement) => el.querySelector<HTMLInputElement>('#library-search')!

let view: Mounted
beforeEach(() => {
  localStorage.clear()
  useProject.setState({ project: createProject('Test'), past: [], future: [] })
  useUi.setState({ mode: 'expert', layer: 'all', view: 'diagram', selectedEquipment: [], selectedLinks: [] })
  useLibrary.setState({ userTemplates: [] })
})
afterEach(() => view?.unmount())

describe('LibraryPanel', () => {
  it('la recherche déplie les menus et ne garde que les équipements correspondants', () => {
    view = mount(<Panel />)
    typeInto(search(view.element), 'caméra')
    const found = items(view.element)
    expect(found.length).toBeGreaterThan(0)
    expect(found.every(i => i.textContent!.toLowerCase().includes('caméra'))).toBe(true)
  })

  it('une recherche sans résultat affiche le message d’absence', () => {
    view = mount(<Panel />)
    typeInto(search(view.element), 'zzzz-introuvable')
    expect(items(view.element)).toHaveLength(0)
    expect(view.element.textContent).toContain(t('library.empty'))
  })

  it('un double-clic sur un équipement l’ajoute au projet et le sélectionne', () => {
    view = mount(<Panel />)
    typeInto(search(view.element), 'caméra')
    const item = items(view.element)[0]
    item.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
    const eqs = Object.values(useProject.getState().project.equipment)
    expect(eqs).toHaveLength(1)
    expect(useUi.getState().selectedEquipment).toEqual([eqs[0].id])
    expect(useProject.getState().past).toHaveLength(1) // annulable
  })

  it('sur un calque, la liste est filtrée et « Tout afficher » rétablit les équipements masqués', () => {
    useUi.setState({ layer: 'image' })
    view = mount(<Panel />)
    typeInto(search(view.element), 'console')
    const filtered = items(view.element).length
    click(buttonByName(view.element, t('library.layerShowAll')))
    expect(items(view.element).length).toBeGreaterThan(filtered)
  })

  it('l’onglet Mon entreprise est vide au départ, liste les modèles de l’utilisateur et permet de les retirer', () => {
    const mine = { id: 'user-test-1', family: 'passive', manufacturer: 'Acme', model: 'Boîtier test', pictogram: 'patch', ports: [], status: 'user' } as unknown as EquipmentTemplate
    view = mount(<Panel />)
    click(buttonByName(view.element, t('company.company')))
    expect(view.element.textContent).toContain(t('company.empty'))
    useLibrary.setState({ userTemplates: [mine] })
    view.render(<Panel />)
    expect(items(view.element)[0].textContent).toContain('Acme Boîtier test')
    click(buttonByName(view.element, t('library.removeMine')))
    expect(useLibrary.getState().userTemplates).toHaveLength(0)
  })

  it('« Nouveau bloc » ouvre le dialogue de création', () => {
    view = mount(<Panel />)
    expect(document.querySelector('[role="dialog"]')).toBeNull()
    click(buttonByName(view.element, t('library.newBlock')))
    expect(document.querySelector('[role="dialog"]')).not.toBeNull()
  })
})
