import type { PortDef } from './types'

export const PORTS_COMPACT_THRESHOLD = 16

/** Sans choix explicite, les petits appareils restent complets. Aucun port n'est supprimé. */
export function portsToDisplay(ports: PortDef[], used: ReadonlySet<string>, expanded = ports.length <= PORTS_COMPACT_THRESHOLD): PortDef[] {
  return expanded ? ports : ports.filter(p => used.has(p.id))
}
