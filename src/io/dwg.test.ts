import { beforeEach, expect, it, vi } from 'vitest'
const api=vi.hoisted(()=>({native:true,open:vi.fn(),invoke:vi.fn()}))
vi.mock('@tauri-apps/api/core',()=>({isTauri:()=>api.native,invoke:api.invoke}))
vi.mock('@tauri-apps/plugin-dialog',()=>({open:api.open}))
import { convertDwg, cancelDwg } from './dwg'
beforeEach(()=>{api.native=true;api.open.mockReset();api.invoke.mockReset()})
it('exige le bureau et ne lance rien après annulation du choix ou changement de projet',async()=>{
  api.native=false;await expect(convertDwg(new Uint8Array(),'Choose')).rejects.toThrow('desktop');expect(api.open).not.toHaveBeenCalled()
  api.native=true;api.open.mockResolvedValue(null);expect(await convertDwg(new Uint8Array(),'Choose')).toBeNull()
  api.open.mockResolvedValue('C:/Tools/ODAFileConverter.exe');expect(await convertDwg(new Uint8Array(),'Choose',()=>false)).toBeNull();expect(api.invoke).not.toHaveBeenCalled()
})
it('transmet uniquement le programme choisi et les octets du document, et permet l’arrêt',async()=>{
  api.open.mockResolvedValue('C:/Tools/ODAFileConverter.exe');api.invoke.mockResolvedValue([48,10,83])
  expect(await convertDwg(new Uint8Array([65,67]),'Choose')).toEqual(new Uint8Array([48,10,83]))
  expect(api.invoke).toHaveBeenCalledWith('dwg_to_dxf',{converter:'C:/Tools/ODAFileConverter.exe',data:[65,67]})
  await cancelDwg();expect(api.invoke).toHaveBeenLastCalledWith('dwg_cancel')
})
