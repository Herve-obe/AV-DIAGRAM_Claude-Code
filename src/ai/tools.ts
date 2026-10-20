// Outils de l'assistant (cahier des charges, 12.3, couche 2) : l'IA n'agit sur le schéma qu'à travers
// ces fonctions, qui s'appuient sur la bibliothèque et le moteur de règles. Elle ne peut donc pas
// inventer un équipement ou une caractéristique. Les modifications sont faites sur un brouillon,
// montré en aperçu : l'utilisateur l'applique (une seule étape d'annulation) ou le refuse.
import { addEquipment, connect, DEFAULT_SHEET_ID, sheetName } from '../model/project'
import { checkLink, checkProject, type Issue } from '../model/rules'
import type { EquipmentTemplate, PortDef, Project } from '../model/types'
import type { ToolCall, ToolSpec } from './providers'
import { searchDocumentation } from './knowledge'

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
    .sort((a, b) => b.score - a.score || a.t.model.localeCompare(b.t.model))
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

/** Place les équipements proposés en colonnes, à droite de ce qui existe déjà sur la feuille. */
function nextPosition(d: Draft): { x: number; y: number } {
  const onSheet = Object.values(d.base.equipment).filter((e) => (e.sheetId ?? DEFAULT_SHEET_ID) === d.sheetId)
  const x0 = onSheet.length ? Math.max(...onSheet.map((e) => e.position.x)) + 320 : 0
  const y0 = onSheet.length ? Math.min(...onSheet.map((e) => e.position.y)) : 0
  const n = d.addedEquipment.length
  return { x: x0 + Math.floor(n / 5) * 320, y: y0 + (n % 5) * 180 }
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
        sources: t.sources,
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
      if (checkLink(res.project, link).some((i) => i.severity === 'error')) return fail('Liaison incompatible : ' + checkLink(res.project, link).map(ctx.describe).join(' ; '))
      const issues = checkLink(res.project, link).map((i) => ({ severity: i.severity, code: i.code, message: ctx.describe(i) }))
      const next = { ...draft, project: res.project, addedLinks: [...draft.addedLinks, res.id] }
      return out({ link_id: res.id, label: link.label, issues }, next)
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
