// Outils de l'assistant (cahier des charges, 12.3, couche 2) : l'IA n'agit sur le schéma qu'à travers
// ces fonctions, qui s'appuient sur la bibliothèque et le moteur de règles. Elle ne peut donc pas
// inventer un équipement ou une caractéristique. Les modifications sont faites sur un brouillon,
// montré en aperçu : l'utilisateur l'applique (une seule étape d'annulation) ou le refuse.
import { addEquipment, connect, DEFAULT_SHEET_ID, sheetName } from '../model/project'
import { checkLink, checkProject, type Issue } from '../model/rules'
import type { EquipmentTemplate, PortDef, Project } from '../model/types'
import type { ToolCall, ToolSpec } from './providers'
import { searchDocumentation } from './knowledge'
import { diagramBlockSize, layoutDiagram } from '../model/diagramLayout'
import { videoStudioPlan } from '../model/videoStudio'

export interface Draft {
  /** Projet de départ : l'aperçu ne s'applique que s'il n'a pas changé entre-temps */
  base: Project
  project: Project
  sheetId: string
  addedEquipment: string[]
  addedLinks: string[]
}

export function createDraft(project: Project, sheetId: string): Draft {
  return { base: project, project, sheetId, addedEquipment: [], addedLinks: [] }
}

export const hasChanges = (d: Draft) => d.addedEquipment.length + d.addedLinks.length > 0

export interface ToolContext {
  library: EquipmentTemplate[]
  /** Texte lisible d'une alerte des règles (traduit) */
  describe: (issue: Issue) => string
  allowed?: (before: Project, after: Project) => boolean
}

const str = { type: 'string' }
const portOffset = { type: 'integer', description: 'Décalage pour lire les prises par pages de 16 ; utiliser next_offset.' }

export const TOOL_SPECS: ToolSpec[] = [
  {
    name: 'search_documentation',
    description: 'Recherche dans le manuel local AV Diagram. Citer le champ source dans la réponse ; ne pas inventer de documentation constructeur.',
    parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] },
  },
  {
    name: 'search_library',
    description:
      "Cherche des modèles d'équipements dans la bibliothèque d'AV Diagram (fiches constructeur vérifiées et blocs génériques). À utiliser avant toute pose d'équipement.",
    parameters: {
      type: 'object',
      properties: { query: { ...str, description: 'Mots-clés : marque, modèle ou type (ex. « SQ5 », « stagebox dante », « micro statique »)' } },
      required: ['query'],
    },
  },
  {
    name: 'get_template',
    description: "Détail d'un modèle de la bibliothèque : ports (sens, signal, connecteur, niveau, canaux), puissance, poids, sources documentaires.",
    parameters: { type: 'object', properties: { template_id: str, offset: portOffset }, required: ['template_id'] },
  },
  {
    name: 'get_project',
    description: 'Résumé du schéma ouvert : feuilles, équipements (identifiant, nom, modèle), liaisons (étiquette, origine, destination).',
    parameters: { type: 'object', properties: { offset: { type: 'integer', description: 'Décalage pour lire les équipements et liaisons par pages de 25.' } } },
  },
  {
    name: 'get_equipment',
    description: "Ports d'un équipement posé dans le schéma, avec les liaisons déjà branchées sur chacun.",
    parameters: { type: 'object', properties: { equipment_id: str, offset: portOffset }, required: ['equipment_id'] },
  },
  {
    name: 'add_equipment',
    description: "Propose de poser un équipement de la bibliothèque sur la feuille affichée. La proposition n'est appliquée qu'après accord de l'utilisateur.",
    parameters: {
      type: 'object',
      properties: { template_id: str, name: { ...str, description: 'Nom sur le schéma (facultatif, ex. « Console FOH »)' } },
      required: ['template_id'],
    },
  },
  {
    name: 'connect_ports',
    description:
      "Propose une liaison entre une sortie et une entrée (identifiants d'équipements et de ports tirés de get_equipment ou add_equipment). Renvoie les alertes du moteur de règles pour cette liaison.",
    parameters: {
      type: 'object',
      properties: { from_equipment_id: str, from_port_id: str, to_equipment_id: str, to_port_id: str },
      required: ['from_equipment_id', 'from_port_id', 'to_equipment_id', 'to_port_id'],
    },
  },
  {
    name: 'propose_video_studio',
    description: 'Construit un plateau TV standard : N caméras SDI identiques vers N entrées distinctes du mélangeur vidéo, et mix audio stéréo XLR de la console vers le mélangeur. Le logiciel choisit et valide les vrais ports ; aucun identifiant de prise à deviner. Utiliser les template_id chargés depuis le catalogue. Refuse une connectique ou capacité insuffisante. Ne crée aucun retour vidéo vers la console audio.',
    parameters: { type: 'object', properties: { camera_template_id: str, camera_count: { type: 'integer', minimum: 1, maximum: 48 }, video_switcher_template_id: str, audio_console_template_id: str },
      required: ['camera_template_id', 'camera_count', 'video_switcher_template_id', 'audio_console_template_id'] },
  },
  {
    name: 'propose_diagram',
    description: "Prépare un synoptique complet en UN appel : tous les équipements ET toutes les liaisons. Utiliser après search_library/get_template. Pour plusieurs exemplaires identiques, utiliser count : ref=cam, count=5 crée cam1 à cam5. Sans count, la ref est conservée. Dans les liaisons, from/to désignent ces refs ou des equipment_id existants ; les port_id doivent provenir des fiches. Tout est refusé si un seul élément est invalide. Placement automatique selon le flux ; aucune modification de l'existant.",
    parameters: {
      type: 'object',
      properties: {
        equipment: { type: 'array', maxItems: 50, items: { type: 'object', properties: { ref: str, template_id: str, name: str, count: { type: 'integer', minimum: 1, maximum: 50, description: 'Nombre d’exemplaires identiques. Par défaut 1.' } }, required: ['ref', 'template_id'] } },
        connections: { type: 'array', maxItems: 100, items: { type: 'object', properties: { from: str, from_port: str, to: str, to_port: str }, required: ['from', 'from_port', 'to', 'to_port'] } },
      },
      required: ['equipment', 'connections'],
    },
  },
  {
    name: 'check_project',
    description: 'Lance le moteur de règles sur tout le schéma (propositions comprises) et renvoie les alertes : signal, niveau, connecteur, fantôme, occupation des ports.',
    parameters: { type: 'object', properties: {} },
  },
]

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

