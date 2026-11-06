import { CONNECTORS } from './connectors'
import type { Equipment, NetworkInterface, PortDef, PowerCircuit } from './types'

const object = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x)
const between = (x: unknown, lo: number, hi: number, integer = false) => typeof x === 'number' && Number.isFinite(x) && x >= lo && x <= hi && (!integer || Number.isInteger(x))
const optional = (x: unknown, lo: number, hi: number, integer = false) => x === undefined || between(x, lo, hi, integer)
const text = (x: unknown): x is string => typeof x === 'string' && x.length <= 200

export function ipv4(address: string): number | undefined {
  const parts = address.split('.')
  if (parts.length !== 4 || !parts.every(p => /^(0|[1-9]\d{0,2})$/.test(p) && Number(p) <= 255)) return undefined
  return parts.reduce((n, p) => n * 256 + Number(p), 0)
}
export function isNetwork(n: unknown): n is NetworkInterface {
  return object(n) && (n.address === undefined || (typeof n.address === 'string' && ipv4(n.address) !== undefined))
    && optional(n.prefix, 0, 32, true) && optional(n.vlan, 1, 4094, true)
    && (n.taggedVlans === undefined || (Array.isArray(n.taggedVlans) && n.taggedVlans.length <= 4094 && n.taggedVlans.every(v => between(v, 1, 4094, true)) && new Set(n.taggedVlans).size === n.taggedVlans.length))
    && optional(n.capacityMbps, 0.001, 1e9) && optional(n.poeW, 0, 1e6)
    && (n.poe === undefined || ['source', 'sink', 'none'].includes(n.poe as string))
}
export function isPortDeployment(p: { network?: unknown; intercom?: unknown; clock?: unknown; modes?: unknown }): boolean {
  return (p.modes === undefined || (Array.isArray(p.modes) && p.modes.length > 0 && p.modes.length <= 8 && p.modes.every(m => object(m) && CONNECTORS.some(c => c.id === m.connector)
    && ['mic', 'instrument', 'phono', 'line+4', 'line-10', 'speaker', 'none'].includes(m.level as string)
    && (m.phantom === undefined || ['required', 'supplied', 'none'].includes(m.phantom as string)))))
    && (p.network === undefined || isNetwork(p.network))
    && (p.intercom === undefined || (object(p.intercom) && (p.intercom.channel === undefined || text(p.intercom.channel)) && (p.intercom.group === undefined || text(p.intercom.group))))
    && (p.clock === undefined || (object(p.clock) && text(p.clock.protocol) && !!p.clock.protocol.trim() && text(p.clock.domain) && !!p.clock.domain.trim() && ['master', 'follower', 'auto'].includes(p.clock.role as string) && (p.clock.rate === undefined || text(p.clock.rate))))
}
export function isEquipmentDeployment(e: Partial<Equipment>): boolean {
  return optional(e.poeBudgetW, 0, 1e9) && optional(e.powerFactor, 0.001, 1)
    && (e.powerCircuitId === undefined || typeof e.powerCircuitId === 'string')
    && (e.powerPhase === undefined || ['L1', 'L2', 'L3', 'ABC'].includes(e.powerPhase))
}
export function isPowerCircuits(x: unknown): x is PowerCircuit[] {
  return Array.isArray(x) && x.length <= 1000 && x.every(c => object(c) && text(c.id) && !!c.id && text(c.name) && !!c.name.trim() && [1, 3].includes(c.phases as number) && between(c.voltage, 1, 1000) && optional(c.ratedA, 0.001, 100000)) && new Set(x.map(c => c.id)).size === x.length
}
/** Un modèle conserve les caractéristiques de port, sans les affectations du projet. */
export function templatePort(p: PortDef): PortDef {
  const { network, ...rest } = p
  delete rest.intercom
  delete rest.clock
  const n = network ? { capacityMbps: network.capacityMbps, poe: network.poe, poeW: network.poeW } : undefined
  return { ...rest, ...(n ? { network: n } : {}) }
}
/** Une copie ne doit pas dupliquer une adresse IP ou un maître d'horloge forcé. */
export function copiedPort(p: PortDef): PortDef {
  return { ...p, network: p.network ? { ...p.network, address: undefined } : undefined, clock: p.clock ? { ...p.clock, role: 'auto' } : undefined }
}
