// Liaisons en série : relier d'un coup, dans l'ordre, les sorties d'un ou plusieurs équipements
// (dix micros, une stagebox…) aux entrées d'un autre (console…), éventuellement dans un multipaire.
import { assignToMulticore, connect, DEFAULT_SHEET_ID } from './project'
import { familiesCompatible, type SignalFamily } from './signals'
import type { Equipment, PortDef, Project } from './types'

export interface PortRef {
  equipmentId: string
  portId: string
}

export interface SeriesOptions {
  /** Famille de signal des sorties à relier (par défaut la plus fréquente parmi les sources) */
  family?: SignalFamily
  /** Première entrée à utiliser sur la destination (par défaut la première libre compatible) */
  startPortId?: string
  /** Ignorer les sorties déjà reliées (par défaut oui) */
  skipLinked?: boolean
}

export interface SeriesPlan {
  family: SignalFamily | null
  pairs: { source: PortRef; target: PortRef }[]
  /** Sorties qui n'ont pas trouvé d'entrée libre */
  unmatched: PortRef[]
}

const isOut = (p: PortDef) => p.direction === 'out' || p.direction === 'bidir'
const isIn = (p: PortDef) => p.direction === 'in' || p.direction === 'bidir'

/** Ordre du schéma : de haut en bas, puis de gauche à droite (feuille par feuille). */
export function schemaOrder(a: Equipment, b: Equipment): number {
  const sa = a.sheetId ?? DEFAULT_SHEET_ID
  const sb = b.sheetId ?? DEFAULT_SHEET_ID
  if (sa !== sb) return sa.localeCompare(sb)
  return a.position.y - b.position.y || a.position.x - b.position.x
}

/** Familles des sorties des sources, de la plus fréquente à la moins fréquente. */
export function sourceFamilies(project: Project, sourceIds: string[]): SignalFamily[] {
  const count = new Map<SignalFamily, number>()
  for (const id of sourceIds) for (const p of project.equipment[id]?.ports ?? []) if (isOut(p)) count.set(p.signal, (count.get(p.signal) ?? 0) + 1)
  return [...count.entries()].sort((a, b) => b[1] - a[1]).map(([f]) => f)
}

/** Entrées libres de la destination compatibles avec une famille, dans l'ordre des ports. */
export function freeInputs(project: Project, destId: string, family: SignalFamily): PortDef[] {
  const used = new Set(Object.values(project.links).filter((l) => l.target.equipmentId === destId).map((l) => l.target.portId))
  return (project.equipment[destId]?.ports ?? []).filter((p) => isIn(p) && !used.has(p.id) && familiesCompatible(family, p.signal))
}

/** Appariement dans l'ordre : sorties des sources (ordre du schéma, puis des ports) vers entrées libres. */
export function planSeries(project: Project, sourceIds: string[], destId: string, opts: SeriesOptions = {}): SeriesPlan {
  const family = opts.family ?? sourceFamilies(project, sourceIds)[0] ?? null
  if (!family || !project.equipment[destId]) return { family, pairs: [], unmatched: [] }
  const linked = new Set(Object.values(project.links).map((l) => `${l.source.equipmentId}/${l.source.portId}`))
  const sources = sourceIds.map((id) => project.equipment[id]).filter((e): e is Equipment => !!e && e.id !== destId).sort(schemaOrder)
  const outs: PortRef[] = sources.flatMap((eq) =>
    eq.ports
      .filter((p) => isOut(p) && p.signal === family && !((opts.skipLinked ?? true) && linked.has(`${eq.id}/${p.id}`)))
      .map((p) => ({ equipmentId: eq.id, portId: p.id })),
  )
  let inputs = freeInputs(project, destId, family)
  if (opts.startPortId) {
    const all = project.equipment[destId].ports
    const start = all.findIndex((p) => p.id === opts.startPortId)
    if (start >= 0) inputs = inputs.filter((p) => all.indexOf(p) >= start)
  }
  const pairs = outs.slice(0, inputs.length).map((source, i) => ({ source, target: { equipmentId: destId, portId: inputs[i].id } }))
  return { family, pairs, unmatched: outs.slice(inputs.length) }
}

/**
 * Crée les liaisons d'un plan ; multicore : null = nouveau multipaire, id = multipaire existant,
 * undefined = câbles séparés. Renvoie les liaisons créées et le multipaire utilisé.
 */
export function applySeries(project: Project, plan: SeriesPlan, multicore?: string | null): { project: Project; linkIds: string[]; multicoreId: string | null } {
  let p = project
  const linkIds: string[] = []
  for (const pair of plan.pairs) {
    const r = connect(p, pair.source, pair.target)
    if (!r.id) continue
    p = r.project
    linkIds.push(r.id)
  }
  if (multicore === undefined || !linkIds.length) return { project: p, linkIds, multicoreId: null }
  const r = assignToMulticore(p, linkIds, multicore)
  return { project: r.project, linkIds, multicoreId: r.id }
}
