/** Outils de texte purs, partagés par le métier, les imports et les exports. */

/** Minuscules sans accents : « Écran Été » donne « ecran ete ». Sert aux recherches et aux comparaisons tolérantes. */
export const fold = (s: string): string => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Identifiant sûr (nom de fichier, préfixe de fiche) : lettres et chiffres ASCII séparés par des tirets. */
export const slug = (s: string, fallback = 'projet'): string =>
  fold(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || fallback

/** Échappement XML (SVG, draw.io, Visio) des cinq caractères réservés. */
export const xmlEscape = (s: string): string =>
  s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]!)
