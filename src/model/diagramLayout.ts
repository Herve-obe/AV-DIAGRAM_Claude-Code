import { estimateBlock, portsToDisplay } from './portDisplay'
import { DEFAULT_SHEET_ID } from './project'
import type { Equipment, Project } from './types'

/** Marge pour les noms, le résumé des prises libres et les commandes de repli. */
export function diagramBlockSize(project: Project, eq: Equipment) {
  const used = new Set(Object.values(project.links).flatMap(l => [l.source, l.target])
    .filter(r => r.equipmentId === eq.id).map(r => r.portId))
  const ports = portsToDisplay(eq.ports, used, eq.portsExpanded)
  const size = estimateBlock({ ...eq, ports })
  const labelWidth = (direction: boolean) => Math.max(0, ...ports.filter(p => (p.direction === 'in') === direction).map(p => p.name.length * 8))
  return { w: Math.max(size.w, eq.name.length * 9 + 80, `${eq.manufacturer ?? ''} ${eq.model}`.length * 8 + 60,
    labelWidth(true) + labelWidth(false) + 60), h: size.h + 24 }
}

/** Range uniquement les ajouts : sources à gauche, destinations à droite, sans déplacer l'existant. */
export function layoutDiagram(project: Project, ids: string[], sheetId: string): Project {
  const added = new Set(ids.filter(id => project.equipment[id]))
  if (!added.size) return project
  const items = [...added].map(id => project.equipment[id])
  const edges = Object.values(project.links).filter(l => added.has(l.source.equipmentId) && added.has(l.target.equipmentId))
  const rank = new Map(items.map(e => [e.id, e.family === 'console' || e.family === 'processing' ? 1 : 0]))
  const pending = new Map(items.map(e => [e.id, edges.filter(l => l.target.equipmentId === e.id).length]))
  const queue = items.filter(e => !pending.get(e.id)).map(e => e.id)
  // Les boucles restent dans leur colonne initiale ; la file ne traite chaque bloc qu'une fois.
  for (let i = 0; i < queue.length; i++) for (const link of edges.filter(l => l.source.equipmentId === queue[i])) {
    const target = link.target.equipmentId
    rank.set(target, Math.max(rank.get(target)!, rank.get(queue[i])! + 1))
    pending.set(target, pending.get(target)! - 1)
    if (!pending.get(target)) queue.push(target)
  }
  const columns = [...new Set(rank.values())].sort((a, b) => a - b).map(r => items.filter(e => rank.get(e.id) === r))
  const sizes = new Map(items.map(e => [e.id, diagramBlockSize(project, e)]))
  const heights = columns.map(col => col.reduce((h, e) => h + sizes.get(e.id)!.h + 48, -48))
  const height = Math.max(...heights)
  const existing = Object.values(project.equipment).filter(e => !added.has(e.id) && (e.sheetId ?? DEFAULT_SHEET_ID) === sheetId)
  let x = Math.max(40, ...existing.map(e => e.position.x + diagramBlockSize(project, e).w + 120))
  const equipment = { ...project.equipment }
  columns.forEach((col, i) => {
    let y = 40 + Math.round((height - heights[i]) / 2)
    for (const e of col) {
      equipment[e.id] = { ...e, position: { x, y } }
      y += sizes.get(e.id)!.h + 48
    }
    x += Math.max(...col.map(e => sizes.get(e.id)!.w)) + 120
  })
  return { ...project, equipment }
}
