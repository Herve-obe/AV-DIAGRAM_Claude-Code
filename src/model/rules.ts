// Règles de compatibilité des liaisons. Elles signalent sans bloquer (cahier des charges, 5.4).
import { connectorsMate } from './connectors'
import { familiesCompatible } from './signals'
import type { Level, Link, PortDef, Project } from './types'

export type Severity = 'error' | 'warning' | 'info'

export type RuleCode =
  | 'direction'
  | 'signal-mismatch'
  | 'level-mic-to-line'
  | 'level-line-to-mic'
  | 'level-speaker-to-line'
  | 'level-line-to-speaker'
  | 'adapter-needed'
  | 'input-busy'
  | 'output-busy'
  | 'output-split'
  | 'phantom-missing'
  | 'phantom-unknown'

export interface Issue {
  code: RuleCode
  severity: Severity
  linkId: string
  /** Paramètres injectés dans le message traduit (clé i18n : rules.<code>) */
  params: Record<string, string>
}

/** Sorties qui ne peuvent alimenter qu'une seule entrée (liaisons point à point). */
const POINT_TO_POINT = new Set(['audioDigital', 'audioIp', 'video', 'videoIp', 'network', 'sync', 'power'])

export function findPort(project: Project, ref: { equipmentId: string; portId: string }): PortDef | undefined {
  return project.equipment[ref.equipmentId]?.ports.find((p) => p.id === ref.portId)
}

function levelIssue(src?: Level, dst?: Level): RuleCode | null {
  if (!src || !dst || src === 'none' || dst === 'none') return null
  const isLine = (l: Level) => l === 'line+4' || l === 'line-10'
  if (src === 'speaker' && dst !== 'speaker') return 'level-speaker-to-line'
  if (src !== 'speaker' && dst === 'speaker') return 'level-line-to-speaker'
  if (src === 'mic' && isLine(dst)) return 'level-mic-to-line'
  if (isLine(src) && dst === 'mic') return 'level-line-to-mic'
  return null
}

const SEVERITY: Record<RuleCode, Severity> = {
  direction: 'error',
  'signal-mismatch': 'error',
  'level-speaker-to-line': 'error',
  'level-line-to-speaker': 'warning',
  'level-mic-to-line': 'warning',
  'level-line-to-mic': 'warning',
  'adapter-needed': 'warning',
  'input-busy': 'error',
  'output-busy': 'error',
  'output-split': 'info',
  'phantom-missing': 'warning',
  'phantom-unknown': 'info',
}

/** Vérifie une liaison dans le contexte du projet (les ports déjà occupés comptent). */
export function checkLink(project: Project, link: Link): Issue[] {
  const src = findPort(project, link.source)
  const dst = findPort(project, link.target)
  if (!src || !dst) return []
  const codes: { code: RuleCode; params?: Record<string, string> }[] = []

  if (src.direction === 'in' || dst.direction === 'out') codes.push({ code: 'direction' })

  if (!familiesCompatible(src.signal, dst.signal)) {
    codes.push({ code: 'signal-mismatch', params: { from: src.signal, to: dst.signal } })
  } else {
    const lvl = levelIssue(src.level, dst.level)
    if (lvl) codes.push({ code: lvl })
  }

  if (src.phantom === 'required' && dst.phantom !== 'supplied') {
    codes.push({ code: dst.phantom === 'none' ? 'phantom-missing' : 'phantom-unknown' })
  }

  if (!connectorsMate(src.connector, dst.connector)) {
    codes.push({ code: 'adapter-needed', params: { from: src.connector, to: dst.connector } })
  }

  const all = Object.values(project.links)
  const sameTarget = all.filter(
    (l) => l.target.equipmentId === link.target.equipmentId && l.target.portId === link.target.portId,
  )
  if (sameTarget.length > 1) codes.push({ code: 'input-busy' })

  const sameSource = all.filter(
    (l) => l.source.equipmentId === link.source.equipmentId && l.source.portId === link.source.portId,
  )
  if (sameSource.length > 1) {
    codes.push({ code: POINT_TO_POINT.has(src.signal) ? 'output-busy' : 'output-split' })
  }

  return codes
    .filter((c) => !link.ignoredRules?.includes(c.code))
    .map((c) => ({ code: c.code, severity: SEVERITY[c.code], linkId: link.id, params: c.params ?? {} }))
}

export function checkProject(project: Project): Issue[] {
  const order: Record<Severity, number> = { error: 0, warning: 1, info: 2 }
  return Object.values(project.links)
    .flatMap((l) => checkLink(project, l))
    .sort((a, b) => order[a.severity] - order[b.severity])
}
