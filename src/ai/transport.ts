// Pont vers la partie native (src-tauri/src/ai.rs) : c'est elle qui fait les requêtes réseau et qui
// garde la clé API dans le trousseau du système. L'interface ne relit jamais la clé.
import { invoke, isTauri } from '@tauri-apps/api/core'
import type { Transport } from './agent'
import type { ProviderId } from './providers'

/** Vrai dans l'application de bureau ; faux dans un simple navigateur (aperçu de développement). */
export const nativeAvailable = () => isTauri()

export const nativeTransport: Transport = {
  request: (provider, baseUrl, req) =>
    invoke<{ status: number; body: string }>('ai_request', { provider, baseUrl: baseUrl ?? null, method: req.method, path: req.path, body: req.body ?? null }),
}

export const keyStore = {
  set: (provider: ProviderId, key: string) => invoke<void>('ai_key_set', { provider, key: key.trim() }),
  remove: (provider: ProviderId) => invoke<void>('ai_key_delete', { provider }),
  present: (provider: ProviderId) => invoke<boolean>('ai_key_present', { provider }),
}

/** Ouvre une page (console du fournisseur) dans le navigateur du système. */
export async function openExternal(url: string): Promise<void> {
  if (isTauri()) {
    const { openUrl } = await import('@tauri-apps/plugin-opener')
    await openUrl(url)
  } else window.open(url, '_blank', 'noopener')
}
