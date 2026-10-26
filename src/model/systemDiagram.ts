// Câblage générique d'un graphe de rôles : les prises sont choisies dans les fiches, jamais inventées.
import { cablesFor } from './cables'
import { connectorsMate } from './connectors'
import { connect, updateLink } from './project'
import { checkLink } from './rules'
import { familiesCompatible, SIGNAL_FAMILIES } from './signals'
import type { Project } from './types'

// Une fiche peut annoncer plusieurs formats ; un câble ne convertit pas deux protocoles distincts.
const protocols = [/\bAES(?:3|\/EBU)\b/i, /\bMADI\b/i, /S\/?PDIF/i, /\bADAT\b/i, /\bUSB\b/i, /\bDante\b/i, /\bAVB\b/i, /\bAES50\b/i, /\bWord\s*clock\b/i, /\bLTC\b/i, /\bBlack\s*burst\b/i, /\btri[ -]?level\b/i]
const formats = (value = '') => protocols.flatMap((pattern, i) => pattern.test(value) ? [i] : [])

/** Une sortie et une entrée libres par câble ; les appareils multiples sont appariés explicitement. */
export function connectSystem(project: Project, roles: Map<string, string[]>, connections: unknown): { project: Project; addedLinks: string[] } | { error: string } {
  if (!Array.isArray(connections) || connections.length > 100) return { error: 'connections doit contenir au maximum 100 liaisons.' }
  let next = project
  const addedLinks: string[] = []
  const resolve = (ref: string) => roles.get(ref) ?? (Object.hasOwn(next.equipment, ref) ? [ref] : [])
  for (const entry of connections) {
    if (!entry || typeof entry !== 'object' || typeof entry.from !== 'string' || typeof entry.to !== 'string'
      || !SIGNAL_FAMILIES.includes(entry.signal) || (entry.purpose !== undefined && (typeof entry.purpose !== 'string' || entry.purpose.length > 1000))) return { error: 'Chaque liaison exige from, to, signal et éventuellement purpose.' }
    const count = entry.links_per_pair ?? 1
    if (!Number.isInteger(count) || count < 1 || count > 16) return { error: 'links_per_pair doit être un entier de 1 à 16 (nombre de câbles, pas de canaux numériques).' }
    const from = resolve(entry.from), to = resolve(entry.to)
    if (!from.length || !to.length) return { error: `Rôle ou équipement inconnu : ${!from.length ? entry.from : entry.to}.` }
    if ([...from, ...to].some(id => !Object.hasOwn(next.equipment, id))) return { error: 'Un rôle référence un équipement absent du projet.' }
    if (from.length > 1 && to.length > 1 && from.length !== to.length) return { error: `Appariement ambigu : ${entry.from} (${from.length}) → ${entry.to} (${to.length}). Décrire les paires avec leurs refs individuelles.` }
    for (let i = 0; i < Math.max(from.length, to.length); i++) {
      const sourceId = from[i % from.length], targetId = to[i % to.length]
      if (sourceId === targetId) return { error: 'Une liaison physique ne relie pas un appareil à lui-même.' }
      for (let cableIndex = 0; cableIndex < count; cableIndex++) {
        if (addedLinks.length >= 100) return { error: 'Limite de 100 câbles par proposition. Découper le système.' }
        const used = new Set(Object.values(next.links).flatMap(l => [l.source, l.target]).map(r => `${r.equipmentId}/${r.portId}`))
        const candidates = (id: string, input: boolean) => next.equipment[id].ports.filter(p => familiesCompatible(p.signal, entry.signal)
          && (input ? p.direction !== 'out' : p.direction !== 'in') && !used.has(`${id}/${p.id}`)
          && (p.signal !== 'audioAnalog' || (!!p.level && p.level !== 'none'))).sort((a, b) => Number(b.signal === entry.signal) - Number(a.signal === entry.signal))
        let selected: { project: Project; id: string } | undefined
        for (const output of candidates(sourceId, false)) {
          for (const input of candidates(targetId, true)) {
            const outputFormats = formats(output.format), inputFormats = formats(input.format)
            if (outputFormats.length && inputFormats.length && !outputFormats.some(f => inputFormats.includes(f))) continue
            const cable = cablesFor(output.connector, input.connector)[0]
            if (!connectorsMate(output.connector, input.connector) && !cable) continue
            const result = connect(next, { equipmentId: sourceId, portId: output.id }, { equipmentId: targetId, portId: input.id })
            if (!result.id) continue
            const patched = updateLink(result.project, result.id, { ...(cable ? { cableTypeId: cable.id } : {}), ...(entry.purpose ? { notes: entry.purpose } : {}) })
            const unmuted = { ...patched, settings: { ...patched.settings, mutedRules: [] } }
            if (checkLink(unmuted, unmuted.links[result.id]).some(issue => issue.severity !== 'info')) continue
            selected = { project: patched, id: result.id }
            break
          }
          if (selected) break
        }
        if (!selected) return { error: (cableIndex > 0 ? `La simulation a trouvé ${cableIndex} câble(s) compatible(s) pour cette paire, mais links_per_pair=${count} en demande ${count} pour CHAQUE paire (${count * Math.max(from.length, to.length)} câbles pour ce flux). Si un seul câble par appareil est voulu, utiliser links_per_pair=1 ou omettre ce champ ; ne pas y mettre la quantité d’équipements. Si ces câbles indépendants sont obligatoires, choisir des appareils ou interfaces disposant des prises nécessaires. ` : '') + `Aucune paire de prises libres et documentées compatible (${entry.signal}) entre ${next.equipment[sourceId].name} et ${next.equipment[targetId].name}. Vérifier les modes micro/ligne, la capacité, le protocole et les convertisseurs nécessaires ; lire les fiches ou demander une précision.` }
        next = selected.project
        addedLinks.push(selected.id)
      }
    }
  }
  return { project: next, addedLinks }
}
