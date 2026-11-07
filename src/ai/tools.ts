// Outils de l'assistant (cahier des charges, 12.3, couche 2) : l'IA n'agit sur le schéma qu'à travers
// ces fonctions, qui s'appuient sur la bibliothèque et le moteur de règles. Elle ne peut donc pas
// inventer un équipement ou une caractéristique. Les modifications sont faites sur un brouillon,
// montré en aperçu : l'utilisateur l'applique (une seule étape d'annulation) ou le refuse.
import { addAnnotation, addEquipment, connect, DEFAULT_SHEET_ID, sheetName, updateEquipment, updateLink } from '../model/project'
import { cableFits, getCable } from '../model/cables'
import { checkLink, checkProject, type Issue } from '../model/rules'
import { exportSettingsOf } from '../io/exportOptions'
import { PAPER_SIZES } from '../model/types'
import type { EquipmentTemplate, PortDef, Project } from '../model/types'
import type { ToolCall, ToolSpec } from './providers'
import { searchDocumentation } from './knowledge'
import { diagramBlockSize, layoutDiagram } from '../model/diagramLayout'
import { videoStudioPlan } from '../model/videoStudio'
import { audioProductionPlan, presentAudioProduction } from '../model/audioProduction'
import { proposalLayouts, type ProposalLayout } from '../model/proposalLayout'
import { connectSystem } from '../model/systemDiagram'
import { SIGNAL_FAMILIES } from '../model/signals'
import { companyAlerts } from '../model/company'
import fr from '../i18n/fr.json'
import en from '../i18n/en.json'

export interface Draft {
  /** Projet de départ : l'aperçu ne s'applique que s'il n'a pas changé entre-temps */
  base: Project
  project: Project
  sheetId: string
  addedEquipment: string[]
  addedLinks: string[]
  rearrangedEquipment?: string[]
  /** Un plan complet reste indivisible jusqu'à son application ou son refus. */
  audioProduction?: true
  /** Variantes locales de mise en page, sans nouvel appel au modèle. */
  layout?: { choices: ProposalLayout[]; selected: number }
  brief?: {
    request?: string
    goal: string
    roles: { ref: string; count: number; candidates: string[] }[]
    constraints: string[]
    assumptions: string[]
  }
}

export function createDraft(project: Project, sheetId: string): Draft {
  return { base: project, project, sheetId, addedEquipment: [], addedLinks: [] }
}

export const hasChanges = (d: Draft) => d.addedEquipment.length + d.addedLinks.length + (d.rearrangedEquipment?.length ?? 0) > 0

export function layoutDraft(draft: Draft): Draft {
  if (draft.layout || !draft.addedEquipment.length) return draft
  const choices = proposalLayouts(draft.base, draft.project, draft.addedEquipment, draft.sheetId)
  return { ...draft, project: choices[0].project, layout: { choices, selected: 0 } }
}

export interface ToolContext {
  library: EquipmentTemplate[]
  company?: EquipmentTemplate[]
  selectedEquipment?: string[]
  lang?: 'fr' | 'en'
  /** Texte lisible d'une alerte des règles (traduit) */
  describe: (issue: Issue) => string
  allowed?: (before: Project, after: Project) => boolean
}

const str = { type: 'string' }
const portOffset = { type: 'integer', description: 'Décalage pour lire les prises par pages de 16 ; utiliser next_offset.' }
const roleRef = { ...str, pattern: '^[a-zA-Z0-9_-]{1,40}$', description: 'Identifiant court sans espace ni accent, ex. mic, desk, speaker.' }
const equipmentList = { type: 'array', maxItems: 50, items: { type: 'object', properties: { ref: roleRef, template_id: str, name: str, count: { type: 'integer', minimum: 1, maximum: 50 }, port_modes: { type: 'array', maxItems: 64, items: { type: 'object', properties: { port_id: str, mode: { type: 'integer', minimum: 0 } }, required: ['port_id', 'mode'] } } }, required: ['ref', 'template_id'] } }
const phrases = { type: 'array', maxItems: 30, items: { ...str, maxLength: 500 } }

