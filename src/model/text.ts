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

export const slug = (s: string, fallback = 'projet'): string =>
  fold(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || fallback

/** Échappement XML (SVG, draw.io, Visio) des cinq caractères réservés. */
export const xmlEscape = (s: string): string =>
  s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]!)
