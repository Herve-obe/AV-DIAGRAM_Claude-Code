// Messages échangés avec le relais : messages binaires y-protocols (synchronisation du document,
// présence) et messages texte du relais (accueil, refus, arrivées et départs, fin de session).
// Le relais simule une diffusion : un invité ne parle qu'au poste qui héberge (préfixe 255 ajouté par
// le relais) ; l'hôte répond à un poste précis avec le préfixe 254.
// Ce module garde aussi la session en cours (`live`), partagée avec failover.ts et session.ts.
import * as decoding from 'lib0/decoding'
import * as encoding from 'lib0/encoding'
import * as awarenessProtocol from 'y-protocols/awareness'
import * as syncProtocol from 'y-protocols/sync'
import type * as Y from 'yjs'
import type { LayerView } from '../model/layers'
import type { Project } from '../model/types'
import { notify, useCollab, type HostInfo } from './collabStore'
import { refreshHost } from './failover'
import { HostValidation } from './hostValidation'
import { finish, kick } from './session'
import { COLLAB_PROTOCOL } from './ydoc'

export const MSG_SYNC = 0
const MSG_AWARENESS = 1

/** Session en cours sur ce poste : document, présence, connexion au relais et minuteries. */
export interface Live {
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
  end: 'ended' | 'kicked' | null
  lostAt: number | null
  retry: ReturnType<typeof setTimeout> | null
  probe: ReturnType<typeof setInterval> | null
  saveTimer: ReturnType<typeof setTimeout> | null
  /** Projet tel qu'il est dans le document (évite de renvoyer ce qu'on vient de recevoir) */
  synced: Project | null
  cleanups: (() => void)[]
}
export let live: Live | null = null
/** Seuls start() et finish() (session.ts) ouvrent et ferment la session. */
export function setLive(next: Live | null) {
  live = next
}

export const send = (data: Uint8Array) => {
  if (live?.ws?.readyState === WebSocket.OPEN) live.ws.send(data as Uint8Array<ArrayBuffer>)
}

export function sendSyncStep1(peerId?: number) {
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

export function sendAwareness(clients: number[]) {
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

export function onBinary(data: ArrayBuffer) {
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

export function onText(text: string) {
  if (!live) return
  const current = live
  let msg: { type?: string; protocol?: number; reason?: string; peerId?: number; userId?: string; peers?: HostInfo['peers'] }
  try {
    msg = JSON.parse(text)
  } catch {
    return
  }
  if (msg.type === 'welcome') {
    if (msg.protocol !== COLLAB_PROTOCOL) {
      useCollab.setState({ error: 'version' })
      finish(null)
      return
    }
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
    useCollab.setState({ error: msg.reason === 'version' ? 'version' : 'code' })
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
