/** Attend `ms` millisecondes (laisser le navigateur dessiner, espacer des essais). Seul utilitaire de pause du projet. */
export const pause = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))
