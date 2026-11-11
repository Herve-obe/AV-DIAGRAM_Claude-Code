import { describe, expect, it, vi } from 'vitest'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js'
import { Cipher, deriveKeys, KIND_BINARY, KIND_TEXT, SecureSocket, share } from './secure'

// Vecteurs partagés avec src-tauri/src/secure.rs : scalaires tirés de 64 octets 0x01 (invité) et 0x02 (relais)
const CLIENT_SHARE = 'd81e41fbf86d63d9857f95330bd723296f2af3861422bff96ddbba600435f86a'
const SERVER_SHARE = '2c6958bdeb45c9dd409d5b322be87b8af178e857534e3123b828a4d887110c66'
const KEYS = '195dd4bf813bcae8462c725065819e011f199004457fa8edaa1bed555d3844a1 5faaac10dc6b0299a4d145c5dc943ce208e4e71e141a5ffcbc84a8d5ae9b9765 39db6413837c22fb6712fe1a4c783ef594eb03f6f0c578ff0ddbc788df5dc64d'
const FRAME = '8bd1f6fce0ebafe2d9a2b007215faccab31dd7232174'

describe('chiffrement de la collaboration', () => {
  it('produit les mêmes parts, clés et trames que le relais', () => {
    const client = share('123456', new Uint8Array(64).fill(1))
    const server = share('123456', new Uint8Array(64).fill(2))
    expect(bytesToHex(client.share)).toBe(CLIENT_SHARE)
    expect(bytesToHex(server.share)).toBe(SERVER_SHARE)
    const mine = deriveKeys(client.scalar, server.share, client.share, server.share)
    const theirs = deriveKeys(server.scalar, client.share, client.share, server.share)
    expect([mine.send, mine.receive, mine.confirm].map(bytesToHex).join(' ')).toBe(KEYS)
    expect([theirs.send, theirs.receive, theirs.confirm].map(bytesToHex).join(' ')).toBe(KEYS)
    expect(bytesToHex(new Cipher(mine.send).seal(KIND_TEXT, new TextEncoder().encode('hello')))).toBe(FRAME)
  })

  it('un mauvais code donne d’autres clés ; une trame modifiée ou rejouée est refusée', () => {
    const client = share('654321')
    const server = share('123456')
    const wrong = deriveKeys(client.scalar, server.share, client.share, server.share)
    const right = deriveKeys(server.scalar, client.share, client.share, server.share)
    expect(bytesToHex(wrong.confirm)).not.toBe(bytesToHex(right.confirm))
    const frame = new Cipher(wrong.send).seal(KIND_BINARY, Uint8Array.of(1, 2, 3))
    expect(() => new Cipher(right.send).open(frame)).toThrow()

    const key = new Uint8Array(32).fill(7), out = new Cipher(key), inn = new Cipher(key)
    const a = out.seal(KIND_BINARY, Uint8Array.of(1))
    const altered = a.slice(); altered[0] ^= 1
    expect(() => new Cipher(key).open(altered)).toThrow()
    expect(inn.open(a).payload).toEqual(Uint8Array.of(1))
    expect(() => inn.open(a)).toThrow()
  })

  it('refuse une part neutre ou mal formée', () => {
    const client = share('123456')
    expect(() => deriveKeys(client.scalar, new Uint8Array(32), client.share, new Uint8Array(32))).toThrow()
    expect(() => deriveKeys(client.scalar, new Uint8Array(32).fill(0xff), client.share, new Uint8Array(32))).toThrow()
  })

  it('une fausse session (relais sans le bon code) ne reçoit jamais la présentation', async () => {
    const sent: (string | Uint8Array)[] = []
    class FakeHost {
      static OPEN = 1
      readyState = 0
      onopen: (() => void) | null = null
      onmessage: ((e: { data: string }) => void) | null = null
      onclose: (() => void) | null = null
      onerror: (() => void) | null = null
      constructor() { setTimeout(() => { this.readyState = 1; this.onopen?.() }, 0) }
      send(value: string | Uint8Array) {
        sent.push(value)
        const pake = JSON.parse(value as string), mine = share('000000'), client = hexToBytes(pake.share)
        const keys = deriveKeys(mine.scalar, client, client, mine.share)
        setTimeout(() => this.onmessage?.({ data: JSON.stringify({ type: 'pake', share: bytesToHex(mine.share), confirm: bytesToHex(keys.confirm) }) }), 0)
      }
      close() { this.readyState = 3; this.onclose?.() }
    }
    vi.stubGlobal('WebSocket', FakeHost)
    const texts: string[] = [], closed = vi.fn()
    new SecureSocket('ws://192.168.1.20:4455', '123456', 7, { name: 'Régie', clientToken: 'secret' }, { onText: t => texts.push(t), onBinary: vi.fn(), onClose: closed })
    await vi.waitFor(() => expect(closed).toHaveBeenCalled())
    vi.unstubAllGlobals()
    expect(texts).toEqual([JSON.stringify({ type: 'refused', reason: 'code' })])
    // Seule la part publique est partie : ni le code, ni le nom, ni le jeton
    expect(sent).toHaveLength(1)
    expect(String(sent[0])).not.toMatch(/123456|Régie|secret/)
  })
})
