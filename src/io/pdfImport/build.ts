// Construction des équipements et liaisons à partir d'un synoptique PDF interprété, selon les choix
// faits dans la fenêtre d'import (éléments retenus, noms, familles, fiches, signaux). Tout arrive sur
// une nouvelle feuille : le schéma existant n'est pas modifié, Annuler revient à l'état d'avant.
import * as ops from '../../model/project'
import type { SignalFamily } from '../../model/signals'
import type { EquipmentFamily, EquipmentTemplate, PortDef, Project } from '../../model/types'
import { PICTOGRAM_OF, type ImportedEquipment, type ImportedPort, type PageInterpretation } from './interpret'

/** Encombrement approximatif d'un bloc sur le schéma (en-tête, rangée de ports), pour éviter les chevauchements */
const BLOCK_W = 240
const BLOCK_HEAD = 64
const PORT_ROW = 20
const GAP = 30

export interface EquipmentChoice {
  include: boolean
  name: string
  family: EquipmentFamily
  /** Partir de la fiche reconnue (ports du constructeur) plutôt que des seuls ports du dessin */
  useTemplate: boolean
}

export interface LinkChoice {
  include: boolean
  signal: SignalFamily
}

export interface ImportChoices {
  equipment: Record<string, EquipmentChoice>
  links: Record<string, LinkChoice>
  sheetName: string
  /** Nom du fichier, rappelé dans les notes */
  source: string
}

/** Choix proposés par défaut : un cadre sans aucune liaison (cartouche, légende) est décoché. */
export function defaultChoices(r: PageInterpretation, source: string): ImportChoices {
  return {
    equipment: Object.fromEntries(r.equipment.map((e) => [e.key, {
      include: e.links > 0,
      name: e.name || e.model || e.key,
      family: e.family,
      useTemplate: !!e.match,
    }])),
    links: Object.fromEntries(r.links.map((l) => [l.key, { include: true, signal: l.signal }])),
    sheetName: source.replace(/\.pdf$/i, '').slice(0, 40) || 'Import PDF',
    source,
  }
}

/** Nom de port comparable : « IN 1 », « Input 1 » et « Entrée 1 » donnent « in1 » */
const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(inputs?|entrees?|in)\b/g, 'in')
    .replace(/\b(outputs?|sorties?|out)\b/g, 'out')
    .replace(/[^a-z0-9]/g, '')

/** Même port : abréviation d'au moins 6 caractères (« Dante pri » / « Dante Primary ») */
const samePort = (a: string, b: string) => {
  const x = norm(a)
  const y = norm(b)
  const [short, long] = x.length < y.length ? [x, y] : [y, x]
  return short.length >= 6 && long.startsWith(short) && !/\d$/.test(short)
}

const toPortDef = (p: ImportedPort, id: string): PortDef => ({ id, name: p.name, direction: p.direction, signal: p.signal, connector: p.connector })

/** Ports de l'équipement importé et correspondance port du dessin -> identifiant de port. */
function portsFor(e: ImportedEquipment, tpl: EquipmentTemplate | undefined): { ports: PortDef[]; map: Map<string, string> } {
  const map = new Map<string, string>()
  if (!tpl) {
    const ports = e.ports.map((p, i) => toPortDef(p, `p${i + 1}`))
    e.ports.forEach((p, i) => map.set(p.key, `p${i + 1}`))
    return { ports, map }
  }
  // Fiche : ports du constructeur ; ceux du dessin sont rattachés par leur nom, les autres ajoutés
  const ports = tpl.ports.map((p) => ({ ...p }))
  const free = new Set(ports.map((p) => p.id))
  let extra = 0
  for (const p of e.ports) {
    const hit = ports.find((t) => free.has(t.id) && norm(t.name) === norm(p.name)) ?? ports.find((t) => free.has(t.id) && samePort(t.name, p.name))
    if (hit) {
      map.set(p.key, hit.id)
      free.delete(hit.id)
    } else {
      const id = `pdf${++extra}`
      ports.push(toPortDef(p, id))
      map.set(p.key, id)
    }
  }
  return { ports, map }
}

