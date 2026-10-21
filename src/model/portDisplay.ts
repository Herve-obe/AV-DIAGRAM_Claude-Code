import type { Equipment, PortDef } from './types'

export const PORTS_COMPACT_THRESHOLD = 16

/** Sans choix explicite, les petits appareils restent complets. Aucun port n'est supprimé. */
export function portsToDisplay(ports: PortDef[], used: ReadonlySet<string>, expanded = ports.length <= PORTS_COMPACT_THRESHOLD): PortDef[] {
  return expanded ? ports : ports.filter(p => used.has(p.id))
}

/** Encombrement approximatif, en unités du schéma. */
export function estimateBlock(eq: Pick<Equipment, 'ports' | 'rotation'>): { w: number; h: number } {
  const ins = eq.ports.filter((p) => p.direction === 'in').length
  const rows = Math.max(ins, eq.ports.length - ins)
  const vertical = eq.rotation === 90 || eq.rotation === 270
  return vertical ? { w: Math.max(200, rows * 70), h: 120 } : { w: 240, h: 64 + rows * 20 }
}
