import type { EquipmentTemplate, Project } from './types'

export interface CompanyAlert {
  code: 'outside' | 'shortage' | 'unknown'
  name: string
  equipmentIds: string[]
  required: number
  quantity?: number
}

/** Même contrôle pour les ajouts manuels et les brouillons IA ; aucun stock n'est réservé. */
export function companyAlerts(project: Project, company: EquipmentTemplate[]): CompanyAlert[] {
  if (!company.length) return []
  const groups = new Map<string, { name: string; equipmentIds: string[] }>()
  for (const host of Object.values(project.equipment)) for (const eq of [host, ...(host.modules ?? [])]) {
    const group = groups.get(eq.templateId) ?? { name: [eq.manufacturer, eq.model].filter(Boolean).join(' '), equipmentIds: [] }
    group.equipmentIds.push(eq.id); groups.set(eq.templateId, group)
  }
  const alerts: CompanyAlert[] = [], owned: string[] = []
  for (const [id, group] of groups) {
    const template = company.find(t => t.id === id)
    const required = group.equipmentIds.length
    if (!template) alerts.push({ code: 'outside', ...group, required })
    else {
      owned.push(...group.equipmentIds)
      if (template.companyQuantity !== undefined && required > template.companyQuantity) alerts.push({ code: 'shortage', ...group, required, quantity: template.companyQuantity })
    }
  }
  if (owned.length) alerts.push({ code: 'unknown', name: '', equipmentIds: owned, required: owned.length })
  return alerts
}
