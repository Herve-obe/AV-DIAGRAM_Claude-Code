/** Outils de texte purs, partagés par le métier, les imports et les exports. */

/** Minuscules sans accents : « Écran Été » donne « ecran ete ». Sert aux recherches et aux comparaisons tolérantes. */
export const fold = (s: string): string => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Identifiant sûr (nom de fichier, préfixe de fiche) : lettres et chiffres ASCII séparés par des tirets. */
/** Durée lisible : « 48 s », « 4 min 12 s », « 1 h 05 min ». Les unités sont les mêmes en français et en anglais. */
export function durationLabel(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000))
  const h = Math.floor(total / 3600), min = Math.floor((total % 3600) / 60), s = total % 60
  const two = (n: number) => String(n).padStart(2, '0')
  if (h) return `${h} h ${two(min)} min`
  return min ? `${min} min ${two(s)} s` : `${s} s`
}

/**
 * Découpe une ligne en lignes d'au plus `max` caractères, sans couper un mot.
 * Seul un mot plus long que la ligne entière est coupé (adresse, référence sans espace).
 */
export function wrapWords(line: string, max: number): string[] {
  const limit = Math.max(1, Math.floor(max))
  const size = (s: string) => [...s].length
  const out: string[] = []
  let current = ''
  for (let word of line.split(' ')) {
    while (size(word) > limit) {
      if (current) { out.push(current); current = '' }
      const chars = [...word]
      out.push(chars.slice(0, limit).join(''))
      word = chars.slice(limit).join('')
    }
    if (!current) current = word
    else if (size(current) + 1 + size(word) <= limit) current += ` ${word}`
    else { out.push(current); current = word }
  }
  out.push(current)
  return out
}

export const slug = (s: string, fallback = 'projet'): string =>
  fold(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || fallback

/** Échappement XML (SVG, draw.io, Visio) des cinq caractères réservés. */
export const xmlEscape = (s: string): string =>
  s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]!)
