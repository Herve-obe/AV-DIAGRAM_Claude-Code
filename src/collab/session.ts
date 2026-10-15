// Session de collaboration : relie le store du projet à un document partagé (Yjs) et à un relais
// WebSocket sur le réseau local (src-tauri/src/collab.rs). L'hôte ouvre la session depuis l'application
// de bureau ; les autres la rejoignent avec l'adresse de l'hôte et le code à 6 chiffres.
//
// Protocole sur le relais :
// - texte : {"type":"hello","code","name"} -> {"type":"welcome","peerId","peers"} ou {"type":"refused"} ;
//   {"type":"peer-joined"|"peer-left","peerId"}, {"type":"ended"} (fin voulue par l'hôte),
//   {"type":"kicked"} (exclusion) annoncés par le relais ;
// - binaire : messages y-protocols (0 : synchronisation du document, 1 : présence).
// À chaque arrivée d'un participant, chacun lui envoie l'état de son document : rien n'est perdu,
// même les modifications faites hors ligne pendant une coupure.
//
// Le document contient aussi le tchat (liste « chat ») et les calques réservés (carte « claims ») :
// ni l'un ni l'autre n'entre dans le fichier .avd ni dans l'annulation.
//
// Continuité si l'hôte disparaît sans terminer la session (plantage, coupure réseau) :
// - chacun garde le document complet et continue à travailler ; l'état est aussi enregistré sur le poste
//   (localStorage) pour reprendre la session après un redémarrage de l'application ;
// - les postes de bureau volontaires annoncent leurs adresses (« postes de secours ») ; le premier, dans
//   un ordre connu de tous, ouvre un relais avec le même code si l'hôte reste injoignable, et les autres
//   s'y reconnectent automatiquement ;
// - un relais de secours vérifie régulièrement si l'hôte d'origine est revenu ; dès qu'il répond, il
//   ferme son relais et tout le monde revient chez l'hôte, les modifications de chacun fusionnées.
import { invoke, isTauri } from '@tauri-apps/api/core'
import * as decoding from 'lib0/decoding'
import * as encoding from 'lib0/encoding'
import * as awarenessProtocol from 'y-protocols/awareness'
import * as syncProtocol from 'y-protocols/sync'
import * as Y from 'yjs'
import { create } from 'zustand'
import { normalizeProject } from '../model/project'
import type { Layer, LayerView } from '../model/layers'
import { setHistoryDriver, setProjectGuard, useProject } from '../store/projectStore'
import { useUi } from '../store/uiStore'
import { type Claim, type Claims } from './protection'
import { HostValidation } from './hostValidation'
import { checkGuestChange, guestLayers } from './access'
import { prepareToLeave, setDocumentSessionActive } from '../io/documentLifecycle'
import { createUndoManager, hasProject, observeChanges, readProject, writeProject } from './ydoc'

const MSG_SYNC = 0
const MSG_AWARENESS = 1
export const DEFAULT_PORT = 4455
const PREFS_KEY = 'avd.collab'
const RESUME_KEY = 'avd.collab.resume'
const SYNC_TIMEOUT_MS = 10000
const RETRY_MS = 2000
const CONNECT_TIMEOUT_MS = 3000
/** Délai avant qu'un poste de secours prenne le relais (multiplié par son rang) */
const TAKEOVER_MS = 8000
/** Fréquence à laquelle un relais de secours cherche l'hôte d'origine */
const PROBE_MS = 5000
const SAVE_DELAY_MS = 1500
const NOTICE_MS = 7000
const CHAT_MAX = 500

/** Couleurs de présence, distinctes des couleurs de signaux */
const COLORS = ['#e8590c', '#7048e8', '#0ca678', '#d6336c', '#1c7ed6', '#f59f00', '#5c940d', '#ae3ec9']

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

interface CollabState {
  status: CollabStatus
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

function readResume(): ResumeRecord | null {
  try {
    const r = JSON.parse(localStorage.getItem(RESUME_KEY) ?? 'null') as ResumeRecord | null
    return r && typeof r.code === 'string' && typeof r.state === 'string' ? r : null
  } catch {
    return null
  }
}

function clearResume() {
  try {
    localStorage.removeItem(RESUME_KEY)
  } catch {
    // rien à effacer
  }
  useCollab.setState({ resumable: null })
}

function randomId(): string {
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

const toBase64 = (u: Uint8Array) => {
  let s = ''
  for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000))
  return btoa(s)
}
const fromBase64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))

