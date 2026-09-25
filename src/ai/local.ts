// IA locale gérée par AV Diagram : llama-server est lancé par la partie native (src-tauri/src/local.rs)
// avec les fichiers choisis par l'utilisateur, puis on attend que le modèle soit chargé.
import { invoke } from '@tauri-apps/api/core'
import { AiError, listModels } from './agent'
import { nativeTransport } from './transport'

export interface ManagedServer {
  /** Chemin du programme llama-server */
  serverPath: string
  /** Chemin du modèle .gguf */
  modelPath: string
}

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
  await invoke<void>('local_start', { serverPath: m.serverPath, modelPath: m.modelPath, port: portOf(baseUrl), context: null })
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const s = await invoke<{ running: boolean; exit_code: number | null }>('local_status')
    if (!s.running) throw new AiError('network', `llama-server s'est arrêté${s.exit_code != null ? ` (code ${s.exit_code})` : ''}`)
    try {
      const models = await listModels(nativeTransport, 'llamacpp', baseUrl)
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
  if (await serverRunning()) return false
  await startServer(m, baseUrl)
  return true
}
