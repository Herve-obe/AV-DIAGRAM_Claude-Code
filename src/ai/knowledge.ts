// Recherche locale dans le manuel embarqué ; aucun appel d'embedding ni document envoyé à un service.
import manual from '../../docs/manuel-utilisateur.md?raw'

const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
const STOP = new Set(['avec', 'dans', 'pour', 'comment', 'est', 'les', 'des', 'une', 'sur', 'que', 'qui', 'mon', 'mes', 'the', 'and', 'how', 'can'])

export function searchDocumentation(query: string, document = manual) {
  const terms = [...new Set(normalize(query).split(/[^a-z0-9]+/).filter((s) => s.length > 2 && !STOP.has(s)))].slice(0, 20)
  if (!terms.length) return []
  return document.split(/\n(?=## )/).map((section) => {
    const title = section.match(/^## (.+)/)?.[1]
    if (!title) return null
    const text = section.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    const normalized = normalize(text)
    const score = terms.reduce((n, term) => n + (normalized.includes(term) ? 1 : 0) + (normalize(title).includes(term) ? 3 : 0), 0)
    const at = Math.max(0, normalized.indexOf(terms.find((s) => normalized.includes(s)) ?? '') - 120)
    return { source: `Manuel AV Diagram, ${title}`, excerpt: text.slice(at, at + 1400), score }
  }).filter((s): s is NonNullable<typeof s> => !!s && s.score > 0)
    .sort((a, b) => b.score - a.score).slice(0, 3).map(({ source, excerpt }) => ({ source, excerpt }))
}
