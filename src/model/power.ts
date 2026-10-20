import { componentsOf } from './modules'
import type { Equipment, PowerCircuit, Project } from './types'

export const equipmentPower = (e: Equipment) => {
  const parts = componentsOf(e)
  return { watts: parts.reduce((s, part) => s + (part.powerW ?? 0), 0), unknown: parts.filter(part => part.powerW === undefined).length }
}
export function circuitLoad(p: Project, c: PowerCircuit) {
  const phases = ['L1', 'L2', 'L3'] as const
  const equipment = Object.values(p.equipment).filter(e => e.powerCircuitId === c.id)
  const loads = phases.slice(0, c.phases).map(phase => ({ phase, watts: 0, amps: 0, unknown: 0, count: 0 }))
  let unphased = 0
  for (const e of equipment) {
    const power = equipmentPower(e)
    const assigned = c.phases === 1 ? (e.powerPhase === undefined || e.powerPhase === 'L1' ? 'L1' : e.powerPhase) : e.powerPhase
    const targets = assigned === 'ABC' && c.phases === 3 ? loads : loads.filter(x => x.phase === assigned)
    if (!targets.length) { unphased++; continue }
    for (const l of targets) {
      l.count++; l.watts += power.watts / targets.length
      // Somme des courants nominaux déclarés : budget conservateur, aucun foisonnement implicite.
      if (e.powerFactor !== undefined) l.amps += power.watts / targets.length / (c.voltage * e.powerFactor)
      l.unknown += power.unknown + (e.powerFactor === undefined ? 1 : 0)
    }
  }
  return { equipment, loads, unphased }
}
export function removeCircuit(p: Project, id: string): Project {
  return { ...p, settings: { ...p.settings, powerCircuits: p.settings.powerCircuits?.filter(c => c.id !== id) }, equipment: Object.fromEntries(Object.entries(p.equipment).map(([key, e]) => [key, e.powerCircuitId === id ? { ...e, powerCircuitId: undefined, powerPhase: undefined } : e])) }
}
