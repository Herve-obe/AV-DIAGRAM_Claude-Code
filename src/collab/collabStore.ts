// État de la collaboration côté interface : participants, tchat, notifications, préférences du poste
// (nom, identifiant, poste de secours) et session interrompue à reprendre. Le lien avec le document
// partagé et le relais est dans session.ts ; ce module ne connaît ni Yjs ni le réseau.
import { isTauri } from '@tauri-apps/api/core'
import { create } from 'zustand'
import type { LayerView } from '../model/layers'
import { setProjectGuard } from '../store/projectStore'
import { useUi } from '../store/uiStore'
import type { Claims } from './protection'
import { guestChangeReason, guestLayers, hasFullAccess, type AccessReason } from './access'

export const DEFAULT_PORT = 4455
const PREFS_KEY = 'avd.collab'
export const RESUME_KEY = 'avd.collab.resume'
const NOTICE_MS = 7000

/** Couleurs de présence, distinctes des couleurs de signaux */
export const COLORS = ['#e8590c', '#7048e8', '#0ca678', '#d6336c', '#1c7ed6', '#f59f00', '#5c940d', '#ae3ec9']

export interface Participant {
  clientId: number
  peerId?: number
  userId?: string
  name: string
  color: string
  layer?: LayerView
  selection: string[]
  self: boolean
  /** Poste de bureau prêt à prendre le relais */
  backup: boolean
}

export interface HostInfo {
  port: number
  code: string
  hostToken: string
  addresses: string[]
  peers: { id: number; userId: string; name: string; address: string }[]
  discoveryAvailable?: boolean
}

export interface ChatMessage {
  id: string
  userId: string
  name: string
  color: string
  text: string
  at: number
}

/** Message affiché dans le bandeau (clé de traduction collab.notice.*) */
export interface Notice {
  key: string
  params?: Record<string, string | number>
  tone: 'info' | 'warn' | 'error'
}

/** Session interrompue, enregistrée sur ce poste pour la reprendre */
export interface ResumeRecord {
  code: string
  origin: 'host' | 'guest'
  port: number
  ranks: string[][]
  backupIds: string[]
  state: string
  savedAt: number
  projectName: string
}

export type CollabStatus = 'off' | 'connecting' | 'connected' | 'reconnecting'

export interface CollabState {
  status: CollabStatus
  started: boolean
  /** Rôle actuel : host quand ce poste fait tourner le relais (hôte d'origine ou poste de secours) */
  role: 'host' | 'guest' | null
  /** Rôle de ce poste à l'ouverture de la session */
  origin: 'host' | 'guest' | null
  /** Rang du relais que ce poste fait tourner : 0 hôte d'origine, 1 et plus : secours */
  relayRank: number | null
  address: string | null
  host: HostInfo | null
  participants: Participant[]
  error: string | null
  name: string
  userId: string
  /** Ce poste accepte de prendre le relais si l'hôte disparaît (application de bureau) */
  backup: boolean
  dialogOpen: boolean
  canUndo: boolean
  canRedo: boolean
  claims: Claims
  chat: ChatMessage[]
  chatOpen: boolean
  unread: number
  notice: Notice | null
  /** Hôte injoignable depuis (horodatage) */
  lostSince: number | null
  resumable: ResumeRecord | null
  setName: (name: string) => void
  setBackup: (backup: boolean) => void
  setDialogOpen: (open: boolean) => void
  setChatOpen: (open: boolean) => void
  dismissNotice: () => void
}

interface Prefs {
  clientToken: string
  name: string
  userId: string
  backup: boolean
}

function readPrefs(): Prefs {
  let p: Partial<Prefs> = {}
  try {
    p = JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}')
  } catch {
    // préférences illisibles : valeurs par défaut
  }
  const prefs = { clientToken: p.clientToken || randomId() + randomId() + randomId() + randomId(), name: p.name ?? '', userId: p.userId || randomId(), backup: p.backup ?? true }
  if (!p.clientToken) writePrefs(prefs)
  return prefs
}

function writePrefs(p: Prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(p))
  } catch {
    // stockage indisponible : préférences gardées pour la session
  }
}

export function readResume(): ResumeRecord | null {
  try {
    const r = JSON.parse(localStorage.getItem(RESUME_KEY) ?? 'null') as ResumeRecord | null
    return r && typeof r.code === 'string' && typeof r.state === 'string' ? r : null
  } catch {
    return null
  }
}

export function clearResume() {
  try {
    localStorage.removeItem(RESUME_KEY)
  } catch {
    // rien à effacer
  }
  useCollab.setState({ resumable: null })
}

export function randomId(): string {
  const b = new Uint8Array(8)
  crypto.getRandomValues(b)
  return [...b].map((x) => x.toString(16).padStart(2, '0')).join('')
}

/** Couleur stable d'une personne (même couleur à chaque session) */
export function colorOf(userId: string): string {
  let h = 0
  for (const c of userId) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return COLORS[h % COLORS.length]
}

/** Document Yjs enregistré sur le poste (reprise) : encodage en base 64 */
export const toBase64 = (u: Uint8Array) => {
  let s = ''
  for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000))
  return btoa(s)
}
export const fromBase64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))

export const prefs = readPrefs()
let noticeTimer: ReturnType<typeof setTimeout> | null = null

export const useCollab = create<CollabState>((set, get) => ({
  status: 'off',
  started: false,
  role: null,
  origin: null,
  relayRank: null,
  address: null,
  host: null,
  participants: [],
  error: null,
  name: prefs.name,
  userId: prefs.userId,
  backup: prefs.backup,
  dialogOpen: false,
  canUndo: false,
  canRedo: false,
  claims: {},
  chat: [],
  chatOpen: false,
  unread: 0,
  notice: null,
  lostSince: null,
  resumable: readResume(),
  setName: (name) => {
    set({ name })
    writePrefs({ clientToken: prefs.clientToken, name, userId: get().userId, backup: get().backup })
  },
  setBackup: (backup) => {
    set({ backup })
    writePrefs({ clientToken: prefs.clientToken, name: get().name, userId: get().userId, backup })
  },
  setDialogOpen: (dialogOpen) => set({ dialogOpen }),
  setChatOpen: (chatOpen) => set(chatOpen ? { chatOpen, unread: 0 } : { chatOpen }),
  dismissNotice: () => set({ notice: null }),
}))

// Garde-fou du projet pendant une session : un invité ne modifie que ce que ses droits permettent
setProjectGuard((prev, next) => {
  const st = useCollab.getState()
  if (st.status === 'off') return true
  if (st.role === 'host') return prev.id === next.id
  const reason: AccessReason | null = !st.started ? { code: 'waiting' } : guestChangeReason(prev, next, guestLayers(st.claims, st.userId), useUi.getState().layer, hasFullAccess(st.claims, st.userId))
  if (reason) notifyAccess(reason)
  return reason === null
})

export function notifyAccess(reason: AccessReason) {
  notify({ key: `access.${reason.code}`, params: reason.params, tone: 'warn' })
}

export function notify(notice: Notice) {
  if (noticeTimer) clearTimeout(noticeTimer)
  noticeTimer = null
  useCollab.setState({ notice })
  // Les informations s'effacent seules ; les alertes restent jusqu'à ce que la situation change
  if (notice.tone !== 'warn') noticeTimer = setTimeout(() => {
    noticeTimer = null
    useCollab.setState({ notice: null })
  }, NOTICE_MS)
}

export const canHost = () => isTauri()