const prefs = readPrefs()
let noticeTimer: ReturnType<typeof setTimeout> | null = null

export const useCollab = create<CollabState>((set, get) => ({
  status: 'off',
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

setProjectGuard((prev, next) => {
  const st = useCollab.getState()
  if (st.status === 'off') return true
  const allowed = prev.id === next.id && (st.role === 'host' || checkGuestChange(prev, next, guestLayers(st.claims, st.userId), useUi.getState().layer))
  if (!allowed) notify({ key: 'accessDenied', tone: 'warn' })
  return allowed
})

function notify(notice: Notice) {
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

/** Origine des modifications faites sur ce poste (suivie par l'annulation) */
const LOCAL = { local: true }

interface Live {
  doc: Y.Doc
  awareness: awarenessProtocol.Awareness
  undo: Y.UndoManager
  code: string
  origin: 'host' | 'guest'
  /** Port du relais de ce poste (hôte, ou poste de secours) */
  port: number
  /** Relais connus par priorité : [0] hôte d'origine, puis postes de secours (ordre des identifiants) */
  ranks: string[][]
  backupIds: string[]
  /** Adresses de ce poste (exclues des tentatives de connexion) */
  own: string[]
  /** Rang du relais que ce poste fait tourner, null s'il n'en fait pas tourner */
  rank: number | null
  attempt: number
  ws: WebSocket | null
  peerId: number | null
  hostToken?: string
  validation?: HostValidation
  peerUsers: Map<number, string>
  peerClients: Map<number, number>
  everConnected: boolean
  closing: boolean
  handingBack: boolean
  end: 'ended' | 'kicked' | null
  lostAt: number | null
  retry: ReturnType<typeof setTimeout> | null
  probe: ReturnType<typeof setInterval> | null
  saveTimer: ReturnType<typeof setTimeout> | null
  /** Projet tel qu'il est dans le document (évite de renvoyer ce qu'on vient de recevoir) */
  synced: ReturnType<typeof useProject.getState>['project'] | null
  cleanups: (() => void)[]
}
let live: Live | null = null

const send = (data: Uint8Array) => {
  if (live?.ws?.readyState === WebSocket.OPEN) live.ws.send(data as Uint8Array<ArrayBuffer>)
}

function sendSyncStep1(peerId?: number) {
  if (!live) return
  const enc = encoding.createEncoder()
  encoding.writeVarUint(enc, MSG_SYNC)
  syncProtocol.writeSyncStep1(enc, live.doc)
  if (peerId !== undefined) directed(peerId, encoding.toUint8Array(enc))
  else send(encoding.toUint8Array(enc))
}

function sendFullState(peerId?: number) {
  if (!live) return
  const enc = encoding.createEncoder()
  encoding.writeVarUint(enc, MSG_SYNC)
  syncProtocol.writeSyncStep2(enc, live.doc)
  const packet = encoding.toUint8Array(enc)
  if (peerId !== undefined) directed(peerId, packet)
  else send(packet)
}

function sendAwareness(clients: number[]) {
  if (!live) return
  const enc = encoding.createEncoder()
  encoding.writeVarUint(enc, MSG_AWARENESS)
  encoding.writeVarUint8Array(enc, awarenessProtocol.encodeAwarenessUpdate(live.awareness, clients))
  send(encoding.toUint8Array(enc))
}

function directed(peerId: number, packet: Uint8Array) {
  const data = new Uint8Array(5 + packet.length)
  data[0] = 254
  new DataView(data.buffer).setUint32(1, peerId)
  data.set(packet, 5)
  send(data)
}

function onBinary(data: ArrayBuffer) {
  if (!live) return
  const cur = live
  let peer: number | null = null
  try {
    let packet = new Uint8Array(data)
    if (packet[0] === 255) {
      if (cur.rank === null || packet.length < 6) return
      peer = new DataView(data).getUint32(1)
      packet = packet.subarray(5)
    } else if (cur.rank !== null) return
    const dec = decoding.createDecoder(packet)
    const type = decoding.readVarUint(dec)
    if (type === MSG_SYNC) {
      const enc = encoding.createEncoder()
      encoding.writeVarUint(enc, MSG_SYNC)
      if (peer !== null) {
        const subtype = decoding.readVarUint(dec)
        if (subtype === syncProtocol.messageYjsSyncStep1) {
          syncProtocol.writeSyncStep2(enc, cur.doc, decoding.readVarUint8Array(dec))
        } else if (subtype === syncProtocol.messageYjsSyncStep2 || subtype === syncProtocol.messageYjsUpdate) {
          cur.validation ??= new HostValidation(cur.doc)
          const client = cur.peerClients.get(peer)
          const view = client === undefined ? undefined : cur.awareness.getStates().get(client)?.layer as LayerView | undefined
          if (!cur.validation.apply(decoding.readVarUint8Array(dec), cur.peerUsers.get(peer) ?? '', view)) {
            // La copie locale du client reste disponible ; une reconnexion repart du document accepté.
            void kick(peer)
            return
          }
        } else throw new Error('sync')
      } else syncProtocol.readSyncMessage(dec, enc, cur.doc, 'network')
      if (encoding.length(enc) > 1) {
        if (peer !== null) directed(peer, encoding.toUint8Array(enc))
        else send(encoding.toUint8Array(enc))
      }
    } else if (type === MSG_AWARENESS) {
      const bytes = decoding.readVarUint8Array(dec)
      if (peer !== null) {
        const presence = decoding.createDecoder(bytes)
        if (decoding.readVarUint(presence) !== 1) throw new Error('presence')
        const client = decoding.readVarUint(presence)
        const clock = decoding.readVarUint(presence)
        const state = JSON.parse(decoding.readVarString(presence))
        const owned = cur.peerClients.get(peer)
        if (owned !== undefined && owned !== client) throw new Error('identity')
        if (client === cur.doc.clientID || [...cur.peerClients].some(([p, c]) => p !== peer && c === client)) throw new Error('identity')
        cur.peerClients.set(peer, client)
        if (state !== null) {
          if (typeof state !== 'object' || Array.isArray(state)) throw new Error('presence')
          state.peerId = peer
          state.userId = cur.peerUsers.get(peer) ?? ''
          // L'identité réseau est fournie par le relais, jamais par le nom ou l'identifiant annoncé.
          const enc = encoding.createEncoder()
          encoding.writeVarUint(enc, 1); encoding.writeVarUint(enc, client); encoding.writeVarUint(enc, clock)
          encoding.writeVarString(enc, JSON.stringify(state))
          awarenessProtocol.applyAwarenessUpdate(cur.awareness, encoding.toUint8Array(enc), 'network')
        } else awarenessProtocol.applyAwarenessUpdate(cur.awareness, bytes, 'network')
        sendAwareness([client])
      } else awarenessProtocol.applyAwarenessUpdate(cur.awareness, bytes, 'network')
    } else throw new Error('message')
  } catch { if (peer !== null) void kick(peer) }
}

function onText(text: string) {
  if (!live) return
  const current = live
  let msg: { type?: string; peerId?: number; userId?: string; peers?: HostInfo['peers'] }
  try {
    msg = JSON.parse(text)
  } catch {
    return
  }
  if (msg.type === 'welcome') {
    current.peerId = msg.peerId ?? null
    current.peerUsers = new Map((msg.peers ?? []).map(p => [p.id, p.userId]))
    if (msg.userId) {
      useCollab.setState({ userId: msg.userId })
      current.awareness.setLocalStateField('userId', msg.userId)
    }
    current.awareness.setLocalStateField('peerId', current.peerId)
    // La présence précède les propositions du document (calque et identité authentifiée).
    sendAwareness([current.doc.clientID])
    const wasLost = current.lostAt !== null
    current.lostAt = null
    current.attempt = 0
    current.everConnected = true
    useCollab.setState({ status: 'connected', error: null, lostSince: null })
    if (wasLost) notify({ key: current.rank === null ? 'reconnected' : 'relayActive', tone: 'info' })
    sendSyncStep1()
    if (current.rank !== null) sendFullState()
    sendAwareness([current.doc.clientID])
  } else if (msg.type === 'refused') {
    useCollab.setState({ error: 'code' })
    finish(null)
  } else if (msg.type === 'ended' || msg.type === 'kicked') {
    current.end = msg.type
  } else if (msg.type === 'peer-joined') {
    if (msg.peerId !== undefined && msg.userId) current.peerUsers.set(msg.peerId, msg.userId)
    // Seul l'hôte propose le document initial. Les invités ne se synchronisent pas entre eux.
    if (current.rank !== null && msg.peerId !== undefined) {
      sendFullState(msg.peerId)
      sendSyncStep1(msg.peerId)
    }
    sendAwareness(current.rank !== null ? [...current.awareness.getStates().keys()] : [current.doc.clientID])
    void refreshHost()
  } else if (msg.type === 'peer-left') {
    if (msg.peerId !== undefined) { current.peerClients.delete(msg.peerId); current.peerUsers.delete(msg.peerId) }
    const gone = [...current.awareness.getStates()].filter(([, s]) => s.peerId === msg.peerId).map(([id]) => id)
    if (gone.length) {
      awarenessProtocol.removeAwarenessStates(current.awareness, gone, 'network')
      if (current.rank !== null) sendAwareness(gone)
    }
    void refreshHost()
  }
}

/** Relais de ce poste : liste des postes connectés (adresse IP, pour pouvoir exclure). */
async function refreshHost() {
  if (useCollab.getState().role !== 'host' || !isTauri()) return
  const info = await invoke<HostInfo | null>('collab_host_status')
  if (info) useCollab.setState({ host: info })
}

/** Adresse à essayer : son propre relais, sinon chacun des relais connus à tour de rôle. */
function target(cur: Live): string | null {
  if (cur.rank !== null) return `127.0.0.1:${cur.port}`
  const all = cur.ranks.flat().filter((a) => !cur.own.includes(a))
  return all.length ? all[cur.attempt % all.length] : null
}

function connect() {
  if (!live) return
  const current = live
  current.retry = null
  const addr = target(current)
  if (!addr) return
  let ws: WebSocket
  try {
    ws = new WebSocket(`ws://${addr}`)
  } catch {
    current.retry = setTimeout(connect, RETRY_MS)
    return
  }
  ws.binaryType = 'arraybuffer'
  current.ws = ws
  // Une adresse injoignable peut mettre longtemps à échouer : on passe à la suivante
  const timer = setTimeout(() => ws.readyState !== WebSocket.OPEN && ws.close(), CONNECT_TIMEOUT_MS)
  ws.onopen = () => {
    clearTimeout(timer)
    ws.send(JSON.stringify({ type: 'hello', code: current.code, name: useCollab.getState().name, clientToken: prefs.clientToken, hostToken: current.rank !== null ? current.hostToken : undefined }))
  }
  ws.onmessage = (e) => (typeof e.data === 'string' ? onText(e.data) : onBinary(e.data as ArrayBuffer))
  ws.onclose = () => {
    clearTimeout(timer)
    if (live !== current || current.closing || current.ws !== ws) return
    current.ws = null
    if (current.end) return finish(current.end)
    if (current.handingBack) {
      // Retour chez l'hôte d'origine : reconnexion immédiate, sans alerte
      current.handingBack = false
      current.attempt = 0
      return connect()
    }
    if (current.everConnected && current.lostAt === null) {
      // Coupure : on continue à travailler, reconnexion automatique, fusion au retour
      current.lostAt = Date.now()
      notify({ key: current.rank === null ? 'hostLost' : 'relayLost', tone: 'warn' })
    }
    if (current.everConnected) useCollab.setState({ status: 'reconnecting', lostSince: current.lostAt })
    current.attempt++
    // Tour rapide des adresses connues, puis une pause
    const all = Math.max(1, current.ranks.flat().length)
    if (!maybeTakeOver(current)) current.retry = setTimeout(connect, current.attempt % all === 0 ? RETRY_MS : 200)
  }
}

/** Poste de secours : prend le relais si l'hôte reste injoignable assez longtemps. */
function maybeTakeOver(cur: Live): boolean {
  if (cur.rank !== null || cur.lostAt === null || !canHost() || !useCollab.getState().backup) return false
  const index = cur.backupIds.indexOf(useCollab.getState().userId)
  if (index < 0 || Date.now() - cur.lostAt < TAKEOVER_MS * (index + 1)) return false
  void takeOver(cur, index + 1)
  return true
}

async function takeOver(cur: Live, rank: number) {
  try {
    const info = await invoke<HostInfo>('collab_host_start', { port: cur.port, code: cur.code })
    if (live !== cur) return void invoke('collab_host_stop', { ended: false })
    cur.port = info.port
    cur.rank = rank
    cur.hostToken = info.hostToken
    useCollab.setState({ role: 'host', relayRank: rank, host: info })
    notify({ key: 'tookOver', params: { address: info.addresses[0] ?? `127.0.0.1:${cur.port}` }, tone: 'info' })
    cur.probe = setInterval(() => void probeOrigin(cur), PROBE_MS)
  } catch {
    // Port indisponible : on continue à chercher un relais
  }
  if (live === cur) connect()
}

/** Essaie une adresse : vrai si un relais de la session y répond. */
function probe(addr: string, code: string): Promise<boolean> {
  return new Promise((resolve) => {
    let ws: WebSocket
    try {
      ws = new WebSocket(`ws://${addr}`)
    } catch {
      return resolve(false)
    }
    const done = (ok: boolean) => {
      clearTimeout(timer)
      ws.onclose = null
      ws.onmessage = null
      try {
        ws.close()
      } catch {
        // déjà fermée
      }
      resolve(ok)
    }
    const timer = setTimeout(() => done(false), CONNECT_TIMEOUT_MS)
    ws.onopen = () => ws.send(JSON.stringify({ type: 'hello', code, name: '' }))
    ws.onmessage = (e) => typeof e.data === 'string' && done(e.data.includes('"welcome"'))
    ws.onclose = () => done(false)
  })
}

/** Relais de secours : l'hôte d'origine (ou un secours prioritaire) est-il revenu ? */
async function probeOrigin(cur: Live) {
  if (live !== cur || cur.rank === null || cur.handingBack) return
  for (const addr of cur.ranks.slice(0, cur.rank).flat()) {
    if (cur.own.includes(addr) || !(await probe(addr, cur.code))) continue
    if (live !== cur || cur.rank === null) return
    // Retour à l'hôte : on ferme ce relais (sans fin de session), chacun se reconnecte chez lui
    if (cur.probe) clearInterval(cur.probe)
    cur.probe = null
    cur.rank = null
    cur.handingBack = true
    useCollab.setState({ role: 'guest', relayRank: null, host: null })
    notify({ key: 'handedBack', tone: 'info' })
    await invoke('collab_host_stop', { ended: false })
    return
  }
}

/** Participants d'après la présence (nom, couleur, calque affiché, sélection). */
function refreshParticipants() {
  if (!live) return
  const cur = live
  const me = cur.doc.clientID
  const list: Participant[] = []
  const backups = new Map<string, string[]>()
  for (const [clientId, s] of cur.awareness.getStates()) {
    if (!s.name && clientId !== me) continue
    const backup = Array.isArray(s.backup) && s.backup.length > 0
    if (backup && typeof s.userId === 'string') backups.set(s.userId, s.backup)
    list.push({
      clientId,
      peerId: s.peerId,
      userId: s.userId,
      name: s.name || '?',
      color: s.color ?? COLORS[0],
      layer: s.layer,
      selection: Array.isArray(s.selection) ? s.selection : [],
      self: clientId === me,
      backup,
    })
  }
  list.sort((a, b) => Number(b.self) - Number(a.self) || a.name.localeCompare(b.name))
  useCollab.setState({ participants: list })
  // Ordre de reprise connu de tous tant que la session est joignable ; figé pendant une coupure
  if (useCollab.getState().status === 'connected') {
    const ids = [...backups.keys()].sort()
    cur.backupIds = ids
    cur.ranks = [cur.ranks[0] ?? [], ...ids.map((id) => backups.get(id)!)]
    saveSoon(cur)
  }
}

/** Enregistre l'état du document sur ce poste (reprise après un redémarrage). */
function saveSoon(cur: Live) {
  if (cur.saveTimer) return
  cur.saveTimer = setTimeout(() => {
    cur.saveTimer = null
    if (live !== cur) return
    const record: ResumeRecord = {
      code: cur.code,
      origin: cur.origin,
      port: cur.port,
      ranks: cur.ranks,
      backupIds: cur.backupIds,
      state: toBase64(Y.encodeStateAsUpdate(cur.doc)),
      savedAt: Date.now(),
      projectName: String(cur.doc.getMap('meta').get('name') ?? ''),
    }
    try {
      localStorage.setItem(RESUME_KEY, JSON.stringify(record))
    } catch {
      // projet trop gros pour le stockage local : la reprise se fera depuis le relais
    }
  }, SAVE_DELAY_MS)
}

const claimsMap = (doc: Y.Doc) => doc.getMap<Claim>('claims')
const chatArray = (doc: Y.Doc) => doc.getArray<ChatMessage>('chat')

interface StartOptions {
  hostToken?: string
  code: string
  origin: 'host' | 'guest'
  port: number
  ranks: string[][]
  backupIds?: string[]
  rank: number | null
  /** project : projet ouvert mis dans le document (hôte) ; state : reprise ; wait : attendre la session */
  seed: 'project' | 'state' | 'wait'
  state?: Uint8Array
}

/** Démarre le lien document <-> store, puis la connexion au relais. */
async function start(o: StartOptions): Promise<void> {
  setDocumentSessionActive(true)
  const doc = new Y.Doc()
  const awareness = new awarenessProtocol.Awareness(doc)
  const undo = createUndoManager(doc, LOCAL)
  live = {
    doc, awareness, undo, code: o.code, hostToken: o.hostToken, origin: o.origin, port: o.port, ranks: o.ranks, backupIds: o.backupIds ?? [],
    own: [], rank: o.rank, attempt: 0, ws: null, peerId: null, everConnected: false, closing: false, handingBack: false,
    peerUsers: new Map(), peerClients: new Map(), end: null, lostAt: null, retry: null, probe: null, saveTimer: null, synced: null, cleanups: [],
  }
  const current = live
  const { name, userId, backup } = useCollab.getState()
  awareness.setLocalState({
    name,
    userId,
    color: colorOf(userId),
    layer: useUi.getState().layer,
    selection: useUi.getState().selectedEquipment,
  })
  useCollab.setState({
    status: 'connecting', role: o.rank !== null ? 'host' : 'guest', origin: o.origin, relayRank: o.rank, error: null,
    claims: {}, chat: [], unread: 0, notice: null, lostSince: null,
  })
  // Poste de bureau volontaire : il annonce ses adresses pour pouvoir prendre le relais
  if (canHost() && (backup || o.origin === 'host')) {
    try {
      current.own = await invoke<string[]>('collab_local_addresses', { port: o.port })
      if (o.origin === 'guest' && backup) awareness.setLocalStateField('backup', current.own)
    } catch {
      // adresses inconnues : ce poste ne sera pas poste de secours
    }
  }

  if (o.seed === 'project') {
    const p = useProject.getState().project
    writeProject(doc, null, p, 'seed')
    current.synced = p
  } else if (o.seed === 'state' && o.state) {
    Y.applyUpdate(doc, o.state, 'restore')
  }

  // Document -> envoi sur le réseau (sauf ce qui vient du réseau) et enregistrement local
  const onUpdate = (update: Uint8Array, origin: unknown) => {
    saveSoon(current)
    if (origin === 'network') return
    const enc = encoding.createEncoder()
    encoding.writeVarUint(enc, MSG_SYNC)
    syncProtocol.writeUpdate(enc, update)
    send(encoding.toUint8Array(enc))
  }
  doc.on('update', onUpdate)
  current.cleanups.push(() => doc.off('update', onUpdate))

  const onAwareness = ({ added, updated, removed }: { added: number[]; updated: number[]; removed: number[] }, origin: unknown) => {
    if (origin !== 'network') sendAwareness([...added, ...updated, ...removed])
    refreshParticipants()
  }
  awareness.on('update', onAwareness)
  current.cleanups.push(() => awareness.off('update', onAwareness))

  // Calques réservés et tchat
  const claims = claimsMap(doc)
  const onClaims = () => useCollab.setState({ claims: claims.toJSON() as Claims })
  claims.observe(onClaims)
  current.cleanups.push(() => claims.unobserve(onClaims))
  onClaims()
  const chat = chatArray(doc)
  const onChat = (e: Y.YArrayEvent<ChatMessage>) => {
    const added = e.changes.delta.reduce((n, d) => n + (Array.isArray(d.insert) ? d.insert.length : 0), 0)
    const fromOthers = added > 0 && e.transaction.origin === 'network'
    useCollab.setState((s) => ({ chat: chat.toArray(), unread: fromOthers && !s.chatOpen ? s.unread + added : s.unread }))
  }
  chat.observe(onChat)
  current.cleanups.push(() => chat.unobserve(onChat))
  useCollab.setState({ chat: chat.toArray() })

  const bind = () => {
    // Document -> store : relecture des seuls éléments modifiés par les autres (ou par l'annulation)
    current.cleanups.push(observeChanges(doc, (changes, origin) => {
      if (origin === LOCAL) return
      if (origin !== 'network' && current.synced && useCollab.getState().role === 'guest') {
        const next = readProject(doc)
        if (!checkGuestChange(current.synced, next, guestLayers(useCollab.getState().claims, useCollab.getState().userId), useUi.getState().layer)) {
          // Les droits ont pu changer depuis la création du pas d'annulation.
          writeProject(doc, next, current.synced, LOCAL)
          notify({ key: 'accessDenied', tone: 'warn' })
          return
        }
      }
      const next = readProject(doc, current.synced ?? undefined, current.synced ? changes : undefined)
      current.synced = next
      useProject.setState({ project: next, saved: false })
    }))
    // Store -> document : chaque modification locale (y compris pendant un glisser), sauf sur un
    // calque réservé par quelqu'un d'autre : elle est annulée et signalée
    current.cleanups.push(useProject.subscribe((s) => {
      if (s.project === current.synced) return
      const st = useCollab.getState()
      const v = current.synced && (current.synced.id !== s.project.id || (st.role !== 'host' && !checkGuestChange(current.synced, s.project, guestLayers(st.claims, st.userId), useUi.getState().layer)))
      if (v && current.synced) {
        useProject.setState({ project: current.synced })
        notify({ key: 'accessDenied', tone: 'warn' })
        return
      }
      writeProject(doc, current.synced, s.project, LOCAL)
      current.synced = s.project
    }))
    // Présence : calque affiché et sélection
    current.cleanups.push(useUi.subscribe((s, prev) => {
      if (s.layer !== prev.layer) { undo.stopCapturing(); awareness.setLocalStateField('layer', s.layer) }
      if (s.selectedEquipment !== prev.selectedEquipment) awareness.setLocalStateField('selection', s.selectedEquipment)
    }))
    const onStack = () => useCollab.setState({ canUndo: undo.canUndo(), canRedo: undo.canRedo() })
    for (const ev of ['stack-item-added', 'stack-item-popped', 'stack-cleared'] as const) {
      undo.on(ev, onStack)
      current.cleanups.push(() => undo.off(ev, onStack))
    }
    const rememberLayer = ({ stackItem }: { stackItem: { meta: Map<unknown, unknown> } }) => { stackItem.meta.set('layer', useUi.getState().layer) }
    undo.on('stack-item-added', rememberLayer)
    current.cleanups.push(() => undo.off('stack-item-added', rememberLayer))
    const historyAllowed = (stack: typeof undo.undoStack) => {
      if (useCollab.getState().role === 'host') return true
      const layer = useUi.getState().layer
      const ok = layer !== 'all' && guestLayers(useCollab.getState().claims, useCollab.getState().userId).has(layer) && stack.at(-1)?.meta.get('layer') === layer
      if (!ok) notify({ key: 'accessDenied', tone: 'warn' })
      return ok
    }
    setHistoryDriver({
      undo: () => { if (historyAllowed(undo.undoStack)) undo.undo() },
      redo: () => { if (historyAllowed(undo.redoStack)) undo.redo() },
      gesture: () => undo.stopCapturing(),
    })
    refreshParticipants()
  }

  if (o.seed === 'project') {
    bind()
    connect()
    return
  }
  if (o.seed === 'state') {
    // Reprise : le document enregistré sur ce poste devient le projet ouvert
    useProject.setState({ project: normalizeProject(readProject(doc)), past: [], future: [], saved: false })
    current.synced = useProject.getState().project
    bind()
    connect()
    return
  }
  // Invité : on attend le projet de la session avant de remplacer le projet local
  await new Promise<void>((resolve, reject) => {
    let ready = false
    const timer = setTimeout(() => {
      if (ready) return
      useCollab.setState({ error: 'timeout' })
      finish(null)
      reject(new Error('timeout'))
    }, SYNC_TIMEOUT_MS)
    const onFirst = () => {
      if (ready || !hasProject(doc)) return
      ready = true
      clearTimeout(timer)
      doc.off('update', onFirst)
      useProject.setState({ project: normalizeProject(readProject(doc)), past: [], future: [], saved: false })
      current.synced = useProject.getState().project
      bind()
      resolve()
    }
    doc.on('update', onFirst)
    // Fin avant la réception du projet (code refusé, délai dépassé, abandon) : l'appelant est prévenu
    current.cleanups.push(() => {
      clearTimeout(timer)
      doc.off('update', onFirst)
      if (!ready) reject(new Error('closed'))
    })
    connect()
  })
}

/** Ouvre une session depuis ce poste (application de bureau). */
export async function hostSession(port = DEFAULT_PORT): Promise<void> {
  if (live) finish(null)
  const info = await invoke<HostInfo>('collab_host_start', { port })
  useCollab.setState({ host: info, address: info.addresses[0] ?? `127.0.0.1:${port}` })
  await start({ hostToken: info.hostToken, code: info.code, origin: 'host', port, ranks: [info.addresses], rank: 0, seed: 'project' })
}

/** Rejoint la session d'un autre poste : adresse « 192.168.1.20:4455 » (port par défaut si absent). */
export async function joinSession(address: string, code: string): Promise<void> {
  if (!(await prepareToLeave())) return
  if (live) finish(null)
  const a = address.trim().replace(/^wss?:\/\//, '').replace(/\/.*$/, '')
  const hostPort = /:\d+$/.test(a) ? a : `${a}:${DEFAULT_PORT}`
  useCollab.setState({ address: hostPort, host: null })
  await start({ code: code.trim(), origin: 'guest', port: DEFAULT_PORT, ranks: [[hostPort]], rank: null, seed: 'wait' })
}

/** Reprend la session interrompue enregistrée sur ce poste (après un plantage ou une fermeture). */
export async function resumeSession(): Promise<void> {
  const r = useCollab.getState().resumable ?? readResume()
  if (!r || !(await prepareToLeave())) return
  if (live) finish(null, true)
  const state = fromBase64(r.state)
  let rank: number | null = null
  let hostToken: string | undefined
  if (r.origin === 'host' && canHost()) {
    // L'hôte revient : il rouvre son relais avec le même code, les autres s'y reconnectent
    const info = await invoke<HostInfo>('collab_host_start', { port: r.port, code: r.code })
    useCollab.setState({ host: info, address: info.addresses[0] ?? `127.0.0.1:${r.port}` })
    rank = 0
    hostToken = info.hostToken
  } else {
    useCollab.setState({ address: r.ranks[0]?.[0] ?? null, host: null })
  }
  await start({ hostToken, code: r.code, origin: r.origin, port: r.port, ranks: r.ranks, backupIds: r.backupIds, rank, seed: 'state', state })
  if (rank === null && live) {
    // Invité : connexion à n'importe quel relais connu ; en attendant, travail local
    live.lostAt = Date.now()
    live.everConnected = true
    useCollab.setState({ status: 'reconnecting', lostSince: live.lostAt })
  }
}

/** Oublie la session interrompue enregistrée sur ce poste. */
export const forgetResume = clearResume

/** Quitte la session (l'hôte d'origine la termine pour tout le monde). Le projet reste ouvert. */
export function leave() {
  finish(null)
}

function finish(reason: 'ended' | 'kicked' | null, keepResume = false) {
  const current = live
  if (!current) return
  current.validation?.destroy()
  current.closing = true
  if (current.retry) clearTimeout(current.retry)
  if (current.probe) clearInterval(current.probe)
  if (current.saveTimer) clearTimeout(current.saveTimer)
  current.cleanups.forEach((f) => f())
  current.ws?.close()
  current.awareness.destroy()
  current.undo.destroy()
  current.doc.destroy()
  live = null
  setHistoryDriver(null)
  setDocumentSessionActive(false)
  // Relais de ce poste : fin de session si c'est l'hôte d'origine qui la quitte ; un poste de secours
  // ferme seulement son relais (les autres retrouvent l'hôte ou un autre secours)
  if (current.rank !== null && isTauri()) void invoke('collab_host_stop', { ended: current.origin === 'host' && reason === null })
  if (!keepResume) clearResume()
  useCollab.setState({
    status: 'off', role: null, origin: null, relayRank: null, participants: [], host: null, address: null,
    canUndo: false, canRedo: false, claims: {}, lostSince: null, chatOpen: false, unread: 0,
  })
  if (reason) notify({ key: reason, tone: 'info' })
  else useCollab.setState({ notice: null })
}

/** Exclut un participant (poste qui fait tourner le relais). */
export async function kick(peerId: number) {
  await invoke('collab_kick', { peerId })
  await refreshHost()
}

/** Seul le poste qui héberge attribue ou retire les réservations. */
export function assignLayer(layer: Layer, peerId: number | null) {
  if (!live || useCollab.getState().role !== 'host') return
  const person = useCollab.getState().participants.find(p => p.peerId === peerId && !p.self)
  live.doc.transact(() => {
    if (person && peerId != null) claimsMap(live!.doc).set(layer, { peerId, userId: person.userId ?? '', name: person.name, color: person.color })
    else claimsMap(live!.doc).delete(layer)
  }, 'claims')
}

/** Envoie un message dans le tchat de la session. */
export function sendChat(text: string) {
  const t = text.trim().slice(0, 2000)
  if (!live || !t) return
  const { userId, name } = useCollab.getState()
  const chat = chatArray(live.doc)
  live.doc.transact(() => {
    chat.push([{ id: randomId(), userId, name: name || '?', color: colorOf(userId), text: t, at: Date.now() }])
    if (useCollab.getState().role === 'host' && chat.length > CHAT_MAX) chat.delete(0, chat.length - CHAT_MAX)
  }, 'chat')
}
