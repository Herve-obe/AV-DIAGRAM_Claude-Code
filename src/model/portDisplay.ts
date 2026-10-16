import type { PortDef } from './types'

export const PORTS_COMPACT_THRESHOLD = 16

/** Les petits appareils restent complets. Le repliage garde les identifiants et l'ordre des ports. */
export function portsToDisplay(ports: PortDef[], used: ReadonlySet<string>, expanded: boolean): PortDef[] {
  return expanded || ports.length <= PORTS_COMPACT_THRESHOLD ? ports : ports.filter(p => used.has(p.id))
}
