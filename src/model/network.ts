import { ipv4 } from './deployment'
import type { Equipment, PortDef, Project } from './types'

export const isNetworkPort = (p: PortDef) => !!p.network || ['network', 'audioIp', 'videoIp'].includes(p.signal) || /rj45|ethercon|sfp/i.test(p.connector) || /\b(dante|aes67|ndi|2110|ethernet)\b/i.test(p.format ?? '')
export const networkPorts = (p: Project) => Object.values(p.equipment).flatMap(e => e.ports.filter(isNetworkPort).map(port => ({ e, port })))
export interface DeploymentIssue { code: string; subject: string; detail?: string }
export const portName = (e: Equipment, port: PortDef) => `${e.name} / ${port.name}`
export function poeLoads(p: Project) {
  const used = new Map<string, {watts:number;unknown:number}>(), counted = new Set<string>()
  for (const l of Object.values(p.links)) for (const [a,b] of [[l.source,l.target],[l.target,l.source]]) {
    const provider = p.equipment[a.equipmentId]?.ports.find(x => x.id === a.portId), sink = p.equipment[b.equipmentId]?.ports.find(x => x.id === b.portId)
    if (provider?.network?.poe !== 'source' || sink?.network?.poe !== 'sink') continue
    const key = JSON.stringify([a.equipmentId,b.equipmentId,b.portId]); if (counted.has(key)) continue; counted.add(key)
    const sum = used.get(a.equipmentId) ?? {watts:0,unknown:0}
    sum.watts += sink.network.poeW ?? 0; sum.unknown += sink.network.poeW === undefined ? 1 : 0; used.set(a.equipmentId,sum)
  }
  return used
}
export function networkIssues(p: Project): DeploymentIssue[] {
  const issues: DeploymentIssue[] = [], ports = networkPorts(p)
  const report = (code: string, subject: string, detail?: string) => issues.push({ code, subject, detail })
  const addresses = new Map<string, { first: typeof ports[number]; unknown?: typeof ports[number]; vlans: Map<number, typeof ports[number]> }>()
  for (const a of ports) {
    const n = a.port.network
    if (!n) continue
    if (n.address) {
      const seen = addresses.get(n.address), other = seen && (n.vlan === undefined ? seen.first : seen.unknown ?? seen.vlans.get(n.vlan))
      if (other) report('duplicateIp', portName(a.e, a.port), portName(other.e, other.port))
      const entry = seen ?? { first: a, unknown: undefined as typeof a | undefined, vlans: new Map<number, typeof a>() }
      if (n.vlan === undefined) entry.unknown ??= a
      else if (!entry.vlans.has(n.vlan)) entry.vlans.set(n.vlan, a)
      addresses.set(n.address, entry)
      if (n.prefix !== undefined && n.prefix <= 30) {
        const host = ipv4(n.address)! % 2 ** (32 - n.prefix)
        if (host === 0 || host === 2 ** (32 - n.prefix) - 1) report('reservedIp', portName(a.e, a.port))
      }
    }
  }
  const used = poeLoads(p)
  const countedSinks = new Map<string,string>()
  for (const l of Object.values(p.links)) {
    const a = p.equipment[l.source.equipmentId], b = p.equipment[l.target.equipmentId]
    const ap = a?.ports.find(x => x.id === l.source.portId), bp = b?.ports.find(x => x.id === l.target.portId)
    if (!ap || !bp || !isNetworkPort(ap) || !isNetworkPort(bp)) continue
    const x = ap.network, y = bp.network
    // Les VLAN natifs se comparent entre eux ; les listes tagged servent aux trunks.
    if (x?.vlan !== undefined && y?.vlan !== undefined && x.vlan !== y.vlan) report('vlanMismatch', l.label)
    if (x?.address && y?.address && x.prefix !== undefined && y.prefix !== undefined && x.vlan === y.vlan) {
      const ai = ipv4(x.address)!, bi = ipv4(y.address)!
      if (Math.floor(ai / 2 ** (32 - x.prefix)) !== Math.floor(bi / 2 ** (32 - x.prefix)) || Math.floor(ai / 2 ** (32 - y.prefix)) !== Math.floor(bi / 2 ** (32 - y.prefix))) report('subnetMismatch', l.label)
    }
    const caps = [x?.capacityMbps, y?.capacityMbps].filter((v): v is number => v !== undefined)
    if (l.bitrateMbps !== undefined && caps.some(c => l.bitrateMbps! > c)) report('bandwidth', l.label)
    for (const [source, sink, se, target] of [[ap, bp, a, b], [bp, ap, b, a]] as const) {
      if (sink.network?.poe !== 'sink') continue
      if (source.network?.poe !== 'source') { report('poeSource', portName(target, sink), portName(se, source)); continue }
      const key = `${target.id}/${sink.id}`
      const provider = `${se.id}/${source.id}`
      if (countedSinks.has(key)) { if (countedSinks.get(key) !== provider) report('poeMultiple',portName(target,sink)); continue }
      countedSinks.set(key,provider)
      const watts = sink.network.poeW, cap = source.network.poeW
      if (watts !== undefined && cap !== undefined && watts > cap) report('poePort', portName(se, source))
    }
  }
  for (const [id, sum] of used) {
    const e = p.equipment[id]
    if (e.poeBudgetW !== undefined && sum.watts > e.poeBudgetW) report('poeBudget', e.name, `${sum.watts} W / ${e.poeBudgetW} W`)
    if (sum.unknown || e.poeBudgetW === undefined) report('poeUnknown', e.name)
  }
  return issues
}
