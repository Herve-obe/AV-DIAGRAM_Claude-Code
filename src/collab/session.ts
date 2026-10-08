// Session de collaboration : relie le store du projet à un document partagé (Yjs) et à un relais
// WebSocket sur le réseau local (src-tauri/src/collab.rs). L'hôte ouvre la session depuis l'application
// de bureau ; les autres la rejoignent avec l'adresse de l'hôte et le code à 6 chiffres.
//
// Protocole sur le relais :
// - texte : {"type":"hello","code","name"} -> {"type":"welcome","peerId","peers"} ou {"type":"refused"} ;
//   {"type":"peer-joined"|"peer-left","peerId"} annoncés par le relais ;
// - binaire : messages y-protocols (0 : synchronisation du document, 1 : présence).
// À chaque arrivée d'un participant, chacun lui envoie l'état de son document : rien n'est perdu,
// même les modifications faites hors ligne pendant une coupure.
import { invoke, isTauri } from '@tauri-apps/api/core'
import * as decoding from 'lib0/decoding'
import * as encoding from 'lib0/encoding'
import * as awarenessProtocol from 'y-protocols/awareness'
import * as syncProtocol from 'y-protocols/sync'
import * as Y from 'yjs'
import { create } from 'zustand'
import { normalizeProject } from '../model/project'
import type { LayerView } from '../model/layers'
import { setHistoryDriver, useProject } from '../store/projectStore'
import { useUi } from '../store/uiStore'
import { createUndoManager, hasProject, observeChanges, readProject, writeProject } from './ydoc'

const MSG_SYNC = 0
const MSG_AWARENESS = 1
export const DEFAULT_PORT = 4455
const PREFS_KEY = 'avd.collab'
const SYNC_TIMEOUT_MS = 10000
const RETRY_MS = 2000

/** Couleurs de présence, distinctes des couleurs de signaux */
const COLORS = ['#e8590c', '#7048e8', '#0ca678', '#d6336c', '#1c7ed6', '#f59f00', '#5c940d', '#ae3ec9']

export interface Participant {
  clientId: number
  peerId?: number
  name: string
  color: string
  layer?: LayerView
  selection: string[]
  self: boolean
}

export interface HostInfo {
  port: number
  code: string
  addresses: string[]
  peers: { id: number; name: string; address: string }[]
}

export type CollabStatus = 'off' | 'connecting' | 'connected' | 'reconnecting'

interface CollabState {
  status: CollabStatus
  role: 'host' | 'guest' | null
  /** Adresse rejointe (invité) ou adresses du poste (hôte) */
  address: string | null
  host: HostInfo | null
  participants: Participant[]
  error: string | null
  name: string
  dialogOpen: boolean
  /** Annulation propre à ce poste pendant la session */
  canUndo: boolean
  canRedo: boolean
  setName: (name: string) => void
  setDialogOpen: (open: boolean) => void
}

function readName(): string {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}').name ?? ''
  } catch {
    return ''
  }
}

export const useCollab = create<CollabState>((set) => ({
  status: 'off',
  role: null,
  address: null,
  host: null,
  participants: [],
  error: null,
  name: readName(),
  dialogOpen: false,
  canUndo: false,
  canRedo: false,
  setName: (name) => {
    set({ name })
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ name }))
    } catch {
      // stockage indisponible : nom gardé pour la session
    }
  },
  setDialogOpen: (dialogOpen) => set({ dialogOpen }),
}))

export const canHost = () => isTauri()

/** Origine des modifications faites sur ce poste (suivie par l'annulation) */
const LOCAL = { local: true }

interface Live {
  doc: Y.Doc
  awareness: awarenessProtocol.Awareness
  undo: Y.UndoManager
  url: string
  code: string
  ws: WebSocket | null
  peerId: number | null
  closing: boolean
  retry: ReturnType<typeof setTimeout> | null
  /** Projet tel qu'il est dans le document (évite de renvoyer ce qu'on vient de recevoir) */
  synced: ReturnType<typeof useProject.getState>['project'] | null
  cleanups: (() => void)[]
}
let live: Live | null = null

const send = (data: Uint8Array) => {
  if (live?.ws?.readyState === WebSocket.OPEN) live.ws.send(data as Uint8Array<ArrayBuffer>)
}

function sendSyncStep1() {
  if (!live) return
  const enc = encoding.createEncoder()
  encoding.writeVarUint(enc, MSG_SYNC)
  syncProtocol.writeSyncStep1(enc, live.doc)
  send(encoding.toUint8Array(enc))
}

