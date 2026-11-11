// Limites de l'IA locale : une demande longue ou chargée de contraintes dépasse ce qu'un petit modèle
// traite de façon fiable. L'utilisateur est prévenu avant le traitement, qui a lieu quand même.

/** Au-delà de ces seuils, la demande est jugée complexe pour l'IA locale. */
export const LOCAL_COMPLEX_CHARS = 1500
export const LOCAL_COMPLEX_CONSTRAINTS = 5

// Mots qui expriment une exigence, une exclusion ou une condition (français et anglais)
const CONSTRAINT = /\b(?:doit|doivent|devra|devront|faut|obligatoire\w*|imp[ée]rati\w*|exig\w*|interdit\w*|exclu\w*|pas de|sans|aucune?|uniquement|seulement|au moins|au maximum|maximum|minimum|chaque|redondan\w*|s[ée]par[ée]\w*|distinct\w*|ind[ée]pendant\w*|impos[ée]\w*|must|shall|required?|without|never|only|at least|at most|each|separate|independent)\b/i

/** Nombre de propositions (lignes, puces, phrases) qui expriment une contrainte. */
export function countConstraints(text: string): number {
  return text
    .split(/\n+|[.;!?]\s+|\s[-•*]\s/)
    .map(s => s.trim())
    .filter(s => s.length > 3 && CONSTRAINT.test(s.normalize('NFC')))
    .length
}

/** Vrai si la demande est trop longue ou trop contrainte pour être traitée sans risque par l'IA locale. */
export function isComplexForLocal(text: string): boolean {
  return text.trim().length > LOCAL_COMPLEX_CHARS || countConstraints(text) > LOCAL_COMPLEX_CONSTRAINTS
}
