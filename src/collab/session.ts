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
// - le secours garde la session quand l’hôte initial revient ; celui-ci rejoint le secours. Un
//   transfert de l’hébergement nécessite une action volontaire pour conserver tout le document.
//
// Découpage : collabStore.ts (état affiché, préférences, reprise), protocol.ts (messages du relais et
// session en cours), failover.ts (connexion, reconnexion, poste de secours) ; ce fichier relie le document
// au projet et expose les actions de l'interface (ouvrir, rejoindre, reprendre, quitter, exclure…).
import { invoke, isTauri } from '@tauri-apps/api/core'
import * as encoding from 'lib0/encoding'
import * as awarenessProtocol from 'y-protocols/awareness'
import * as syncProtocol from 'y-protocols/sync'
import * as Y from 'yjs'
import { normalizeProject } from '../model/project'
import type { Layer } from '../model/layers'
import { setHistoryDriver, useProject } from '../store/projectStore'
import { useUi } from '../store/uiStore'
import { claimMembers, type Claims } from './protection'
import { relayAddresses } from './relayAddress'
import { guestChangeReason, guestLayers, hasFullAccess, type AccessReason } from './access'
import { prepareToLeave, setDocumentSessionActive } from '../io/documentLifecycle'
import { createUndoManager, hasProject, observeChanges, readProject, writeProject } from './ydoc'
import {
  canHost, clearResume, colorOf, COLORS, DEFAULT_PORT, fromBase64, notify, notifyAccess, randomId, readResume, RESUME_KEY, toBase64, useCollab,
  type ChatMessage, type HostInfo, type Participant, type ResumeRecord,
} from './collabStore'
import { connect, probe, refreshHost } from './failover'
import { live, MSG_SYNC, send, sendAwareness, setLive, type Live } from './protocol'

export {
  canHost, DEFAULT_PORT, useCollab,
  type ChatMessage, type CollabStatus, type HostInfo, type Notice, type Participant, type ResumeRecord,
} from './collabStore'

const SYNC_TIMEOUT_MS = 10000
const SAVE_DELAY_MS = 1500
const CHAT_MAX = 500

/** Origine des modifications faites sur ce poste (suivie par l'annulation) */
const LOCAL = { local: true }

