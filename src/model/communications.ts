import { isNetworkPort, type DeploymentIssue, portName } from './network'
import type { PortDef, Project } from './types'

export const isIntercomPort = (p: PortDef) => p.signal === 'intercom' || !!p.intercom
export const isClockPort = (p: PortDef) => p.signal === 'sync' || !!p.clock || isNetworkPort(p)
export const communicationPorts = (p: Project, sync: boolean) => Object.values(p.equipment).flatMap(e => e.ports.filter(sync ? isClockPort : isIntercomPort).map(port => ({ e, port })))
export function clockIssues(p: Project): DeploymentIssue[] {
  const domains = new Map<string, ReturnType<typeof communicationPorts>>()
  for (const item of communicationPorts(p, true)) if (item.port.clock) {
    const c = item.port.clock, key = `${c.protocol.trim().toLowerCase()}\0${c.domain.trim().toLowerCase()}`
    domains.set(key, [...domains.get(key) ?? [], item])
  }
  const issues: DeploymentIssue[] = []
  for (const l of Object.values(p.links)) {
    const a = p.equipment[l.source.equipmentId]?.ports.find(p => p.id === l.source.portId)?.clock, b = p.equipment[l.target.equipmentId]?.ports.find(p => p.id === l.target.portId)?.clock
    if (a && b && (a.protocol.trim().toLowerCase() !== b.protocol.trim().toLowerCase() || a.domain.trim().toLowerCase() !== b.domain.trim().toLowerCase())) issues.push({code:'clockLink',subject:l.label})
  }
  for (const entries of domains.values()) {
    const masters = entries.filter(x => x.port.clock!.role === 'master'), autos = entries.filter(x => x.port.clock!.role === 'auto')
    const subject = `${entries[0].port.clock!.protocol} / ${entries[0].port.clock!.domain}`
    if (masters.length > 1) issues.push({ code: 'clockMasters', subject, detail: masters.map(x => portName(x.e, x.port)).join(', ') })
    if (!masters.length && !autos.length && entries.some(x => x.port.clock!.role === 'follower')) issues.push({ code: 'clockSource', subject })
    const rates = new Set(entries.map(x => x.port.clock!.rate?.trim().toLowerCase()).filter(Boolean))
    if (rates.size > 1) issues.push({ code: 'clockRates', subject, detail: [...rates].join(', ') })
  }
  return issues
}
