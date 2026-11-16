// Chiffrement de la collaboration sur le réseau local (protocole 7), côté application.
// Le relais (src-tauri/src/collab.rs) applique exactement les mêmes règles ; les vecteurs de test
// de secure.test.ts et de collab.rs garantissent que les deux implémentations s'accordent.
//
// 1. Échange de clé CPace sur ristretto255, protégé par le code de session à 6 chiffres :
//    - générateur G = élément dérivé (RFC 9496) de SHA-512(« AVD-CPace-G-v1 » ‖ code) ;
//    - chacun tire un scalaire aléatoire et envoie sa part s·G ; le secret commun est K = s·(part de l'autre) ;
//    - un espion qui observe l'échange n'apprend rien sur le code ni sur K ; un faux relais ou un poste
//      qui devine le code n'a droit qu'à un essai par connexion (le relais en limite le nombre).
// 2. Le relais prouve qu'il connaît le code (confirmation) ; l'invité refuse sinon : une fausse session
//    annoncée sur le réseau ne reçoit jamais le document.
// 3. Ensuite, chaque message WebSocket est chiffré et authentifié (ChaCha20-Poly1305), une clé par sens,
//    nonce = compteur implicite : un message modifié, rejoué, supprimé ou réordonné ferme la connexion.
import { ristretto255, ristretto255_hasher } from '@noble/curves/ed25519.js'
import { bytesToNumberLE } from '@noble/curves/utils.js'
import { chacha20poly1305 } from '@noble/ciphers/chacha.js'
import { sha256, sha512 } from '@noble/hashes/sha2.js'
import { bytesToHex, concatBytes, hexToBytes, randomBytes, utf8ToBytes } from '@noble/hashes/utils.js'

const Point = ristretto255.Point

/** Contenu d'une trame chiffrée : message de contrôle JSON ou message y-protocols */
export const KIND_TEXT = 0
export const KIND_BINARY = 1

export interface SessionKeys {
  /** Clé invité → relais */
  send: Uint8Array
  /** Clé relais → invité */
  receive: Uint8Array
  /** Preuve, envoyée par le relais, qu'il connaît le code */
  confirm: Uint8Array
}

/** Générateur propre au code : sans le code, aucune part échangée ne peut être exploitée. */
export function generator(code: string) {
  return ristretto255_hasher.deriveToCurve!(sha512(concatBytes(utf8ToBytes('AVD-CPace-G-v1'), utf8ToBytes(code))))
}

/** Scalaire secret de l'échange ; `random` (64 octets) n'est fourni que par les tests. */
export function share(code: string, random: Uint8Array = randomBytes(64)) {
  const scalar = Point.Fn.create(bytesToNumberLE(random))
  if (scalar === 0n) throw new Error('scalaire nul')
  return { scalar, share: generator(code).multiply(scalar).toBytes() }
}

/** Clés de session d'après son scalaire et la part de l'autre ; les deux parts fixent l'ordre (invité, relais). */
export function deriveKeys(scalar: bigint, peerShare: Uint8Array, clientShare: Uint8Array, serverShare: Uint8Array): SessionKeys {
  // fromBytes refuse un encodage non canonique ; la part neutre donnerait un secret nul, refusé aussi
  const k = Point.fromBytes(peerShare).multiply(scalar)
  if (k.is0()) throw new Error('part invalide')
  const isk = sha512(concatBytes(utf8ToBytes('AVD-CPace-ISK-v1'), clientShare, serverShare, k.toBytes()))
  const derive = (label: string) => sha256(concatBytes(utf8ToBytes(label), isk))
  return { send: derive('c2s'), receive: derive('s2c'), confirm: derive('confirm-s') }
}

/** Comparaison sans sortie anticipée */
export function sameBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0
}

/** Chiffrement d'un sens de la connexion : nonce = 4 octets nuls + compteur sur 8 octets (gros-boutiste). */
export class Cipher {
  private counter = 0n
  constructor(private readonly key: Uint8Array) {}

  private nonce() {
    const nonce = new Uint8Array(12)
    new DataView(nonce.buffer).setBigUint64(4, this.counter++)
    return nonce
  }

  seal(kind: number, payload: Uint8Array): Uint8Array {
    return chacha20poly1305(this.key, this.nonce()).encrypt(concatBytes(Uint8Array.of(kind), payload))
  }

