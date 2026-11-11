// Notation automatique de l'assistant sur les cas d'évaluation (docs/ia/evaluation/cas/*.json).
// Métier pur : à partir du cas et du schéma produit, note les exigences vérifiables par programme
// (quantités, liaisons, sorties) et liste celles qui demandent un juge (contraintes, questions attendues).
import type { EquipmentFamily, Project } from '../model/types'
import type { SignalFamily } from '../model/signals'

export interface EvalRequirement {
  id: string
  texte: string
  type: 'quantite' | 'liaison' | 'contrainte' | 'sortie' | 'question_attendue'
  verif: { famille: EquipmentFamily | null; min: number | null; max: number | null; signal: SignalFamily | null; de: string | null; vers: string | null }
}

export interface EvalCase {
  id: string
  titre: string
  difficulte: 'simple' | 'moyen' | 'complexe'
  demande: string
  materielImpose: { designation: string; quantite: number | null; reference: string | null }[]
  exigences: EvalRequirement[]
}

export interface RequirementResult { id: string; texte: string; ok: boolean; detail: string }

export interface CaseGrade {
  id: string
  /** Exigences notées par programme */
  automatic: RequirementResult[]
  /** Contraintes et questions attendues : à noter par un juge (humain ou modèle de référence) */
  forJudge: EvalRequirement[]
  /** Points obtenus / points possibles sur la partie automatique, sur 100 */
  score: number
}

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// Premier mot d'un rôle → familles d'équipement qui peuvent le tenir (rôles définis dans docs/ia/evaluation/README.md)
const ROLE_FAMILIES: Record<string, EquipmentFamily[]> = {
  console: ['console'], stagebox: ['stagebox'], enregistreur: ['recording'], encodeur: ['recording', 'videoRouting'],
  recepteur: ['wireless'], codec: ['processing', 'recording', 'videoRouting', 'control'], horloge: ['sync'], generateur: ['sync'],
  diffusion: ['speaker', 'amplification'], retour: ['speaker', 'amplification', 'wireless'], ecoute: ['speaker'],
  station: ['recording'], lecteur: ['recording'], poste: ['recording', 'videoRouting', 'control'], talkback: ['capture', 'intercom'],
  mesure: ['processing', 'display'], insert: ['processing', 'control'], duplex: ['processing', 'recording', 'videoRouting', 'control'],
}

/** Un équipement tient un rôle si son nom contient tous les mots du rôle, ou, pour un rôle d'un seul mot, si sa famille correspond. */
function matchesRole(project: Project, equipmentId: string, role: string): boolean {
  const e = project.equipment[equipmentId]
  if (!e) return false
  const words = norm(role).split('-').filter(Boolean)
  const text = norm(`${e.name} ${e.model}`)
  if (words.every(w => text.includes(w))) return true
  return words.length === 1 && (ROLE_FAMILIES[words[0]] ?? []).includes(e.family)
}

/** Chemin orienté (sortie vers entrée), direct ou à travers d'autres équipements, d'un rôle vers un autre. */
export function hasPath(project: Project, from: string, to: string, signal: SignalFamily | null = null, maxHops = 6): boolean {
  const ids = Object.keys(project.equipment)
  const starts = ids.filter(id => matchesRole(project, id, from))
  const goals = new Set(ids.filter(id => matchesRole(project, id, to)))
  if (!starts.length || !goals.size) return false
  const next = new Map<string, string[]>()
  for (const l of Object.values(project.links)) {
    const port = project.equipment[l.source.equipmentId]?.ports.find(p => p.id === l.source.portId)
    // Le signal demandé doit être celui de la première liaison ; les relais intermédiaires peuvent convertir
    next.set(l.source.equipmentId, [...(next.get(l.source.equipmentId) ?? []), `${l.target.equipmentId}|${port?.signal ?? ''}`])
  }
  for (const start of starts) {
    const seen = new Set([start])
    let frontier = (next.get(start) ?? []).filter(s => !signal || s.endsWith(`|${signal}`)).map(s => s.split('|')[0])
    for (let hop = 0; hop < maxHops && frontier.length; hop++) {
      if (frontier.some(id => goals.has(id) && id !== start)) return true
      frontier.forEach(id => seen.add(id))
      frontier = [...new Set(frontier.flatMap(id => (next.get(id) ?? []).map(s => s.split('|')[0])))].filter(id => !seen.has(id))
    }
  }
  return false
}

/** Note la partie automatique d'un cas sur le schéma produit par l'assistant. */
export function gradeCase(c: EvalCase, project: Project): CaseGrade {
  const all = Object.values(project.equipment)
  const automatic: RequirementResult[] = []
  const forJudge: EvalRequirement[] = []
  for (const r of c.exigences) {
    const v = r.verif
    if (r.type === 'contrainte' || r.type === 'question_attendue') { forJudge.push(r); continue }
    const checks: string[] = []
    let ok = true
    if (v.famille && (v.min !== null || v.max !== null)) {
      const n = all.filter(e => e.family === v.famille).length
      if ((v.min !== null && n < v.min) || (v.max !== null && n > v.max)) ok = false
      checks.push(`${v.famille} : ${n} (attendu ${v.min ?? 0} à ${v.max ?? '∞'})`)
    }
    if (v.de && v.vers) {
      const path = hasPath(project, v.de, v.vers, v.signal)
      if (!path) ok = false
      checks.push(`${v.de} → ${v.vers}${v.signal ? ` (${v.signal})` : ''} : ${path ? 'relié' : 'non relié'}`)
    }
    if (!checks.length) { forJudge.push(r); continue }
    automatic.push({ id: r.id, texte: r.texte, ok, detail: checks.join(' ; ') })
  }
  const score = automatic.length ? Math.round(100 * automatic.filter(r => r.ok).length / automatic.length) : 0
  return { id: c.id, automatic, forJudge, score }
}

const WEIGHT = { simple: 1, moyen: 2, complexe: 3 } as const

/** Note globale pondérée par la difficulté (simple ×1, moyen ×2, complexe ×3). */
export function overallScore(grades: { grade: CaseGrade; difficulte: EvalCase['difficulte'] }[]): number {
  const total = grades.reduce((n, g) => n + WEIGHT[g.difficulte], 0)
  return total ? Math.round(grades.reduce((n, g) => n + g.grade.score * WEIGHT[g.difficulte], 0) / total) : 0
}
