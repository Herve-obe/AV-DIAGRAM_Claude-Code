// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { PhysicalPosition, PhysicalSize } from '@tauri-apps/api/dpi'
import type { Monitor, Window } from '@tauri-apps/api/window'
import { fitWindowPlace, rememberWindowPlace, restoreMainWindow, restoreWindowPlace, saveDesktopLayout, saveWindowPlace, shouldRestorePanels } from './windowLayout'
import config from '../../src-tauri/tauri.conf.json'
import capability from '../../src-tauri/capabilities/default.json'

const native = vi.hoisted(() => ({ label: 'main', outerPosition: vi.fn(), innerSize: vi.fn(), outerSize: vi.fn(), isMaximized: vi.fn(), isFullscreen: vi.fn(), isMinimized: vi.fn(), setPosition: vi.fn(), setSize: vi.fn(), maximize: vi.fn(), setFullscreen: vi.fn(), show: vi.fn(), onMoved: vi.fn(), onResized: vi.fn(), onCloseRequested: vi.fn() }))
const monitors = vi.hoisted(() => vi.fn())
vi.mock('@tauri-apps/api/core', () => ({ isTauri: () => true }))
vi.mock('@tauri-apps/api/window', () => ({ getCurrentWindow: () => native, availableMonitors: monitors }))
const w = native as unknown as Window
const screen = (x = 0): Monitor => ({ name: 'Écran', position: new PhysicalPosition(x, 0), size: new PhysicalSize(1920, 1080), workArea: { position: new PhysicalPosition(x, 0), size: new PhysicalSize(1920, 1040) }, scaleFactor: 1 })
const normal = { x: 100, y: 80, w: 1100, h: 700, maximized: false, fullscreen: false, monitorX: 0, monitorY: 0 }
const saved = () => JSON.parse(localStorage.getItem('avd.mainPlace')!)

beforeEach(() => {
  vi.resetAllMocks(); localStorage.clear(); native.label = 'main'
  native.outerPosition.mockResolvedValue({ x: 100, y: 80 }); native.innerSize.mockResolvedValue({ width: 1100, height: 700 }); native.outerSize.mockResolvedValue({ width: 1116, height: 740 })
  native.isMaximized.mockResolvedValue(false); native.isFullscreen.mockResolvedValue(false); native.isMinimized.mockResolvedValue(false)
  monitors.mockResolvedValue([screen()])
})
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers() })

it('premier lancement : agrandit avant de montrer, sans perdre la taille normale', async () => {
  expect(config.app.windows[0].visible).toBe(false)
  await restoreMainWindow()
  expect(native.maximize).toHaveBeenCalledOnce()
  expect(native.maximize.mock.invocationCallOrder[0]).toBeLessThan(native.show.mock.invocationCallOrder[0])
  expect(saved()).toMatchObject({ w: 1100, h: 700, maximized: true, fullscreen: false })
})

it('restaure la position extérieure et la taille intérieure, sans additionner les bordures à chaque ouverture', async () => {
  localStorage.setItem('avd.mainPlace', JSON.stringify(normal))
  await restoreMainWindow()
  expect(native.setPosition).toHaveBeenCalledWith(new PhysicalPosition(100, 80))
  expect(native.setSize).toHaveBeenCalledWith(new PhysicalSize(1100, 700))
  expect(native.maximize).not.toHaveBeenCalled(); expect(native.setFullscreen).not.toHaveBeenCalled()
})

it('mémorise une fenêtre agrandie sur un autre écran en gardant sa taille normale', async () => {
  localStorage.setItem('avd.mainPlace', JSON.stringify(normal)); monitors.mockResolvedValue([screen(), screen(1920)])
  native.isMaximized.mockResolvedValue(true); native.outerPosition.mockResolvedValue({ x: 1920, y: 0 }); native.innerSize.mockResolvedValue({ width: 1920, height: 1040 }); native.outerSize.mockResolvedValue({ width: 1920, height: 1040 })
  await saveWindowPlace(w)
  expect(saved()).toMatchObject({ w: 1100, h: 700, maximized: true, monitorX: 1920 })
  const place = fitWindowPlace(saved(), [screen(), screen(1920)])
  expect(place.x).toBeGreaterThanOrEqual(1920); expect(place.x + place.w).toBeLessThanOrEqual(3840)
})