  /** Lève une erreur si la trame a été modifiée, rejouée ou n'est pas la suivante attendue. */
  open(frame: Uint8Array): { kind: number; payload: Uint8Array } {
    const plain = chacha20poly1305(this.key, this.nonce()).decrypt(frame)
    if (!plain.length) throw new Error('trame vide')
    return { kind: plain[0], payload: plain.subarray(1) }
  }
}

/** Part d'échange ou preuve : exactement 32 octets en hexadécimal */
const fromHex = (text: unknown): Uint8Array | null => (typeof text === 'string' && /^[0-9a-f]{64}$/.test(text) ? hexToBytes(text) : null)

export interface SecureHandlers {
  /** Message de contrôle du relais (JSON) : accueil, refus, arrivées, départs, fin de session */
  onText(text: string): void
  /** Message y-protocols */
  onBinary(data: ArrayBuffer): void
  onClose(): void
}

/**
 * Connexion chiffrée au relais. `hello` (nom, jetons) n'est envoyé qu'après la preuve que le relais connaît
 * le code ; avant, seul un refus en clair (code ou version) est pris en compte.
 */
export class SecureSocket {
  private readonly ws: WebSocket
  private outgoing: Cipher | null = null
  private incoming: Cipher | null = null
  private closed = false

  constructor(url: string, code: string, protocol: number, hello: Record<string, unknown>, private readonly handlers: SecureHandlers) {
    const mine = share(code)
    this.ws = new WebSocket(url)
    this.ws.binaryType = 'arraybuffer'
    this.ws.onopen = () => this.ws.send(JSON.stringify({ type: 'pake', protocol, share: bytesToHex(mine.share) }))
    this.ws.onclose = () => this.terminate()
    this.ws.onerror = () => this.terminate()
    this.ws.onmessage = (e) => {
      if (this.closed) return
      if (this.incoming) {
        // Après l'échange de clé, tout message en clair est refusé
        if (typeof e.data === 'string') return this.fail()
        let frame
        try {
          frame = this.incoming.open(new Uint8Array(e.data as ArrayBuffer))
        } catch {
          return this.fail()
        }
        if (frame.kind === KIND_TEXT) this.handlers.onText(new TextDecoder().decode(frame.payload))
        else if (frame.kind === KIND_BINARY) this.handlers.onBinary(frame.payload.slice().buffer)
        return
      }
      if (typeof e.data !== 'string') return this.fail()
      let msg: { type?: string; share?: unknown; confirm?: unknown }
      try {
        msg = JSON.parse(e.data)
      } catch {
        return this.fail()
      }
      if (msg.type === 'refused') return this.handlers.onText(e.data)
      const theirs = fromHex(msg.share), confirm = fromHex(msg.confirm)
      let keys: SessionKeys | null = null
      try {
        if (msg.type === 'pake' && theirs && confirm) keys = deriveKeys(mine.scalar, theirs, mine.share, theirs)
      } catch {
        keys = null
      }
      // Mauvais code, ou poste qui n'est pas le relais de cette session
      if (!keys || !sameBytes(keys.confirm, confirm!)) {
        this.handlers.onText(JSON.stringify({ type: 'refused', reason: 'code' }))
        return this.fail()
      }
      this.outgoing = new Cipher(keys.send)
      this.incoming = new Cipher(keys.receive)
      this.sendFrame(KIND_TEXT, utf8ToBytes(JSON.stringify({ type: 'hello', ...hello })))
    }
  }

  /** Vrai une fois la connexion ouverte et les clés établies */
  get ready(): boolean {
    return !this.closed && !!this.outgoing && this.ws.readyState === WebSocket.OPEN
  }

  /** Vrai tant que la connexion n'est ni établie ni fermée (utilisé pour le délai de connexion) */
  get connecting(): boolean {
    return !this.closed && !this.outgoing
  }

  send(data: Uint8Array) {
    if (this.ready) this.sendFrame(KIND_BINARY, data)
  }

  private sendFrame(kind: number, payload: Uint8Array) {
    this.ws.send(this.outgoing!.seal(kind, payload) as Uint8Array<ArrayBuffer>)
  }

  close() {
    try {
      this.ws.close()
    } catch {
      // déjà fermée
    }
    this.terminate()
  }

  private fail() {
    this.close()
  }

  private terminate() {
    if (this.closed) return
    this.closed = true
    this.ws.onmessage = null
    this.handlers.onClose()
  }
}
