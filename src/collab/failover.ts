// Connexion au relais et continuité de service : tour des relais connus, reconnexion après une coupure,
// prise du relais par un poste de secours si l'hôte reste injoignable, et recherche de l'hôte d'origine
// par un relais de secours.
import { invoke, isTauri } from '@tauri-apps/api/core'
import { useProject } from '../store/projectStore'
import { canHost, notify, prefs, useCollab, type HostInfo } from './collabStore'
import { live, onBinary, onText, type Live } from './protocol'
import { SecureSocket } from './secure'
import { finish } from './session'
import { COLLAB_PROTOCOL } from './ydoc'

const RETRY_MS = 2000
const CONNECT_TIMEOUT_MS = 3000
/** Délai avant qu'un poste de secours prenne le relais (multiplié par son rang) */
const TAKEOVER_MS = 8000
/** Fréquence à laquelle un relais de secours cherche l'hôte d'origine */
const PROBE_MS = 5000

/** Relais de ce poste : liste des postes connectés (adresse IP, pour pouvoir exclure). */
export async function refreshHost() {
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

export function connect() {
  if (!live) return
  const current = live
  current.retry = null
  const addr = target(current)
  if (!addr) return
  const hello = { name: useCollab.getState().name, clientToken: prefs.clientToken, hostToken: current.rank !== null ? current.hostToken : undefined }
  let ws: SecureSocket
  try {
    // Le code ne circule jamais : il protège l'échange de clé, puis tout est chiffré (secure.ts)
    ws = new SecureSocket(`ws://${addr}`, current.code, COLLAB_PROTOCOL, hello, { onText, onBinary, onClose: () => closed() })
  } catch {
    current.retry = setTimeout(connect, RETRY_MS)
    return
  }
  current.ws = ws
  // Une adresse injoignable peut mettre longtemps à échouer : on passe à la suivante
  const timer = setTimeout(() => ws.connecting && ws.close(), CONNECT_TIMEOUT_MS)
  const closed = () => {
    clearTimeout(timer)
    if (live !== current || current.closing || current.ws !== ws) return
    current.ws = null
    if (current.end) return finish(current.end)
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
    const info = await invoke<HostInfo>('collab_host_start', { port: cur.port, code: cur.code, sessionName: useProject.getState().project.name, hostName: useCollab.getState().name })
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
export function probe(addr: string, code: string): Promise<boolean> {
  return new Promise((resolve) => {
    let socket: SecureSocket | null = null
    let settled = false
    const done = (ok: boolean) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      socket?.close()
      resolve(ok)
    }
    const timer = setTimeout(() => done(false), CONNECT_TIMEOUT_MS)
    try {
      // Seul un relais qui connaît le code termine l'échange de clé, puis envoie l'accueil chiffré
      socket = new SecureSocket(`ws://${addr}`, code, COLLAB_PROTOCOL, { name: '' }, {
        onText: (text) => {
          try { const reply = JSON.parse(text); done(reply.type === 'welcome' && reply.protocol === COLLAB_PROTOCOL) }
          catch { done(false) }
        },
        onBinary: () => {},
        onClose: () => done(false),
      })
    } catch {
      done(false)
    }
  })
}

/** Un secours conserve le document accepté : aucun retour automatique vers un état potentiellement ancien. */
async function probeOrigin(cur: Live) {
  if (live !== cur || cur.rank === null) return
  for (const addr of cur.ranks.slice(0, cur.rank).flat()) {
    if (cur.own.includes(addr) || !(await probe(addr, cur.code))) continue
    if (live !== cur || cur.rank === null) return
    if (cur.probe) clearInterval(cur.probe)
    cur.probe = null
    notify({ key: 'returnDeferred', tone: 'warn' })
    return
  }
}
