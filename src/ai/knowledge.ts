// Recherche locale dans les fiches de procédure et le manuel embarqués ; aucun appel d'embedding ni document envoyé à un service.
import manual from '../../docs/manuel-utilisateur.md?raw'
import { fold } from '../model/text'

// Fiches « comment faire » (docs/ia/procedures.md) : gestes exacts, libellés de l'interface, chapitre du manuel.
// Chargement tolérant : sans le fichier, la recherche porte sur le manuel seul.
const procedureFiles = import.meta.glob<string>('../../docs/ia/procedures.md', { query: '?raw', import: 'default', eager: true })
const PROCEDURES = Object.values(procedureFiles)[0] ?? ''

const normalize = fold
const STOP = new Set(['avec', 'dans', 'pour', 'comment', 'est', 'les', 'des', 'une', 'sur', 'que', 'qui', 'mon', 'mes', 'the', 'and', 'how', 'can',
  'fait', 'faire', 'fais', 'peux', 'peut', 'veux', 'faut', 'ajouter', 'cree', 'creer', 'mettre', 'utiliser'])

/** Mots de la question utiles à la recherche ; « ajoute une zone » et « ajouter des zones » donnent la même racine. */
function terms(query: string) {
  return [...new Set(normalize(query).split(/[^a-z0-9]+/).filter((s) => s.length > 2 && !STOP.has(s)).map((s) => (s.length > 4 ? s.replace(/(?:s|x)$/, '') : s)))].slice(0, 20)
}

/** Une question d'usage du logiciel (« comment… », « où se trouve… », « how do I… ») plutôt qu'une demande de schéma. */
export function isHowToQuestion(text: string): boolean {
  return /^(?:comment|ou\b|où|quel(?:le)?s? (?:menu|bouton|raccourci|onglet)|est-ce qu.{0,6}(?:on|je) peu|peut-on|je (?:ne )?(?:trouve|sais|vois) pas|how\b|where\b|what (?:menu|button|shortcut))/i.test(text.trim())
}

/** Fiches de procédure les plus proches de la question, mots-clés et titre comptant davantage. */
export function searchProcedures(query: string, document = PROCEDURES) {
  const words = terms(query)
  if (!words.length || !document) return []
  return document.split(/\n(?=## )/).map((section) => {
    const title = section.match(/^## (.+)/)?.[1]?.trim()
    if (!title) return null
    const keywords = normalize(section.match(/^Mots-clés\s*:(.*)$/m)?.[1] ?? '')
    const body = normalize(section)
    const score = words.reduce((n, w) => n + (body.includes(w) ? 1 : 0) + (keywords.includes(w) ? 3 : 0) + (normalize(title).includes(w) ? 4 : 0), 0)
    // La ligne « Libellés » sert aux tests de cohérence, pas au modèle
    const excerpt = section.replace(/^Libellés\s*:.*$/m, '').trim().slice(0, 1600)
    return { source: `Procédure AV Diagram, ${title}`, excerpt, score }
  }).filter((s): s is NonNullable<typeof s> => !!s && s.score >= 3)
    .sort((a, b) => b.score - a.score).slice(0, 2).map(({ source, excerpt }) => ({ source, excerpt }))
}

function searchManual(query: string, document: string) {
  const words = terms(query)
  if (!words.length) return []
  return document.split(/\n(?=## )/).map((section) => {
    const title = section.match(/^## (.+)/)?.[1]
    if (!title) return null
    const text = section.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    const normalized = normalize(text)
    const score = words.reduce((n, term) => n + (normalized.includes(term) ? 1 : 0) + (normalize(title).includes(term) ? 3 : 0), 0)
    const at = Math.max(0, normalized.indexOf(words.find((s) => normalized.includes(s)) ?? '') - 120)
    return { source: `Manuel AV Diagram, ${title}`, excerpt: text.slice(at, at + 1400), score }
  }).filter((s): s is NonNullable<typeof s> => !!s && s.score > 0)
    .sort((a, b) => b.score - a.score).slice(0, 3).map(({ source, excerpt }) => ({ source, excerpt }))
}

/** Fiches de procédure d'abord (au plus deux), puis le manuel ; trois extraits au total. */
export function searchDocumentation(query: string, document = manual, procedures = PROCEDURES) {
  const found = searchProcedures(query, procedures)
  return [...found, ...searchManual(query, document)].slice(0, 3)
}
