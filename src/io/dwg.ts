import { invoke, isTauri } from '@tauri-apps/api/core'

export async function convertDwg(data: Uint8Array, title: string, current = () => true): Promise<Uint8Array | null> {
  if (!isTauri()) throw new Error('desktop')
  const { open } = await import('@tauri-apps/plugin-dialog')
  const converter = await open({ title, directory: false, multiple: false })
  if (!converter || typeof converter !== 'string' || !current()) return null
  const result = await invoke<number[]>('dwg_to_dxf', { converter, data: Array.from(data) })
  return new Uint8Array(result)
}
export async function cancelDwg(): Promise<void> {
  if (isTauri()) await invoke('dwg_cancel')
}