export function buildImport(
  project: Project,
  r: PageInterpretation,
  choices: ImportChoices,
  library: Map<string, EquipmentTemplate>,
): { project: Project; sheetId: string; equipment: number; links: number } {
  let p = project
  const sheet = ops.addSheet(p, choices.sheetName)
  p = sheet.project

  // Signal choisi pour chaque liaison, reporté sur ses deux ports
  const portSignal = new Map<string, SignalFamily>()
  for (const l of r.links) {
    const c = choices.links[l.key]
    if (!c?.include) continue
    portSignal.set(`${l.from.eq}/${l.from.port}`, c.signal)
    portSignal.set(`${l.to.eq}/${l.to.port}`, c.signal)
  }

  // Échelle : un cadre moyen du document devient un bloc de taille habituelle
  const kept = r.equipment.filter((e) => choices.equipment[e.key]?.include)
  const widths = kept.map((e) => e.box.w).sort((a, b) => a - b)
  const median = widths[Math.floor(widths.length / 2)] ?? 150
  const scale = Math.min(4, Math.max(1, 220 / median))
  const minX = Math.min(...kept.map((e) => e.box.x))
  const minY = Math.min(...kept.map((e) => e.box.y))

  // Ports de chaque équipement, puis placement : position du document à l'échelle, en décalant vers
  // le bas un bloc qui chevaucherait un autre (une fiche peut avoir bien plus de ports que le dessin)
  const prepared = kept.map((e) => {
    const c = choices.equipment[e.key]
    const tpl = c.useTemplate && e.match ? library.get(e.match.templateId) : undefined
    const drawn = { ...e, ports: e.ports.map((pt) => ({ ...pt, signal: portSignal.get(`${e.key}/${pt.key}`) ?? pt.signal })) }
    const { ports, map } = portsFor(drawn, tpl)
    const ins = ports.filter((x) => x.direction === 'in').length
    const outs = ports.length - ins
    const pos = { x: Math.round((e.box.x - minX) * scale), y: Math.round((e.box.y - minY) * scale) }
    return { e, c, tpl, ports, map, pos, w: BLOCK_W, h: BLOCK_HEAD + Math.max(ins, outs) * PORT_ROW }
  })
  const placed: { x: number; y: number; w: number; h: number }[] = []
  for (const item of [...prepared].sort((a, b) => a.pos.y - b.pos.y || a.pos.x - b.pos.x)) {
    let moved = true
    while (moved) {
      moved = false
      for (const o of placed) {
        const overlap = item.pos.x < o.x + o.w + GAP && item.pos.x + item.w + GAP > o.x && item.pos.y < o.y + o.h + GAP && item.pos.y + item.h + GAP > o.y
        if (overlap) {
          item.pos.y = o.y + o.h + GAP
          moved = true
        }
      }
    }
    placed.push({ ...item.pos, w: item.w, h: item.h })
  }

  const ids = new Map<string, { id: string; map: Map<string, string> }>()
  for (const { e, c, tpl, ports, map, pos } of prepared) {
    const template: EquipmentTemplate = tpl
      ? { ...tpl, ports }
      : {
          id: 'import-pdf', family: c.family, model: e.model || e.name, pictogram: c.family === e.family ? e.pictogram : PICTOGRAM_OF[c.family],
          ports, status: 'user',
        }
    const added = ops.addEquipment(p, template, pos, {
      name: c.name.trim() || e.name, sheetId: sheet.id,
    })
    p = added.project
    const notes = [...e.notes, `Importé de ${choices.source}, page ${r.page}`].join('\n')
    p = ops.updateEquipment(p, added.id, { notes })
    ids.set(e.key, { id: added.id, map })
  }

  let links = 0
  for (const l of r.links) {
    if (!choices.links[l.key]?.include) continue
    const a = ids.get(l.from.eq)
    const b = ids.get(l.to.eq)
    const pa = a?.map.get(l.from.port)
    const pb = b?.map.get(l.to.port)
    if (!a || !b || !pa || !pb) continue
    const res = ops.connect(p, { equipmentId: a.id, portId: pa }, { equipmentId: b.id, portId: pb })
    if (!res.id) continue
    p = res.project
    const notes = [l.ref ? `Repère d'origine : ${l.ref}` : '', l.note ?? ''].filter(Boolean).join(' ; ')
    p = ops.updateLink(p, res.id, { ...(l.lengthM ? { lengthM: l.lengthM } : {}), ...(notes ? { notes } : {}) })
    links++
  }
  return { project: p, sheetId: sheet.id, equipment: kept.length, links }
}
