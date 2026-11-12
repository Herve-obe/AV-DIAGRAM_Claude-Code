// Commande de mise en page explicite (« Adapte ce schéma sur une seule page ») : elle ne demande aucune
// compréhension, donc le logiciel l'exécute avec l'outil rearrange_diagram sans démarrer ni appeler le modèle.
// Toute autre formulation, une question ou une demande mêlée d'ajouts passe par le modèle, qui dispose du même outil.
import { fold } from '../model/text'

/** Arguments de rearrange_diagram si le message est une commande de mise en page explicite, sinon undefined. */
export function localLayoutRequest(text: string): Record<string, string> | undefined {
  // Une commande de mise en page tient en une phrase : un cahier des charges n'en est jamais une
  if (text.length > 240 || text.split('\n').length > 3) return
  const value = fold(text)
  const question = /^(?:comment|pourquoi|what|why|how)\b/.test(value) || /\b(?:expliqu\w*|explain\w*|dire|tell)\b.{0,40}\b(?:comment|how)\b/.test(value)
  const negated = /(?:n[’']?e?\s+.{0,25}(?:reorganis|rang|adapt|optimis|fais|faire|mets|mettre|place).{0,8}pas|(?:don.t|do not)\s+(?:rearrange|organize|adapt|optimi[sz]e|make|fit|place))/.test(value)
    || /(?:ne\s+pas|pas\s+de|sans)\s+(?:reorganis|rearrang|rang|adapt|optimis)/.test(value)
  if (question || negated) return
  const action = /adapt|reorganis|rearrang|optimis|dispos|\brang|\bplace|\bfais|\bfaire|\bfit|\bmake|\bmets|\bmettre/.test(value)
  const layout = /mise en page|page layout|\bpage|\bfeuille|lisib|readab|disposition|\ba[0-4]\b/.test(value)
  const edits = /\b(?:ajout|supprim|remplac|gener|creer|connect|add |remov|replac|creat)/.test(value)
  if (!action || (!layout && !/reorganis|rearrang/.test(value)) || edits) return
  const paper = value.match(/\ba[0-4]\b/g)?.at(-1)?.toUpperCase()
  const singlePage = /(?:une|seule|unique|one|single|1)\s*(?:(?:seule|unique|lisible|readable|single)\s+)?(?:page|feuille)/.test(value)
  return { scope: /select|selec/.test(value) ? 'selection' : 'current_sheet', target: singlePage ? 'single_page' : 'readable', ...(paper ? { paper } : {}) }
}