function portSummary(p: PortDef) {
  return {
    id: p.id,
    name: p.name,
    direction: p.direction,
    signal: p.signal,
    connector: p.connector,
    ...(p.level ? { level: p.level } : {}),
    ...(p.channels ? { channels: p.channels } : {}),
    ...(p.format ? { format: p.format } : {}),
    ...(p.phantom ? { phantom: p.phantom } : {}),
  }
}

export function searchLibrary(library: EquipmentTemplate[], query: string, limit = 12) {
  const tokens = norm(query).split(/[^a-z0-9]+/).filter(Boolean)
  return library
    .map((t) => {
      const hay = norm(`${t.manufacturer ?? ''} ${t.model} ${t.id} ${t.family} ${(t.aliases ?? []).join(' ')}`)
      return { t, score: tokens.filter((k) => hay.includes(k)).length }
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || Number(a.t.portStatus === 'pending') - Number(b.t.portStatus === 'pending')
      || Number(b.t.status === 'verified') - Number(a.t.status === 'verified') || a.t.model.localeCompare(b.t.model))
    .slice(0, limit)
    .map(({ t }) => ({
      template_id: t.id,
      manufacturer: t.manufacturer,
      model: t.model,
      family: t.family,
      status: t.status,
      ...(t.portStatus ? { portStatus: t.portStatus } : {}),
      inputs: t.ports.filter((p) => p.direction !== 'out').length,
      outputs: t.ports.filter((p) => p.direction !== 'in').length,
    }))
}

/** Position provisoire sans chevauchement, avant le rangement selon les liaisons. */
function nextPosition(d: Draft): { x: number; y: number } {
  const onSheet = Object.values(d.base.equipment).filter((e) => (e.sheetId ?? DEFAULT_SHEET_ID) === d.sheetId)
  const x = Math.max(40, ...onSheet.map(e => e.position.x + diagramBlockSize(d.base, e).w + 120))
  const y = d.addedEquipment.reduce((bottom, id) => Math.max(bottom, d.project.equipment[id].position.y + diagramBlockSize(d.project, d.project.equipment[id]).h + 48), 40)
  return { x, y }
}

const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

/** Exécute un appel d'outil sur le brouillon. Renvoie le brouillon (modifié ou non) et le résultat en JSON. */
export function runTool(draft: Draft, call: ToolCall, ctx: ToolContext): { draft: Draft; content: string } {
  const out = (v: unknown, d: Draft = draft) => ({ draft: d, content: JSON.stringify(v) })
  const fail = (error: string) => out({ error })
  const p = draft.project
  const a = call.args
  const offset = typeof a.offset === 'number' && Number.isFinite(a.offset) ? Math.max(0, Math.floor(a.offset)) : 0
  const equipment = (id: string) => Object.hasOwn(p.equipment, id) ? p.equipment[id] : undefined
  const page = (ports: PortDef[]) => ({ ports_total: ports.length, offset, next_offset: ports.length > offset + 16 ? offset + 16 : null })

  switch (call.name) {
    case 'search_documentation': return out({ results: searchDocumentation(text(a.query)) })
    case 'search_library': {
      const results = searchLibrary(ctx.library, text(a.query))
      return out(results.length ? { results } : { results, note: 'Aucun modèle trouvé : essayer un autre mot-clé ou un bloc générique.' })
    }
    case 'get_template': {
      const t = ctx.library.find((x) => x.id === text(a.template_id))
      if (!t) return fail(`Modèle inconnu : ${text(a.template_id)}. Utiliser search_library.`)
      return out({
        template_id: t.id,
        manufacturer: t.manufacturer,
        model: t.model,
        family: t.family,
        status: t.status,
        portStatus: t.portStatus,
        description: t.description,
        powerW: t.powerW,
        weightKg: t.weightKg,
        rackU: t.rackU,
        sources_total: t.sources?.length ?? 0,
        sources: t.sources?.slice(0, 2),
        ...page(t.ports),
        ports: t.ports.slice(offset, offset + 16).map(portSummary),
      })
    }
    case 'get_project': {
      const equipment = Object.values(p.equipment), links = Object.values(p.links)
      return out({
        current_sheet: sheetName(p, draft.sheetId),
        equipment_total: equipment.length, links_total: links.length,
        offset, next_offset: Math.max(equipment.length, links.length) > offset + 25 ? offset + 25 : null,
        sheets: (p.sheets ?? []).map((s) => ({ id: s.id, name: s.name, parent: s.parentId })),
        equipment: equipment.slice(offset, offset + 25).map((e) => ({
          equipment_id: e.id,
          name: e.name,
          manufacturer: e.manufacturer,
          model: e.model,
          sheet: sheetName(p, e.sheetId),
          ports: e.ports.length,
        })),
        links: links.slice(offset, offset + 25).map((l) => ({
          label: l.label,
          from: `${p.equipment[l.source.equipmentId]?.name ?? '?'} / ${l.source.portId}`,
          to: `${p.equipment[l.target.equipmentId]?.name ?? '?'} / ${l.target.portId}`,
        })),
      })
    }
    case 'get_equipment': {
      const e = equipment(text(a.equipment_id))
      if (!e) return fail(`Équipement inconnu : ${text(a.equipment_id)}. Utiliser get_project.`)
      const links = Object.values(p.links)
      return out({
        equipment_id: e.id,
        name: e.name,
        manufacturer: e.manufacturer,
        model: e.model,
        template_id: e.templateId,
        ...page(e.ports),
        ports: e.ports.slice(offset, offset + 16).map((port) => ({
          ...portSummary(port),
          linked_to: links
            .filter((l) => (l.source.equipmentId === e.id && l.source.portId === port.id) || (l.target.equipmentId === e.id && l.target.portId === port.id))
            .map((l) => l.label),
        })),
      })
    }
    case 'add_equipment': {
      if (draft.addedEquipment.length >= 50) return fail('Limite de 50 équipements par proposition : appliquer ou découper la demande.')
      const t = ctx.library.find((x) => x.id === text(a.template_id))
      if (!t) return fail(`Modèle inconnu : ${text(a.template_id)}. Utiliser search_library.`)
      const res = addEquipment(p, t, nextPosition(draft), { sheetId: draft.sheetId, ...(text(a.name) ? { name: text(a.name).slice(0, 120) } : {}) })
      res.project.equipment[res.id].portsExpanded = false
      if (ctx.allowed && !ctx.allowed(draft.base, res.project)) return fail('Ajout refusé par les droits du projet ou du calque.')
      const next = { ...draft, project: res.project, addedEquipment: [...draft.addedEquipment, res.id] }
      const e = res.project.equipment[res.id]
      return out({ equipment_id: res.id, name: e.name, ports_total: e.ports.length, next_offset: e.ports.length > 16 ? 16 : null, ports: e.ports.slice(0, 16).map(portSummary) }, next)
    }
    case 'connect_ports': {
      if (draft.addedLinks.length >= 100) return fail('Limite de 100 liaisons par proposition : appliquer ou découper la demande.')
      const from = { equipmentId: text(a.from_equipment_id), portId: text(a.from_port_id) }
      const to = { equipmentId: text(a.to_equipment_id), portId: text(a.to_port_id) }
      for (const r of [from, to]) {
        const e = equipment(r.equipmentId)
        if (!e) return fail(`Équipement inconnu : ${r.equipmentId}.`)
        if (!e.ports.some((x) => x.id === r.portId)) return fail(`Port inconnu sur ${e.name} : ${r.portId}. Utiliser get_equipment.`)
      }
      const res = connect(p, from, to)
      if (!res.id) return fail('Liaison refusée : elle existe déjà, ou les deux extrémités sont identiques.')
      const link = res.project.links[res.id]
      if (ctx.allowed && !ctx.allowed(draft.base, res.project)) return fail('Liaison refusée par les droits du projet ou du calque.')
      const unmuted = { ...res.project, settings: { ...res.project.settings, mutedRules: [] } }
      if (checkLink(unmuted, link).some((i) => i.severity === 'error')) return fail('Liaison incompatible : ' + checkLink(unmuted, link).map(ctx.describe).join(' ; '))
      const issues = checkLink(res.project, link).map((i) => ({ severity: i.severity, code: i.code, message: ctx.describe(i) }))
      const next = { ...draft, project: res.project, addedLinks: [...draft.addedLinks, res.id] }
      return out({ link_id: res.id, label: link.label, issues }, next)
    }
    case 'propose_video_studio': {
      const find = (id: unknown) => ctx.library.find(t => t.id === text(id))
      const camera = find(a.camera_template_id), video = find(a.video_switcher_template_id), audio = find(a.audio_console_template_id)
      if (!camera || !video || !audio) return fail('Référence inconnue : utiliser les template_id du catalogue ou search_library.')
      const plan = videoStudioPlan(camera, a.camera_count as number, video, audio)
      if ('error' in plan) return fail(plan.error!)
      const result = runTool(draft, { ...call, name: 'propose_diagram', args: plan }, ctx)
      return { ...result, content: JSON.stringify({ ...JSON.parse(result.content), routing_note: 'Configurer les deux sorties de la console pour le programme gauche/droite et les entrées du mélangeur en niveau ligne. Vérifier le format vidéo commun sur les appareils ; ces réglages internes ne sont pas effectués par le schéma.' }) }
    }
    case 'propose_diagram': {
      if (!Array.isArray(a.equipment) || !Array.isArray(a.connections) || a.equipment.length + draft.addedEquipment.length > 50 || a.connections.length + draft.addedLinks.length > 100) return fail('equipment et connections doivent être des listes, au maximum 50 équipements et 100 liaisons par proposition.')
      let next = draft
      const refs = new Map<string, string>()
      const execute = (name: string, args: Record<string, unknown>) => {
        const result = runTool(next, { id: call.id, name, args }, ctx)
        const value = JSON.parse(result.content)
        if (!value.error) next = result.draft
        return value
      }
      for (const entry of a.equipment) {
        if (!entry || typeof entry !== 'object' || !/^[a-zA-Z0-9_-]{1,40}$/.test(text(entry.ref))) return fail('Chaque équipement exige une ref courte unique (ex. cam1).')
        const count = entry.count ?? 1
        if (!Number.isInteger(count) || count < 1 || count > 50) return fail('count doit être un entier de 1 à 50.')
        for (let i = 0; i < count; i++) {
          const ref = text(entry.ref) + (count > 1 ? i + 1 : '')
          if (refs.has(ref)) return fail(`Référence en double : ${ref}. Aucun élément de cet appel ajouté.`)
          const name = text(entry.name) && text(entry.name) + (count > 1 ? ` ${i + 1}` : '')
          const result = execute('add_equipment', { template_id: entry.template_id, name })
          if (result.error) return fail(`${ref} : ${result.error}. Aucun élément de cet appel ajouté.`)
          refs.set(ref, result.equipment_id)
        }
      }
      for (const entry of a.connections) {
        if (!entry || typeof entry !== 'object') return fail('Liaison invalide. Aucun élément de cet appel ajouté.')
        const result = execute('connect_ports', { from_equipment_id: refs.get(text(entry.from)) ?? text(entry.from), from_port_id: entry.from_port,
          to_equipment_id: refs.get(text(entry.to)) ?? text(entry.to), to_port_id: entry.to_port })
        if (result.error) return fail(`${text(entry.from)} → ${text(entry.to)} : ${result.error}. Aucun élément de cet appel ajouté. Les refs de cet appel n’existent donc pas dans le projet. Lire get_template avec les template_id, puis refaire tout propose_diagram avec les bons ports.`)
      }
      next = { ...next, project: layoutDiagram(next.project, next.addedEquipment, next.sheetId) }
      if (ctx.allowed && !ctx.allowed(draft.base, next.project)) return fail('Proposition refusée par les droits du projet ou du calque.')
      return out({ equipment: [...refs].map(([ref, equipment_id]) => ({ ref, equipment_id })), equipment_added: refs.size,
        links_added: a.connections.length, note: 'Proposition complète préparée, à valider par l’utilisateur. Lancer check_project.' }, next)
    }
    case 'check_project': {
      const issues = checkProject(p)
      return out({
        count: issues.length,
        issues: issues.slice(0, 40).map((i) => ({ severity: i.severity, code: i.code, link: p.links[i.linkId]?.label, message: ctx.describe(i) })),
      })
    }
    default:
      return fail(`Outil inconnu : ${call.name}`)
  }
}
