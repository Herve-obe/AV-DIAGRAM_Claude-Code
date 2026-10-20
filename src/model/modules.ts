import { uid, updateEquipment } from './project'
import type { Equipment, EquipmentTemplate, Project } from './types'
import { validateTemplate } from './validateTemplate'
import { templatePort } from './deployment'

export type ModuleError = 'noSlot' | 'occupied' | 'incompatible' | 'invalidTemplate' | 'connected' | 'denied'

export function installModule(project: Project, equipmentId: string, slotId: string, template: EquipmentTemplate): { project: Project; error: ModuleError | null } {
  const eq = project.equipment[equipmentId]
  const slot = eq?.slots?.find(s => s.id === slotId)
  if (!slot) return { project, error: 'noSlot' }
  if (eq.modules?.some(m => m.slotId === slotId)) return { project, error: 'occupied' }
  if (template.family !== 'module' || !template.moduleType || validateTemplate(template).length) return { project, error: 'invalidTemplate' }
  if (slot.type !== template.moduleType) return { project, error: 'incompatible' }
  const id = uid('mod')
  const ports = template.ports.map((p, i) => ({ ...templatePort(p), id: `${id}_${i}`, name: `${slot.name} · ${p.name}` }))
  const module = { id, slotId, templateId: template.id, type: template.moduleType, model: template.model, manufacturer: template.manufacturer, powerW: template.powerW, weightKg: template.weightKg, portIds: ports.map(p => p.id) }
  return { project: updateEquipment(project, eq.id, { ports: [...eq.ports, ...ports], modules: [...(eq.modules ?? []), module] }), error: null }
}

export function moduleLinks(project: Project, equipmentId: string, moduleId: string): string[] {
  const ids = new Set(project.equipment[equipmentId]?.modules?.find(m => m.id === moduleId)?.portIds)
  return Object.values(project.links).filter(l => [l.source, l.target].some(end => end.equipmentId === equipmentId && ids.has(end.portId))).map(l => l.id)
}

/** Sans confirmation, retirer une carte câblée ne modifie rien. */
export function removeModule(project: Project, equipmentId: string, moduleId: string, disconnect = false): { project: Project; error: ModuleError | null } {
  const eq = project.equipment[equipmentId]
  const module = eq?.modules?.find(m => m.id === moduleId)
  if (!module) return { project, error: 'noSlot' }
  const links = moduleLinks(project, equipmentId, moduleId)
  if (links.length && !disconnect) return { project, error: 'connected' }
  const next = updateEquipment(project, equipmentId, { ports: eq.ports.filter(p => !module.portIds.includes(p.id)), modules: eq.modules!.filter(m => m.id !== moduleId) })
  return { project: { ...next, links: Object.fromEntries(Object.entries(next.links).filter(([id]) => !links.includes(id))) }, error: null }
}

/** Les caractéristiques de l'hôte s'entendent hors cartes ; leurs valeurs s'ajoutent au bilan. */
export function componentsOf(eq: Equipment) { return [eq, ...(eq.modules ?? [])] }