/** Participants d'après la présence (nom, couleur, calque affiché, sélection). */
function refreshParticipants() {
  if (!live) return
  const cur = live
  const me = cur.doc.clientID
  const list: Participant[] = []
  const backups = new Map<string, string[]>()
  for (const [clientId, s] of cur.awareness.getStates()) {
    if (!s.name && clientId !== me) continue
    // Relais de secours : adresses privées valides, et seulement pour un participant qui a le plein droit
    // (ou soi-même) : un invité limité ne peut pas devenir le relais de tous et contourner ses droits.
    const addresses = relayAddresses(s.backup)
    const trusted = typeof s.userId === 'string' && (clientId === me || hasFullAccess(useCollab.getState().claims, s.userId))
    const backup = addresses.length > 0 && trusted
    if (backup) backups.set(s.userId, addresses)
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

const claimsMap = (doc: Y.Doc) => doc.getMap<Claims[Layer]>('claims')
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
  const current = openLive(o)
  const { backup } = useCollab.getState()
  // Poste de bureau volontaire : il annonce ses adresses pour pouvoir prendre le relais
  if (canHost() && (backup || o.origin === 'host')) {
    try {
      current.own = await invoke<string[]>('collab_local_addresses', { port: o.port })
      if (o.origin === 'guest' && backup) current.awareness.setLocalStateField('backup', current.own)
    } catch {
      // adresses inconnues : ce poste ne sera pas poste de secours
    }
  }
  seedDocument(current, o)
  relayDocument(current)
  observeSessionData(current)

  if (o.seed === 'project') {
    bindStore(current)
    connect()
    return
  }
  if (o.seed === 'state') {
    // Reprise : le document enregistré sur ce poste devient le projet ouvert
    adoptDocument(current)
    bindStore(current)
    connect()
    return
  }
  await waitForProject(current)
}

/** Nouveau document, présence de ce poste et état « connexion en cours ». */
function openLive(o: StartOptions): Live {
  const doc = new Y.Doc()
  const awareness = new awarenessProtocol.Awareness(doc)
  const undo = createUndoManager(doc, LOCAL)
  const current: Live = {
    doc, awareness, undo, code: o.code, hostToken: o.hostToken, origin: o.origin, port: o.port, ranks: o.ranks, backupIds: o.backupIds ?? [],
    own: [], rank: o.rank, attempt: 0, ws: null, peerId: null, everConnected: false, closing: false,
    peerUsers: new Map(), peerClients: new Map(), end: null, lostAt: null, retry: null, probe: null, saveTimer: null, synced: null, cleanups: [],
  }
  setLive(current)
  const { name, userId } = useCollab.getState()
  awareness.setLocalState({
    name,
    userId,
    color: colorOf(userId),
    layer: useUi.getState().layer,
    selection: useUi.getState().selectedEquipment,
  })
  useCollab.setState({
    status: 'connecting', role: o.rank !== null ? 'host' : 'guest', origin: o.origin, relayRank: o.rank, error: null,
    claims: {}, chat: [], unread: 0, notice: null, lostSince: null, started: false,
  })
  return current
}

/** Contenu initial : projet ouvert (hôte) ou document enregistré (reprise) ; un invité attend la session. */
function seedDocument(current: Live, o: StartOptions) {
  const doc = current.doc
  if (o.seed === 'project') {
    const p = useProject.getState().project
    writeProject(doc, null, p, 'seed')
    doc.getMap('session').set('started', false)
    current.synced = p
  } else if (o.seed === 'state' && o.state) {
    Y.applyUpdate(doc, o.state, 'restore')
    // L'hôte migre les anciennes listes de ports avant de publier son document aux invités.
    if (o.rank !== null) writeProject(doc, null, readProject(doc), 'migration')
  }
}

/** Document -> envoi sur le réseau (sauf ce qui vient du réseau) et enregistrement local ; présence. */
function relayDocument(current: Live) {
  const { doc, awareness } = current
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
}

/** Calques réservés, départ de la session et tchat, lus dans le document. */
function observeSessionData(current: Live) {
  const doc = current.doc
  const claims = claimsMap(doc)
  const onClaims = () => useCollab.setState({ claims: claims.toJSON() as Claims })
  claims.observe(onClaims)
  current.cleanups.push(() => claims.unobserve(onClaims))
  onClaims()
  const session = doc.getMap('session')
  // Les anciennes sessions reprises sans ce champ étaient déjà commencées.
  const onSession = () => useCollab.setState({ started: hasProject(doc) && session.get('started') !== false })
  session.observe(onSession)
  current.cleanups.push(() => session.unobserve(onSession))
  onSession()
  const chat = chatArray(doc)
  const onChat = (e: Y.YArrayEvent<ChatMessage>) => {
    const added = e.changes.delta.reduce((n, d) => n + (Array.isArray(d.insert) ? d.insert.length : 0), 0)
    const fromOthers = added > 0 && e.transaction.origin === 'network'
    useCollab.setState((s) => ({ chat: chat.toArray(), unread: fromOthers && !s.chatOpen ? s.unread + added : s.unread }))
  }
  chat.observe(onChat)
  current.cleanups.push(() => chat.unobserve(onChat))
  useCollab.setState({ chat: chat.toArray() })
}

/** Le projet du document devient le projet ouvert (reprise, arrivée dans une session). */
function adoptDocument(current: Live) {
  useProject.setState({ project: normalizeProject(readProject(current.doc)), past: [], future: [], saved: false })
  current.synced = useProject.getState().project
}

/** Lien dans les deux sens entre le document partagé et le projet ouvert, annulation comprise. */
function bindStore(current: Live) {
  const { doc, awareness, undo } = current
  // Document -> store : relecture des seuls éléments modifiés par les autres (ou par l'annulation)
  current.cleanups.push(observeChanges(doc, (changes, origin) => {
    if (origin === LOCAL) return
    if (origin !== 'network' && current.synced && useCollab.getState().role === 'guest') {
      const next = readProject(doc)
      const st = useCollab.getState()
      const reason: AccessReason | null = !st.started ? { code: 'waiting' } : guestChangeReason(current.synced, next, guestLayers(st.claims, st.userId), useUi.getState().layer, hasFullAccess(st.claims, st.userId))
      if (reason) {
        // Les droits ont pu changer depuis la création du pas d'annulation.
        writeProject(doc, next, current.synced, LOCAL)
        notifyAccess(reason)
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
    const reason: AccessReason | null = current.synced && st.role !== 'host' ? !st.started ? { code: 'waiting' } : guestChangeReason(current.synced, s.project, guestLayers(st.claims, st.userId), useUi.getState().layer, hasFullAccess(st.claims, st.userId)) : null
    if (reason && current.synced) {
      useProject.setState({ project: current.synced })
      notifyAccess(reason)
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
  setHistoryDriver({
    undo: () => { if (historyAllowed(current, false)) undo.undo() },
    redo: () => { if (historyAllowed(current, true)) undo.redo() },
    gesture: () => undo.stopCapturing(),
  })
  refreshParticipants()
}

/** Invité : une annulation ou un rétablissement ne doit pas toucher à ce que ses droits interdisent. */
function historyAllowed(current: Live, redo: boolean): boolean {
  const { doc, undo } = current
  const st = useCollab.getState()
  if (st.role === 'host') return true
  let reason: AccessReason | null = !st.started ? { code: 'waiting' } : useUi.getState().layer === 'all' && !hasFullAccess(st.claims, st.userId) ? { code: 'general' } : null
  const stack = redo ? undo.redoStack : undo.undoStack
  if (!reason && stack.length) {
    // Essayer l'annulation hors réseau avant de toucher au document partagé et à sa pile.
    const preview = new Y.Doc({ gc: false })
    readProject(preview)
    Y.applyUpdate(preview, Y.encodeStateAsUpdate(doc))
    const trial = createUndoManager(preview, LOCAL)
    const copy = stack.map(item => ({ ...item, meta: new Map(item.meta) }))
    if (redo) trial.redoStack = copy
    else trial.undoStack = copy
    try {
      if (redo) trial.redo(); else trial.undo()
      reason = guestChangeReason(readProject(doc), readProject(preview), guestLayers(st.claims, st.userId), useUi.getState().layer, hasFullAccess(st.claims, st.userId))
    } finally { trial.destroy(); preview.destroy() }
  }
  if (reason) notifyAccess(reason)
  return !reason
}

/** Invité : on attend le projet de la session avant de remplacer le projet local. */
function waitForProject(current: Live): Promise<void> {
  const doc = current.doc
  return new Promise<void>((resolve, reject) => {
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
      adoptDocument(current)
      bindStore(current)
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
  const info = await invoke<HostInfo>('collab_host_start', { port, sessionName: useProject.getState().project.name, hostName: useCollab.getState().name })
  useCollab.setState({ host: info, address: info.addresses[0] ?? `127.0.0.1:${port}` })
  await start({ hostToken: info.hostToken, code: info.code, origin: 'host', port, ranks: [info.addresses], rank: 0, seed: 'project' })
}

/** Les invités sont connectés en lecture seule jusqu'au départ donné par l'hôte. */
export function beginSession(): boolean {
  if (!live || useCollab.getState().role !== 'host' || useCollab.getState().status !== 'connected') return false
  live.doc.getMap('session').set('started', true)
  return true
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
  // Un secours héberge déjà le travail le plus récent : l'ancien hôte le rejoint au lieu de
  // démarrer un relais concurrent avec son ancien instantané et de perdre les éditions du secours.
  if (r.origin === 'host') {
    for (const address of r.ranks.slice(1).flat()) {
      if (!(await probe(address, r.code))) continue
      useCollab.setState({ address, host: null })
      await start({ code: r.code, origin: 'guest', port: r.port, ranks: [[address]], rank: null, seed: 'wait' })
      notify({ key: 'joinedRelay', tone: 'info' })
      return
    }
  }
  const state = fromBase64(r.state)
  let rank: number | null = null
  let hostToken: string | undefined
  if (r.origin === 'host' && canHost()) {
    // L'hôte revient : il rouvre son relais avec le même code, les autres s'y reconnectent
    const info = await invoke<HostInfo>('collab_host_start', { port: r.port, code: r.code, sessionName: r.projectName, hostName: useCollab.getState().name })
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

/** Quitte la session ; le poste qui héberge actuellement la termine. Le projet reste ouvert. */
export function leave() {
  finish(null)
}

/** Ferme la session en cours (aussi appelé par protocol.ts et failover.ts). */
export function finish(reason: 'ended' | 'kicked' | null, keepResume = false) {
  const current = live
  if (!current) return
  current.validation?.destroy()
  current.closing = true
  if (current.retry) clearTimeout(current.retry)
  if (current.probe) clearInterval(current.probe)
  if (current.saveTimer) clearTimeout(current.saveTimer)
  current.cleanups.forEach((f) => f())
  // Le relais doit annoncer la fin avant la fermeture de sa propre connexion.
  if (current.rank !== null && isTauri()) {
    void invoke('collab_host_stop', { ended: reason === null && !keepResume })
      .catch(() => {}).finally(() => current.ws?.close())
  } else current.ws?.close()
  current.awareness.destroy()
  current.undo.destroy()
  current.doc.destroy()
  setLive(null)
  setHistoryDriver(null)
  setDocumentSessionActive(false)
  if (!keepResume) clearResume()
  useCollab.setState({
    status: 'off', started: false, role: null, origin: null, relayRank: null, participants: [], host: null, address: null,
    canUndo: false, canRedo: false, claims: {}, lostSince: null, chatOpen: false, unread: 0,
  })
  if (reason) notify({ key: reason, tone: 'info' })
  else useCollab.setState({ notice: null })
}

/** Exclut un participant (poste qui fait tourner le relais). */
export async function kick(peerId: number) {
  if (useCollab.getState().role !== 'host') return
  await invoke('collab_kick', { peerId })
  await refreshHost()
}

/** Seul le poste qui héberge attribue ou retire les réservations. */
export function assignLayer(layer: Layer | 'full', userId: string, granted: boolean) {
  if (!live || useCollab.getState().role !== 'host') return
  const person = useCollab.getState().participants.find(p => p.userId === userId && !p.self && p.peerId != null)
  if (!userId || (granted && !person)) return
  const members = claimMembers(claimsMap(live.doc).get(layer)).filter(c => c.userId !== userId)
  if (granted) members.push({ peerId: person!.peerId, userId, name: person!.name, color: person!.color })
  live.doc.transact(() => {
    if (members.length) claimsMap(live!.doc).set(layer, members)
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
