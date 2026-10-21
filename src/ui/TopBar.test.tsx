// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import '../i18n'
import { useUi } from '../store/uiStore'
import { useAi } from '../store/aiStore'
import { TopBar } from './TopBar'
import { InterfaceSettings } from './InterfaceSettings'
import { DEFAULT_TOOLBAR, toolbarPreference } from './topBarActions'

const actions = vi.hoisted(() => ({ save: vi.fn(), open: vi.fn(), fit: vi.fn() }))
vi.mock('../io/documentLifecycle', () => ({ saveCurrentProject: actions.save, openDocument: actions.open }))
vi.mock('@xyflow/react', async original => ({ ...await original<typeof import('@xyflow/react')>(), useReactFlow: () => ({ fitView: actions.fit, getNodes: () => [], getInternalNode: () => undefined }) }))
vi.mock('../library', async () => ({ LIBRARY: (await import('../library/generic')).GENERIC_LIBRARY }))

let element: HTMLDivElement, root: Root
const click = (el: Element) => act(async () => (el as HTMLElement).click())
const key = (el: Element, value: string) => act(async () => el.dispatchEvent(new KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true })))
const item = (text: string) => [...element.querySelectorAll('button[role="menuitem"]')].find(b => (b.querySelector('span')?.textContent ?? b.textContent) === text)!
const draw = (settings = false) => act(async () => root.render(<><TopBar />{settings && <InterfaceSettings />}</>))
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); vi.clearAllMocks(); localStorage.clear()
  useUi.setState({ toolbar: [...DEFAULT_TOOLBAR], view: 'diagram', settingsOpen: false, mode: 'expert', theme: 'system', lang: 'fr' })
  useAi.setState({ settings: { enabled: false, consent: false } })
  element = document.createElement('div'); document.body.append(element); root = createRoot(element)
})
afterEach(() => { act(() => root.unmount()); element.remove() })

it('migre les anciennes préférences et filtre les commandes inconnues sans rétablir les boutons masqués', () => {
  expect(toolbarPreference(undefined)).toEqual(DEFAULT_TOOLBAR)
  expect(toolbarPreference({})).toEqual(DEFAULT_TOOLBAR)
  expect(toolbarPreference(['manual', 'save', 'manual', 'unknown', null, {}])).toEqual(['manual', 'save'])
  expect(toolbarPreference([])).toEqual([])
})
it('allège la barre, conserve les imports et distingue Enregistrer / Enregistrer sous', async () => {
  await draw()
  expect(element.querySelectorAll('.quick-toolbar button')).toHaveLength(5)
  expect(element.querySelector<HTMLButtonElement>('.assistant-btn')?.disabled).toBe(true)
  await click(item('Fichier'))
  for (const text of ['Importer DXF / DWG', 'Importer draw.io / Visio', 'Enregistrer sous…']) expect(item(text)).toBeDefined()
  await click(item('Enregistrer sous…')); expect(actions.save).toHaveBeenCalledExactlyOnceWith(true)
  await click(element.querySelector('.quick-toolbar button[aria-label="Enregistrer"]')!)
  expect(actions.save.mock.calls.at(-1)).toEqual([])
  act(() => useUi.setState({ view: 'lists' })); await click(item('Fichier'))
  expect((item('Exporter · Image PNG') as HTMLButtonElement).disabled).toBe(true)
})
it('navigue au clavier, ignore les commandes désactivées et rend le focus au menu', async () => {
  await draw(); const file = item('Fichier') as HTMLButtonElement
  act(() => file.focus()); await key(file, 'ArrowDown')
  expect(document.activeElement?.textContent).toContain('Nouveau')
  const globalKey = vi.fn(); window.addEventListener('keydown', globalKey)
  await key(document.activeElement!, 'r')
  await key(document.activeElement!, 'Delete')
  await key(document.activeElement!, 'F5')
  expect(globalKey).not.toHaveBeenCalled(); window.removeEventListener('keydown', globalKey)
  await key(document.activeElement!, 'ArrowRight')
  expect(element.querySelector('[role="menu"]')?.getAttribute('aria-labelledby')).toBe('app-menu-edit')
  expect(document.activeElement?.getAttribute('role')).toBe('menu')
  await key(document.activeElement!, 'Escape')
  expect(document.activeElement).toBe(item('Édition'))
  expect(element.querySelector('[role="menu"]')).toBeNull()
})
it('ouvre la personnalisation et persiste le choix, l’ordre et le rétablissement des raccourcis', async () => {
  await draw(true)
  await click(item('Outils')); await click(item('Personnaliser les raccourcis…'))
  expect(useUi.getState()).toMatchObject({ settingsOpen: true, settingsTab: 'interface' })
  const checkbox = (id: string) => [...element.querySelectorAll('.toolbar-options li')].find(li => li.textContent?.includes(id))!.querySelector('input')!
  await click(checkbox('Enregistrer sous'))
  expect(useUi.getState().toolbar.at(-1)).toBe('saveAs')
  const up = [...element.querySelectorAll('button')].find(b => b.getAttribute('aria-label') === 'Monter Enregistrer sous…')!
  await click(up)
  expect(useUi.getState().toolbar.at(-2)).toBe('saveAs')
  await click(checkbox('Ouvrir'))
  expect(element.querySelector('.quick-toolbar button[aria-label="Ouvrir…"]')).toBeNull()
  expect(JSON.parse(localStorage.getItem('avd.prefs')!).toolbar).toEqual(useUi.getState().toolbar)
  await click([...element.querySelectorAll('button')].find(b => b.textContent === 'Rétablir les raccourcis par défaut')!)
  expect(useUi.getState().toolbar).toEqual(DEFAULT_TOOLBAR)
})
