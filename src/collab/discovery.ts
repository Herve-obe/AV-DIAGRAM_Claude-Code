import { invoke } from '@tauri-apps/api/core'

export interface DiscoveredSession {
  id: string
  address: string
  sessionName: string
  hostName: string
}

export const discoverSessions = () => invoke<DiscoveredSession[]>('collab_discover')
