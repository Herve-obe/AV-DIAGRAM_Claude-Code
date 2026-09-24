// Nomenclature et bilans (puissance, courant, poids, unités de rack).
import type { Project } from './types'

export interface BomLine {
  key: string
  manufacturer?: string
  model: string
  quantity: number
  powerW?: number
  weightKg?: number
}

export function buildBom(project: Project): BomLine[] {
  const lines = new Map<string, BomLine>()
  for (const eq of Object.values(project.equipment)) {
    const key = `${eq.manufacturer ?? ''}|${eq.model}`
    const line = lines.get(key)
    if (line) line.quantity += 1
    else lines.set(key, { key, manufacturer: eq.manufacturer, model: eq.model, quantity: 1, powerW: eq.powerW, weightKg: eq.weightKg })
  }
  return [...lines.values()].sort((a, b) => a.model.localeCompare(b.model))
}

export interface Totals {
  equipmentCount: number
  /** Puissance totale déclarée (W) */
  powerW: number
  /** Courant en monophasé : I = P / U (A) */
  currentA: number
  weightKg: number
  rackU: number
  /** Équipements sans puissance déclarée : le total est alors un minimum */
  missingPower: number
}

export function computeTotals(project: Project): Totals {
  const eqs = Object.values(project.equipment)
  const powerW = eqs.reduce((s, e) => s + (e.powerW ?? 0), 0)
  return {
    equipmentCount: eqs.length,
    powerW,
    currentA: project.settings.mainsVoltage > 0 ? powerW / project.settings.mainsVoltage : 0,
    weightKg: eqs.reduce((s, e) => s + (e.weightKg ?? 0), 0),
    rackU: eqs.reduce((s, e) => s + (e.rackU ?? 0), 0),
    missingPower: eqs.filter((e) => e.powerW === undefined).length,
  }
}