export const TOOL_SPECS: ToolSpec[] = [
  {
    name: 'rearrange_diagram',
    description: 'Réorganise la feuille existante ou la sélection sans ajouter ni supprimer de matériel ou de connexion. Placement lisible calculé par le logiciel, prises inutilisées repliées et tracés recalculés. target=single_page propose un format plus grand si nécessaire ; target=readable conserve le format courant sur plusieurs pages. paper impose un format parmi A4, A3, A2, A1, A0. L’utilisateur applique ou refuse l’aperçu.',
    parameters: { type: 'object', properties: { scope: { ...str, enum: ['current_sheet', 'selection'] }, target: { ...str, enum: ['single_page', 'readable'] }, paper: { ...str, enum: PAPER_SIZES } }, required: ['scope', 'target'] },
  },
  {
    name: 'plan_diagram',
    description: 'Analyse un cahier des charges quelconque, même vague, avant de construire : but, rôles matériels, quantités, contraintes et hypothèses. Le logiciel recherche toutes les fiches en un appel. Ne pas inventer de template_id. Si une précision conditionne le résultat, poser au maximum 3 questions groupées dans questions ; ne pas créer de schéma partiel. Pour un choix libre, proposer une hypothèse explicite. required_model=true seulement si un modèle exact est imposé. Les rôles décrivent uniquement les ajouts ; réutiliser les equipment_id du projet pour les appareils déjà présents.',
    parameters: { type: 'object', properties: {
      goal: { ...str, maxLength: 500 },
      roles: { type: 'array', maxItems: 20, items: { type: 'object', properties: { ref: roleRef, query: { ...str, maxLength: 120, description: 'Type d’appareil à rechercher (ex. micro dynamique), ou référence précise. Pas le nom de la prestation ni le nombre de participants.' }, family: { ...str, description: 'Famille si connue : capture, console, speaker, camera, videoSwitcher, recording, luminaire, lightingControl, network, intercom, sync… Même si absente du catalogue autorisé, pour signaler le besoin manquant.' }, count: { type: 'integer', minimum: 1, maximum: 50 }, required_model: { type: 'boolean' } }, required: ['ref', 'query', 'count', 'required_model'] } },
      constraints: phrases, assumptions: phrases,
      questions: { ...phrases, maxItems: 3 },
    }, required: ['goal', 'roles', 'constraints', 'assumptions', 'questions'] },
  },
  {
    name: 'ask_user',
    description: 'Termine ce tour en demandant une précision indispensable : modèle ambigu, quantité ou connectique manquante. Poser une question concrète ; aucune modification de ce tour ne sera conservée. Ne pas annoncer une action future à la place d’une proposition.',
    parameters: { type: 'object', properties: { question: { ...str, maxLength: 2000 } }, required: ['question'] },
  },
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
      properties: { from_equipment_id: str, from_port_id: str, to_equipment_id: str, to_port_id: str, cable_type_id: str },
      required: ['from_equipment_id', 'from_port_id', 'to_equipment_id', 'to_port_id'],
    },
  },
  {
    name: 'propose_video_studio',
    description: 'Construit un plateau vidéo : N caméras SDI identiques vers N entrées distinctes du mélangeur vidéo. Ajouter audio_console_template_id seulement si une console audio est demandée, pour relier son programme stéréo XLR au mélangeur. Le logiciel choisit et valide les vrais ports ; aucun identifiant de prise à deviner. Ne traite pas les microphones/HF : utiliser propose_diagram pour ces demandes supplémentaires. Refuse une connectique ou capacité insuffisante.',
    parameters: { type: 'object', properties: { camera_template_id: str, camera_count: { type: 'integer', minimum: 1, maximum: 48 }, video_switcher_template_id: str, audio_console_template_id: str },
      required: ['camera_template_id', 'camera_count', 'video_switcher_template_id'] },
  },
  {
    name: 'propose_audio_production',
    description: 'Construit et câble un plateau interview avec duo live dans un autre studio : M7CL-48ES principale et 01V96 live. Micros interview, chant statique, guitare/ampli repris au micro, machines via DI, médias PC, deux casques stéréo indépendants via HA8000, enceintes interview sans micros, retour présentatrice/médias sans rebouclage, vidéo et enregistrement stéréo. Conserve le patch et les mixages dans les notes des trois zones. Les références libres ont des choix par défaut documentés ; blocs fonctionnels génériques signalés. Hypothèses par défaut explicites : 3 micros interview, 2 sorties machines, 1 SB168-ES, deux casques stéréo. Ne convient pas à une autre architecture ou à des sources supplémentaires non représentées.',
    parameters: { type: 'object', properties: {
      main_console_template_id: { ...str, enum: ['yamaha-m7cl-48es'] }, live_console_template_id: { ...str, enum: ['yamaha-01v96'] },
      interview_mic_count: { type: 'integer', minimum: 1, maximum: 10 }, loop_channels: { type: 'integer', minimum: 1, maximum: 8 },
      stagebox_count: { type: 'integer', minimum: 0, maximum: 2 },
      interview_microphone_template_id: str, vocal_microphone_template_id: str, guitar_microphone_template_id: str,
      audio_interface_template_id: str, video_switcher_template_id: str, recorder_template_id: str, monitor_template_id: str,
    }, required: ['main_console_template_id', 'live_console_template_id'] },
  },
  {
    name: 'propose_system',
    description: 'Prépare un système de n’importe quelle famille à partir de rôles matériels et de leurs flux : audio, vidéo, lumière, réseau, intercom, synchronisation. Les template_id viennent du catalogue ou de plan_diagram. Dans connections, from/to désignent une ref de rôle (tous ses exemplaires), une ref individuelle comme cam1, ou un equipment_id existant. N→1 et 1→N sont développés ; N→N apparie les numéros. links_per_pair est un nombre de câbles physiques, 2 uniquement entre deux appareils disposant chacun de deux prises pour ce flux. Une paire d’enceintes mono est count=2 avec links_per_pair=1 : chaque enceinte reçoit un câble. Ce n’est pas un nombre de canaux Dante/SDI. Le logiciel choisit des prises libres documentées et compatibles. Préciser purpose pour les affectations de mixage ou de routage à réaliser sur les appareils. Aucune conversion de signal ni capacité non documentée n’est inventée. Lire get_template pour imposer un mode de prise documenté. Tout est refusé si un raccordement est impossible.',
    parameters: { type: 'object', properties: {
      equipment: equipmentList,
      connections: { type: 'array', maxItems: 100, items: { type: 'object', properties: { from: str, to: str, signal: { ...str, enum: SIGNAL_FAMILIES }, links_per_pair: { type: 'integer', minimum: 1, maximum: 16, description: 'OPTIONNEL, défaut 1 câble par paire d’appareils. Omettre pour relier chaque micro à une console, chaque caméra à un mélangeur ou une console à chaque enceinte mono. count=3 micros et count=2 enceintes restent chacun raccordés par 1 câble. Mettre 2 seulement pour une liaison stéréo analogique entre DEUX appareils disposant chacun de deux prises mono.' }, purpose: { ...str, maxLength: 1000 } }, required: ['from', 'to', 'signal'] } },
    }, required: ['equipment', 'connections'] },
  },
  {
    name: 'propose_diagram',
    description: "Prépare un synoptique complet en UN appel : tous les équipements ET toutes les liaisons. Utiliser après search_library/get_template. Pour plusieurs exemplaires identiques, utiliser count : ref=cam, count=5 crée cam1 à cam5. Sans count, la ref est conservée. Dans les liaisons, from/to désignent ces refs ou des equipment_id existants ; les port_id doivent provenir des fiches. Tout est refusé si un seul élément est invalide. Placement automatique selon le flux ; aucune modification de l'existant.",
    parameters: {
      type: 'object',
      properties: {
        equipment: equipmentList,
        connections: { type: 'array', maxItems: 100, items: { type: 'object', properties: { from: str, from_port: str, to: str, to_port: str, cable_type_id: str }, required: ['from', 'from_port', 'to', 'to_port'] } },
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
    ...(p.modes ? { modes: p.modes } : {}),
    ...(p.channels ? { channels: p.channels } : {}),
    ...(p.format ? { format: p.format } : {}),
    ...(p.phantom ? { phantom: p.phantom } : {}),
  }
}

/** Le connecteur ne détermine jamais le niveau ; le résumé couvre aussi les pages de prises suivantes. */
function audioLevels(ports: PortDef[]) {
  const labels = { mic: 'micro', instrument: 'instrument', phono: 'phono', 'line+4': 'ligne +4 dBu',
    'line-10': 'ligne -10 dBV', speaker: 'haut-parleur (puissance)', none: 'sans niveau nominal', unspecified: 'non documenté' }
  const groups = new Map<string, { direction: PortDef['direction']; connector: string; level: string; nominal_level: string; ports: number }>()
  for (const p of ports.filter(p => p.signal === 'audioAnalog')) {
    const level = p.level ?? 'unspecified', key = [p.direction, p.connector, level].join('/')
    const group = groups.get(key)
    if (group) group.ports++
    else groups.set(key, { direction: p.direction, connector: p.connector, level, nominal_level: labels[level], ports: 1 })
  }
  return [...groups.values()]
}

const referenceWords = (s: string) => norm(s).replace(/([a-z])(\d)/g, '$1 $2').replace(/(\d)([a-z])/g, '$1 $2').replace(/[^a-z0-9]+/g, ' ').trim()

/** Référence entière prioritaire ; un identifiant court (XR18 dans « X AIR XR18 ») reste recherchable. */
export function referenceScore(t: EquipmentTemplate, query: string): number {
  const hay = ' ' + referenceWords(query) + ' '
  const matches = (s: string) => {
    const words = referenceWords(s)
    // Une désignation comme « CES » ne doit pas transformer le démonstratif français en référence imposée.
    return !['ces', 'des', 'les', 'une', 'sur', 'aux', 'the', 'and', 'for', 'with'].includes(words)
      && words.replace(/ /g, '').length >= 3 && hay.includes(' ' + words + ' ')
  }
  const full = [t.model, ...(t.aliases ?? [])].filter(matches)
  if (full.length) return t.status === 'generic' ? 25 : 100
  const refs = norm(t.model).match(/\b(?:[a-z]+\d|\d+[a-z]+\d)[a-z0-9]*(?:-[a-z0-9]+)*/g) ?? []
  return refs.some(matches) ? 50 : 0
}

export function searchLibrary(library: EquipmentTemplate[], query: string, limit = 12) {
  const tokens = norm(query).split(/[^a-z0-9]+/).filter(Boolean)
  return library
    .map((t) => {
      const hay = norm(`${t.manufacturer ?? ''} ${t.model} ${t.id} ${t.family} ${(t.aliases ?? []).join(' ')} ${t.description ?? ''}`)
      return { t, score: referenceScore(t, query) + tokens.filter((k) => hay.includes(k)).length }
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
  const out = (v: unknown, d: Draft = draft) => ({ draft: d.project === draft.project ? d : { ...d, layout: undefined }, content: JSON.stringify(v) })
  const fail = (error: string) => out({ error })
  if (draft.audioProduction && (call.name.startsWith('propose_') || ['add_equipment', 'connect_ports'].includes(call.name))) {
    return fail((ctx.lang === 'en' ? en : fr).audioProduction.pending)
  }
  const p = draft.project
  const a = call.args
  const offset = typeof a.offset === 'number' && Number.isFinite(a.offset) ? Math.max(0, Math.floor(a.offset)) : 0
  const equipment = (id: string) => Object.hasOwn(p.equipment, id) ? p.equipment[id] : undefined
  const page = (ports: PortDef[]) => ({ ports_total: ports.length, offset, next_offset: ports.length > offset + 16 ? offset + 16 : null })

  switch (call.name) {
    case 'rearrange_diagram': {
      const labels = (ctx.lang === 'en' ? en : fr).ai.layout
      if (!['current_sheet', 'selection'].includes(text(a.scope)) || !['single_page', 'readable'].includes(text(a.target))
        || (a.paper !== undefined && !PAPER_SIZES.includes(a.paper as typeof PAPER_SIZES[number]))) return fail('Portée, objectif ou format de mise en page invalide.')
      const ids = Object.values(p.equipment).filter(e => (e.sheetId ?? DEFAULT_SHEET_ID) === draft.sheetId
        && (a.scope !== 'selection' || ctx.selectedEquipment?.includes(e.id))).map(e => e.id)
      if (!ids.length) return fail(labels.empty)
      if (p.sheets?.some(s => s.parentId === draft.sheetId)) return fail(labels.groups)
      const source = a.paper ? { ...p, settings: { ...p.settings, export: { ...exportSettingsOf(p), paper: a.paper as typeof PAPER_SIZES[number] } } } : p
      const choices = proposalLayouts(draft.base, source, ids, draft.sheetId, true)
        .filter(c => !ctx.allowed || ctx.allowed(draft.base, c.project))
      if (!choices.length) return fail(labels.permission)
      let selected = a.paper ? choices.findIndex(c => c.paper === a.paper) : a.target === 'single_page' ? choices.findIndex(c => c.valid && c.pages === 1) : 0
      if (selected < 0) selected = choices.findIndex(c => c.valid)
      if (selected < 0) selected = 0
      const choice = choices[selected]
      const message = labels.ready.replace('{{equipment}}', String(ids.length)).replace('{{pages}}', String(choice.pages)).replace('{{paper}}', choice.paper)
        + (!choice.valid ? '\n' + labels.tooSmall : '')
      return { draft: { ...draft, project: choice.project, rearrangedEquipment: ids, layout: { choices, selected } },
        content: JSON.stringify({ equipment_rearranged: ids.length, pages: choice.pages, paper: choice.paper, message }) }
    }
    case 'plan_diagram': {
      const labels = (ctx.lang === 'en' ? en : fr).ai.brief
      const list = (value: unknown, max: number): value is string[] => Array.isArray(value) && value.length <= max && value.every(s => typeof s === 'string' && s.length > 0 && s.length <= 500)
      if (!text(a.goal) || text(a.goal).length > 500 || !Array.isArray(a.roles) || a.roles.length > 20
        || !list(a.constraints, 30) || !list(a.assumptions, 30) || !list(a.questions, 3)) return fail('Plan invalide : goal, roles (20 maximum), constraints, assumptions et questions (3 maximum) sont requis.')
      const roles: NonNullable<Draft['brief']>['roles'] = [], questions = [...a.questions]
      if (questions.length) return out({ questions })
      for (const role of a.roles) {
        const ref = norm(text(role?.ref)).replace(/[^a-z0-9_-]+/g, '-').replace(/^-|-$/g, '')
        if (!role || typeof role !== 'object' || !/^[a-zA-Z0-9_-]{1,40}$/.test(ref) || roles.some(r => r.ref === ref)
          || !text(role.query) || text(role.query).length > 120 || !Number.isInteger(role.count) || role.count < 1 || role.count > 50
          || typeof role.required_model !== 'boolean' || (role.family !== undefined && (typeof role.family !== 'string' || role.family.length > 40))) return fail('Chaque rôle exige ref unique, query, count entier et required_model booléen ; family doit être une famille de matériel.')
        const library = ctx.library.filter(t => !role.family || t.family === role.family)
        const found = searchLibrary(library, role.required_model ? role.query : role.query + ' ' + text(role.ref), 12)
          .map(row => ctx.library.find(t => t.id === row.template_id)!)
          .filter(t => t.portStatus !== 'pending' && t.ports.length && (!role.required_model || referenceScore(t, role.query) > 0)).slice(0, 3)
        if (!found.length) questions.push(labels.missing.replace('{{query}}', role.query))
        roles.push({ ref, count: role.count, candidates: found.map(t => t.id) })
      }
      if (roles.reduce((n, r) => n + r.count, 0) + draft.addedEquipment.length > 50) return fail('Limite de 50 équipements : découper le système en sous-ensembles.')
      if (!roles.length && !questions.length && !Object.keys(p.equipment).length) return fail('Aucun rôle matériel. Poser les questions nécessaires pour définir le système.')
      if (questions.length) return out({ questions: questions.slice(0, 3) })
      const brief = { goal: text(a.goal), roles, constraints: a.constraints, assumptions: a.assumptions }
      return out({ goal: brief.goal, roles: roles.map(r => ({ ref: r.ref, count: r.count, candidates: r.candidates.slice(0, 2).map(id => {
        const t = ctx.library.find(t => t.id === id)!
        return { template_id: id, model: t.model, status: t.status, company_quantity: t.companyQuantity, company_model: ctx.company?.some(row => row.id === id) ?? false, signals: [...new Set(t.ports.map(p => p.signal))] }
      }) })), constraints: brief.constraints, assumptions: brief.assumptions,
      next: 'Utiliser propose_system avec les refs et quantités de ce plan. Les ports sont sélectionnés par le logiciel. Si la capacité ne suffit pas, rechercher une autre fiche ou demander une précision ; conserver toutes les contraintes.' }, { ...draft, brief })
    }
    case 'ask_user': {
      const question = text(a.question)
      return question && question.length <= 2000 ? out({ question }) : fail('Poser une question précise de 1 à 2000 caractères.')
    }
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
        audio_levels: audioLevels(t.ports),
        powerW: t.powerW,
        weightKg: t.weightKg,
        rackU: t.rackU,
        sources_total: t.sources?.length ?? 0,
        sources: t.sources?.slice(0, 2),
        company_quantity: t.companyQuantity,
        company_model: ctx.company?.some(row => row.id === t.id) ?? false,
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
        audio_levels: audioLevels(e.ports),
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
      return out({ equipment_id: res.id, name: e.name, audio_levels: audioLevels(e.ports), ports_total: e.ports.length, next_offset: e.ports.length > 16 ? 16 : null, ports: e.ports.slice(0, 16).map(portSummary) }, next)
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
      if (a.cable_type_id !== undefined) {
        const cable = getCable(text(a.cable_type_id))
        if (!cable || !cableFits(cable, equipment(from.equipmentId)!.ports.find(p => p.id === from.portId)!.connector,
          equipment(to.equipmentId)!.ports.find(p => p.id === to.portId)!.connector)) return fail('Câble inconnu ou incompatible avec les deux prises.')
        res.project = updateLink(res.project, res.id, { cableTypeId: cable.id })
      }
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
      if (!camera || !video || (a.audio_console_template_id !== undefined && !audio)) return fail('Référence inconnue : utiliser les template_id du catalogue ou search_library.')
      const plan = videoStudioPlan(camera, a.camera_count as number, video, audio)
      if ('error' in plan) return fail(plan.error!)
      const result = runTool(draft, { ...call, name: 'propose_diagram', args: plan }, ctx)
      return { ...result, content: JSON.stringify({ ...JSON.parse(result.content), routing_note: (audio ? 'Configurer les deux sorties de la console pour le programme gauche/droite et les entrées du mélangeur en niveau ligne. ' : '') + 'Vérifier le format vidéo commun sur les appareils ; ces réglages internes ne sont pas effectués par le schéma.' }) }
    }
    case 'propose_audio_production': {
      const labels = (ctx.lang === 'en' ? en : fr).audioProduction
      const plan = audioProductionPlan(ctx.library, a, labels)
      if ('error' in plan) return fail(plan.error)
      const result = runTool(draft, { ...call, name: 'propose_diagram', args: { equipment: plan.equipment, connections: plan.connections } }, ctx)
      const value = JSON.parse(result.content)
      if (value.error) return result
      const refs = new Map<string, string>(value.equipment.map((e: { ref: string; equipment_id: string }) => [e.ref, e.equipment_id]))
      const project = presentAudioProduction(result.draft.project, plan, refs, draft.sheetId, labels)
      if (ctx.allowed && !ctx.allowed(draft.base, project)) return fail('Proposition refusée par les droits du projet ou du calque.')
      return out({ ...value, assumptions: plan.assumptions, mixes: plan.mixes, routing_note: labels.manualSettings }, { ...result.draft, project, audioProduction: true })
    }
    case 'propose_system': {
      if (!Array.isArray(a.equipment)) return fail('equipment doit être une liste.')
      const initial = runTool(draft, { ...call, name: 'propose_diagram', args: { equipment: a.equipment, connections: [] } }, ctx)
      const value = JSON.parse(initial.content)
      if (value.error) return initial
      const ids = new Map<string, string>(value.equipment.map((e: { ref: string; equipment_id: string }) => [e.ref, e.equipment_id]))
      const roles = new Map<string, string[]>([...ids].map(([ref, id]) => [ref, [id]]))
      for (const row of a.equipment) if ((row.count ?? 1) > 1) roles.set(row.ref, Array.from({ length: row.count }, (_, i) => ids.get(row.ref + (i + 1))!))
      const result = connectSystem(initial.draft.project, roles, a.connections)
      if ('error' in result) return fail(result.error + ' Aucun élément de cet appel ajouté.')
      if (result.addedLinks.length + draft.addedLinks.length > 100) return fail('Limite de 100 liaisons par proposition.')
      const connected = new Set(Object.values(result.project.links).flatMap(l => [l.source.equipmentId, l.target.equipmentId]))
      const isolated = [...ids.values()].filter(id => !connected.has(id))
      if (ids.size > 1 && isolated.length) return fail('Équipements sans liaison : ' + isolated.map(id => result.project.equipment[id].name).join(', ') + '. Compléter les flux ou demander une précision ; aucun ajout conservé.')
      const labels = (ctx.lang === 'en' ? en : fr).ai.brief
      let project = result.project
      if (draft.brief) {
        const note = [...(draft.brief.request ? [labels.request, draft.brief.request] : []), draft.brief.goal, labels.constraints, ...draft.brief.constraints, labels.assumptions, ...draft.brief.assumptions, labels.routing].join('\n')
        const first = ids.values().next().value
        if (first) project = updateEquipment(project, first, { notes: [project.equipment[first].notes, note].filter(Boolean).join('\n') })
        const annotated = addAnnotation(project, { kind: 'note', sheetId: draft.sheetId, position: { x: 40, y: 40 }, size: { w: 900, h: 300 }, text: note }).project
        // Les annotations communes sont réservées à l'hôte ; l'invité garde le besoin sur son équipement.
        if (!ctx.allowed || ctx.allowed(draft.base, annotated)) project = annotated
      }
      if (ctx.allowed && !ctx.allowed(draft.base, project)) return fail('Proposition refusée par les droits du projet ou du calque.')
      return out({ ...value, links_added: result.addedLinks.length, assumptions: draft.brief?.assumptions ?? [], routing_note: labels.routing }, {
        ...initial.draft, project, addedLinks: [...draft.addedLinks, ...result.addedLinks],
      })
    }
    case 'propose_diagram': {
      if (!Array.isArray(a.equipment) || !Array.isArray(a.connections) || a.equipment.length + draft.addedEquipment.length > 50 || a.connections.length + draft.addedLinks.length > 100) return fail('equipment et connections doivent être des listes, au maximum 50 équipements et 100 liaisons par proposition.')
      if (draft.brief) for (const role of draft.brief.roles) {
        const entry = a.equipment.find((e: { ref?: string } | null) => e?.ref === role.ref)
        if (!entry || (entry.count ?? 1) !== role.count || !role.candidates.includes(entry.template_id)) return fail(`Rôle ${role.ref} : conserver les ${role.count} exemplaires et une référence proposée par plan_diagram. Aucun ajout conservé.`)
      }
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
          if (entry.port_modes !== undefined) {
            if (!Array.isArray(entry.port_modes) || entry.port_modes.length > 64) return fail('port_modes doit être une liste de modes documentés. Aucun élément de cet appel ajouté.')
            const eq = next.project.equipment[result.equipment_id]
            const modes = new Map<string, NonNullable<PortDef['modes']>[number]>()
            for (const selection of entry.port_modes) {
              if (!selection || typeof selection !== 'object' || !Number.isInteger(selection.mode) || selection.mode < 0) return fail('Mode de prise invalide. Aucun élément de cet appel ajouté.')
              const port = eq.ports.find(p => p.id === selection.port_id), mode = port?.modes?.[selection.mode]
              if (!mode || modes.has(selection.port_id)) return fail('Mode non documenté ou prise en double. Aucun élément de cet appel ajouté.')
              modes.set(selection.port_id, mode)
            }
            next = { ...next, project: updateEquipment(next.project, eq.id, { ports: eq.ports.map(p => modes.has(p.id) ? { ...p, ...modes.get(p.id)! } : p) }) }
          }
        }
      }
      for (const entry of a.connections) {
        if (!entry || typeof entry !== 'object') return fail('Liaison invalide. Aucun élément de cet appel ajouté.')
        const result = execute('connect_ports', { from_equipment_id: refs.get(text(entry.from)) ?? text(entry.from), from_port_id: entry.from_port,
          to_equipment_id: refs.get(text(entry.to)) ?? text(entry.to), to_port_id: entry.to_port, cable_type_id: entry.cable_type_id })
        if (result.error) return fail(`${text(entry.from)} → ${text(entry.to)} : ${result.error}. Aucun élément de cet appel ajouté. Les refs de cet appel n’existent donc pas dans le projet. Lire get_template avec les template_id, puis refaire tout propose_diagram avec les bons ports.`)
      }
      next = { ...next, project: layoutDiagram(next.project, [...refs.values()], next.sheetId) }
      if (ctx.allowed && !ctx.allowed(draft.base, next.project)) return fail('Proposition refusée par les droits du projet ou du calque.')
      return out({ equipment: [...refs].map(([ref, equipment_id]) => ({ ref, equipment_id })), equipment_added: refs.size,
        links_added: a.connections.length, note: 'Proposition complète préparée, à valider par l’utilisateur. Lancer check_project.' }, next)
    }
    case 'check_project': {
      const issues = checkProject(p)
      return out({
        count: issues.length,
        company_alerts: companyAlerts(p, ctx.company ?? []),
        issues: issues.slice(0, 40).map((i) => ({ severity: i.severity, code: i.code, link: p.links[i.linkId]?.label, message: ctx.describe(i) })),
      })
    }
    default:
      return fail(`Outil inconnu : ${call.name}`)
  }
}
