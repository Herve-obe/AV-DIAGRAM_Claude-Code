// IA locale gérée par AV Diagram : llama-server est lancé par la partie native (src-tauri/src/local.rs)
// avec les fichiers choisis par l'utilisateur, puis on attend que le modèle soit chargé.
import { invoke, isTauri } from '@tauri-apps/api/core'
import { AiError, listModels } from './agent'
import { nativeTransport } from './transport'

export interface ManagedFiles {
  /** Chemin du programme llama-server */
  serverPath: string
  /** Chemin du modèle .gguf */
  modelPath: string
}
export type ManagedServer = ManagedFiles | { catalogId: string }

/** Port de l'adresse du serveur local (8080 par défaut, comme llama-server). */
export function portOf(baseUrl: string | undefined): number {
  try {
    return Number(new URL(baseUrl ?? '').port) || 8080
  } catch {
    return 8080
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function serverRunning(): Promise<boolean> {
  const s = await invoke<{ running: boolean }>('local_status')
  return s.running
}

export const stopServer = () => invoke<void>('local_stop')

/**
 * Lance llama-server et attend que le modèle réponde (le chargement d'un gros modèle prend du temps).
 * Renvoie la liste des modèles servis.
 */
export async function startServer(m: ManagedServer, baseUrl: string | undefined, timeoutMs = 180_000): Promise<string[]> {
  const builtin = 'catalogId' in m
  if (builtin) await invoke<void>('local_builtin_start', { id: m.catalogId })
  else await invoke<void>('local_start', { serverPath: m.serverPath, modelPath: m.modelPath, port: portOf(baseUrl), context: null })
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const s = await invoke<{ running: boolean; exit_code: number | null }>('local_status')
    if (!s.running) throw new AiError('network', `llama-server s'est arrêté${s.exit_code != null ? ` (code ${s.exit_code})` : ''}`)
    try {
      const models = await listModels(nativeTransport, builtin ? 'builtin' : 'llamacpp', baseUrl)
      if (models.length) return models
    } catch {
      // modèle en cours de chargement
    }
    await sleep(1000)
  }
  await stopServer()
  throw new AiError('network', 'délai de chargement du modèle dépassé')
}

/** Avant une question : relance le serveur géré s'il ne tourne plus (redémarrage de l'application). */
export async function ensureServer(m: ManagedServer, baseUrl: string | undefined): Promise<boolean> {
  const status = await invoke<{ running: boolean; model_id?: string }>('local_status')
  if (status.running && (!('catalogId' in m) || status.model_id === m.catalogId)) return false
  await startServer(m, baseUrl)
  return true
}

export interface LocalModel {
  id: string
  label: string
  repo: string
  revision: string
  file: string
  size: number
  sha256: string
  license: string
  minimum_ram_gb: number
  installed: boolean
  partial: number
}
export interface LocalCatalog { models: LocalModel[]; memory_bytes: number; runtime_available: boolean; runtime_error?: string | null; directory: string }
export interface DownloadProgress { id: string | null; downloaded: number; total: number; running: boolean }
export const localCatalog = () => invoke<LocalCatalog>('local_model_catalog')
export const downloadModel = (id: string) => invoke<string>('local_model_download', { id })
export const cancelDownload = () => invoke<void>('local_model_cancel')
export const downloadProgress = () => invoke<DownloadProgress>('local_model_progress')
export const setModelDirectory = (directory: string) => invoke<void>('local_model_directory_set', { directory })
export const installerSetupRequest = () => isTauri() ? invoke<string | null>('local_ai_setup_request') : Promise.resolve(null)

/** Mémoire inconnue : choisir le modèle le plus léger. */
export function recommendedModel(models: LocalModel[], memory: number): LocalModel | undefined {
  const sorted = [...models].sort((a, b) => a.size - b.size)
  return [...sorted].reverse().find((m) => m.minimum_ram_gb * 1024 ** 3 <= memory) ?? sorted[0]
}
