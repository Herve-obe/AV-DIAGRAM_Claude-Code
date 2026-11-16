import { beforeEach, expect, it, vi } from 'vitest'
const api = vi.hoisted(() => ({ native: true, invoke: vi.fn() }))
vi.mock('@tauri-apps/api/core', () => ({ isTauri: () => api.native, invoke: api.invoke }))
import { convertDwg, cancelDwg } from './dwg'
beforeEach(() => { api.native = true; api.invoke.mockReset() })
it('exige le bureau et ne lance rien après annulation du choix ou changement de projet', async () => {
  api.native = false
  await expect(convertDwg(new Uint8Array(), 'Choose')).rejects.toThrow('desktop')
  expect(api.invoke).not.toHaveBeenCalled()
  api.native = true
  api.invoke.mockResolvedValueOnce(null)
  expect(await convertDwg(new Uint8Array(), 'Choose')).toBeNull()
  expect(api.invoke).toHaveBeenCalledExactlyOnceWith('program_choose', { kind: 'oda', title: 'Choose' })
  api.invoke.mockReset()
  api.invoke.mockResolvedValueOnce('C:/Tools/ODAFileConverter.exe')
  expect(await convertDwg(new Uint8Array(), 'Choose', () => false)).toBeNull()
  expect(api.invoke).toHaveBeenCalledTimes(1)
})
it('le choix passe par la commande native, qui approuve le programme ; seul son chemin est transmis avec les octets du document', async () => {
  api.invoke.mockImplementation(async (command: string) => command === 'program_choose' ? 'C:/Tools/ODAFileConverter.exe' : [48, 10, 83])
  expect(await convertDwg(new Uint8Array([65, 67]), 'Choose')).toEqual(new Uint8Array([48, 10, 83]))
  expect(api.invoke).toHaveBeenNthCalledWith(1, 'program_choose', { kind: 'oda', title: 'Choose' })
  expect(api.invoke).toHaveBeenNthCalledWith(2, 'dwg_to_dxf', { converter: 'C:/Tools/ODAFileConverter.exe', data: [65, 67] })
  await cancelDwg()
  expect(api.invoke).toHaveBeenLastCalledWith('dwg_cancel')
})
it('un fichier refusé par la partie native n’est jamais converti', async () => {
  api.invoke.mockRejectedValueOnce('invalid-program')
  await expect(convertDwg(new Uint8Array([65]), 'Choose')).rejects.toBe('invalid-program')
  expect(api.invoke).toHaveBeenCalledTimes(1)
})