function sendAwareness(clients: number[]) {
  if (!live) return
  const enc = encoding.createEncoder()
  encoding.writeVarUint(enc, MSG_AWARENESS)
  encoding.writeVarUint8Array(enc, awarenessProtocol.encodeAwarenessUpdate(live.awareness, clients))
  send(encoding.toUint8Array(enc))
}

function onBinary(data: ArrayBuffer) {
  if (!live) return
  const dec = decoding.createDecoder(new Uint8Array(data))
  const type = decoding.readVarUint(dec)
  if (type === MSG_SYNC) {
    const enc = encoding.createEncoder()
    encoding.writeVarUint(enc, MSG_SYNC)
    syncProtocol.readSyncMessage(dec, enc, live.doc, 'network')
    // Réponse à une demande d'état (étape 1) : on envoie ce qui lui manque
    if (encoding.length(enc) > 1) send(encoding.toUint8Array(enc))
  } else if (type === MSG_AWARENESS) {
    awarenessProtocol.applyAwarenessUpdate(live.awareness, decoding.readVarUint8Array(dec), 'network')
  }
}

function onText(text: string) {
  if (!live) return
  let msg: { type?: string; peerId?: number }
  try {
    msg = JSON.parse(text)
  } catch {
    return
  }
  if (msg.type === 'welcome') {
    live.peerId = msg.peerId ?? null
    live.awareness.setLocalStateField('peerId', live.peerId)
    useCollab.setState({ status: 'connected', error: null })
    sendSyncStep1()
    sendAwareness([live.doc.clientID])
  } else if (msg.type === 'refused') {
    useCollab.setState({ error: 'code' })
    leave()
  } else if (msg.type === 'peer-joined') {
    // Le nouveau venu reçoit notre état complet et notre présence
    sendSyncStep1()
    sendAwareness([live.doc.clientID])
    void refreshHost()
  } else if (msg.type === 'peer-left') {
    const gone = [...live.awareness.getStates()].filter(([, s]) => s.peerId === msg.peerId).map(([id]) => id)
    if (gone.length) awarenessProtocol.removeAwarenessStates(live.awareness, gone, 'network')
    void refreshHost()
  }
}

/** Hôte : liste des postes connectés au relais (adresse IP, pour pouvoir exclure). */
async function refreshHost() {
  if (useCollab.getState().role !== 'host' || !isTauri()) return
  const info = await invoke<HostInfo | null>('collab_host_status')
  if (info) useCollab.setState({ host: info })
}

function connect() {
  if (!live) return
  const current = live
  const ws = new WebSocket(current.url)
  ws.binaryType = 'arraybuffer'
  current.ws = ws
  ws.onopen = () => ws.send(JSON.stringify({ type: 'hello', code: current.code, name: useCollab.getState().name }))
  ws.onmessage = (e) => (typeof e.data === 'string' ? onText(e.data) : onBinary(e.data as ArrayBuffer))
  ws.onclose = () => {
    if (live !== current || current.closing) return
    // Coupure réseau : on continue à travailler, reconnexion automatique, fusion au retour
    useCollab.setState({ status: 'reconnecting' })
    current.retry = setTimeout(connect, RETRY_MS)
  }
}

/** Participants d'après la présence (nom, couleur, calque affiché, sélection). */
function refreshParticipants() {
  if (!live) return
  const me = live.doc.clientID
  const list: Participant[] = []
  for (const [clientId, s] of live.awareness.getStates()) {
    if (!s.name && clientId !== me) continue
    list.push({
      clientId,
      peerId: s.peerId,
      name: s.name || '?',
      color: s.color ?? COLORS[0],
      layer: s.layer,
      selection: Array.isArray(s.selection) ? s.selection : [],
      self: clientId === me,
    })
  }
  list.sort((a, b) => Number(b.self) - Number(a.self) || a.name.localeCompare(b.name))
  useCollab.setState({ participants: list })
}

/**
 * Démarre le lien document <-> store. seed : projet à mettre dans le document (hôte) ; sinon on attend
 * la synchronisation pour remplacer le projet local par celui de la session (invité).
 */
