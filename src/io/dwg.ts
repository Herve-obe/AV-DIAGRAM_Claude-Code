import { invoke, isTauri } from '@tauri-apps/api/core'

export async function convertDwg(data: Uint8Array, title: string, current = () => true): Promise<Uint8Array | null> {
  if (!isTauri()) throw new Error('desktop')
  // La fenêtre de choix est ouverte par la partie native, qui approuve le programme choisi (approved.rs) :
  // dwg_to_dxf refuse tout autre chemin.
  const converter = await invoke<string | null>('program_choose', { kind: 'oda', title })
  if (!converter || !current()) return null
  const result = await invoke<number[]>('dwg_to_dxf', { converter, data: Array.from(data) })
  return new Uint8Array(result)
}
export async function cancelDwg(): Promise<void> {
  if (isTauri()) await invoke('dwg_cancel')
}
