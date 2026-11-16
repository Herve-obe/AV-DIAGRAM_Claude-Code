// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from 'vitest'
import { canvasViewport, rememberCanvasViewport } from './canvasViewport'
beforeEach(() => localStorage.clear())
it('retrouve le zoom et la position sans les partager avec un autre projet ou feuille', () => {
  const viewport = { x: -120, y: 230, zoom: 1.45 }
  rememberCanvasViewport('concert', 'audio', viewport)
  expect(canvasViewport('concert', 'audio')).toEqual(viewport)
  expect(canvasViewport('concert', 'video')).toBeUndefined()
  expect(canvasViewport('tv', 'audio')).toBeUndefined()
})
it('ignore les préférences invalides et supporte un stockage indisponible', () => {
  localStorage.setItem('avd.canvasViewports', 'null')
  expect(canvasViewport('p', 's')).toBeUndefined()
  rememberCanvasViewport('p','s',{x:0,y:0,zoom:10})
  expect(canvasViewport('p', 's')).toBeUndefined()
  localStorage.setItem('avd.canvasViewports', JSON.stringify({ '["p","s"]': {x:0,y:0,zoom:0} }))
  expect(canvasViewport('p', 's')).toBeUndefined()
  const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw Error('quota') })
  expect(() => rememberCanvasViewport('p','s',{x:0,y:0,zoom:1})).not.toThrow()
  spy.mockRestore()
})