function start(url: string, code: string, role: 'host' | 'guest', seed: boolean): Promise<void> {
  const doc = new Y.Doc()
  const awareness = new awarenessProtocol.Awareness(doc)
  const undo = createUndoManager(doc, LOCAL)
  live = { doc, awareness, undo, url, code, ws: null, peerId: null, closing: false, retry: null, synced: null, cleanups: [] }
  const current = live
  const { name } = useCollab.getState()
  awareness.setLocalState({
    name,
    color: COLORS[doc.clientID % COLORS.length],
    layer: useUi.getState().layer,
    selection: useUi.getState().selectedEquipment,
  })

  if (seed) {
    const p = useProject.getState().project
    writeProject(doc, null, p, 'seed')
    current.synced = p
  }

  // Document -> envoi sur le réseau (sauf ce qui vient du réseau)
  const onUpdate = (update: Uint8Array, origin: unknown) => {
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

  return new Promise((resolve, reject) => {
    let ready = seed
    const bind = () => {
      // Document -> store : relecture des seuls éléments modifiés par les autres (ou par l'annulation)
      current.cleanups.push(observeChanges(doc, (changes, origin) => {
        if (origin === LOCAL) return
        const next = readProject(doc, current.synced ?? undefined, current.synced ? changes : undefined)
        current.synced = next
        useProject.setState({ project: next, saved: false })
      }))
      // Store -> document : chaque modification locale (y compris pendant un glisser)
      current.cleanups.push(useProject.subscribe((s) => {
        if (s.project === current.synced) return
        writeProject(doc, current.synced, s.project, LOCAL)
        current.synced = s.project
      }))
      // Présence : calque affiché et sélection
      current.cleanups.push(useUi.subscribe((s, prev) => {
        if (s.layer !== prev.layer) awareness.setLocalStateField('layer', s.layer)
        if (s.selectedEquipment !== prev.selectedEquipment) awareness.setLocalStateField('selection', s.selectedEquipment)
      }))
      const onStack = () => useCollab.setState({ canUndo: undo.canUndo(), canRedo: undo.canRedo() })
      for (const ev of ['stack-item-added', 'stack-item-popped', 'stack-cleared'] as const) {
        undo.on(ev, onStack)
        current.cleanups.push(() => undo.off(ev, onStack))
      }
      setHistoryDriver({
        undo: () => undo.undo(),
        redo: () => undo.redo(),
        gesture: () => undo.stopCapturing(),
      })
      refreshParticipants()
    }
    if (seed) bind()
    else {
      // Invité : on attend le projet de la session avant de remplacer le projet local
      const timer = setTimeout(() => {
        if (!ready) {
          useCollab.setState({ error: 'timeout' })
          leave()
          reject(new Error('timeout'))
        }
      }, SYNC_TIMEOUT_MS)
      const onFirst = () => {
        if (ready || !hasProject(doc)) return
        ready = true
        clearTimeout(timer)
        doc.off('update', onFirst)
        const p = normalizeProject(readProject(doc))
        current.synced = p
        useProject.getState().load(p)
        bind()
        resolve()
      }
      doc.on('update', onFirst)
      current.cleanups.push(() => { clearTimeout(timer); doc.off('update', onFirst) })
    }
    useCollab.setState({ status: 'connecting', role, error: null })
    connect()
    if (seed) resolve()
  })
}

/** Ouvre une session depuis ce poste (application de bureau). */
export async function hostSession(port = DEFAULT_PORT): Promise<void> {
  if (live) leave()
  const info = await invoke<HostInfo>('collab_host_start', { port })
  useCollab.setState({ host: info, address: info.addresses[0] ?? `127.0.0.1:${port}` })
  await start(`ws://127.0.0.1:${port}`, info.code, 'host', true)
}

/** Rejoint la session d'un autre poste : adresse « 192.168.1.20:4455 » (port par défaut si absent). */
export async function joinSession(address: string, code: string): Promise<void> {
  if (live) leave()
  const a = address.trim().replace(/^wss?:\/\//, '').replace(/\/.*$/, '')
  const hostPort = /:\d+$/.test(a) ? a : `${a}:${DEFAULT_PORT}`
  useCollab.setState({ address: hostPort, host: null })
  await start(`ws://${hostPort}`, code.trim(), 'guest', false)
}

/** Quitte la session (l'hôte la ferme pour tout le monde). Le projet reste ouvert sur ce poste. */
export function leave() {
  const current = live
  if (!current) return
  current.closing = true
  if (current.retry) clearTimeout(current.retry)
  current.cleanups.forEach((f) => f())
  current.ws?.close()
  current.awareness.destroy()
  current.undo.destroy()
  current.doc.destroy()
  live = null
  setHistoryDriver(null)
  const wasHost = useCollab.getState().role === 'host'
  useCollab.setState({ status: 'off', role: null, participants: [], host: null, address: null, canUndo: false, canRedo: false })
  if (wasHost && isTauri()) void invoke('collab_host_stop')
}

/** Exclut un participant (hôte uniquement). */
export async function kick(peerId: number) {
  await invoke('collab_kick', { peerId })
  await refreshHost()
}