it('garde la taille normale derrière le plein écran et rétablit celui-ci', async () => {
  localStorage.setItem('avd.mainPlace', JSON.stringify(normal)); native.isFullscreen.mockResolvedValue(true)
  native.innerSize.mockResolvedValue({ width: 1920, height: 1080 }); await saveWindowPlace(w)
  expect(saved()).toMatchObject({ w: 1100, h: 700, fullscreen: true })
  await restoreWindowPlace(w); expect(native.setFullscreen).toHaveBeenCalledWith(true)
})

it('ne remplace pas une disposition par les coordonnées d’une fenêtre minimisée', async () => {
  localStorage.setItem('avd.mainPlace', JSON.stringify(normal)); native.isMinimized.mockResolvedValue(true)
  await saveWindowPlace(w); expect(saved()).toEqual(normal)
})

it('retient séparément les deux fenêtres et le choix du double écran', async () => {
  monitors.mockResolvedValue([screen(), screen(1920)])
  const panels = { ...native, label: 'panels' } as unknown as Window
  await saveDesktopLayout(panels)
  expect(localStorage.getItem('avd.mainPlace')).not.toBeNull(); expect(localStorage.getItem('avd.panelsPlace')).not.toBeNull()
  expect(await shouldRestorePanels()).toBe(true)
  await saveDesktopLayout(null); expect(await shouldRestorePanels()).toBe(false)
})

it('ne rouvre pas Infos seule si le deuxième écran a été débranché', async () => {
  localStorage.setItem('avd.panelsOpen', JSON.stringify({ open: true, screens: 2 }))
  expect(await shouldRestorePanels()).toBe(false)
  monitors.mockResolvedValue([screen(), screen(-1920)]); expect(await shouldRestorePanels()).toBe(true)
})

it('restaure aussi deux fenêtres volontairement utilisées sur un seul écran', async () => {
  localStorage.setItem('avd.panelsOpen', JSON.stringify({ open: true, screens: 1 }))
  expect(await shouldRestorePanels()).toBe(true)
})

it('ramène une fenêtre hors écran dans la zone de travail, y compris sur un écran à gauche', () => {
  const place = fitWindowPlace({ ...normal, x: 5000, y: -1000, w: 4000, h: 2000, monitorX: 5000 }, [screen(-1920)])
  expect(place.x).toBeGreaterThanOrEqual(-1920); expect(place.y).toBe(0)
  expect(place.x + place.w).toBeLessThan(0); expect(place.y + place.h).toBeLessThan(1040)
})

it('fermer Infos immédiatement après un déplacement enregistre sans attendre le délai', async () => {
  vi.useFakeTimers(); native.label = 'panels'; await rememberWindowPlace()
  native.onMoved.mock.calls[0][0]()
  native.outerPosition.mockResolvedValue({ x: 250, y: 160 })
  await native.onCloseRequested.mock.calls[0][0]()
  expect(JSON.parse(localStorage.getItem('avd.panelsPlace')!)).toMatchObject({ x: 250, y: 160 })
  vi.clearAllTimers()
})

it.each(['invalid', '{"x":10}', '{"x":1,"y":1,"w":-5,"h":700,"maximized":false}'])('ignore une ancienne préférence invalide : %s', async value => {
  localStorage.setItem('avd.mainPlace', value); await restoreMainWindow()
  expect(native.maximize).toHaveBeenCalledOnce(); expect(native.show).toHaveBeenCalledOnce()
})

it('reste visible et agrandie si le stockage de préférences est indisponible', async () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Quota') })
  await restoreMainWindow(); expect(native.maximize).toHaveBeenCalledOnce(); expect(native.show).toHaveBeenCalledOnce()
})

it('autorise les commandes natives réellement utilisées par la disposition', () => {
  for (const permission of ['inner-size', 'is-minimized', 'is-fullscreen', 'set-fullscreen']) expect(capability.permissions).toContain(`core:window:allow-${permission}`)
})
