import { describe, expect, it } from 'vitest'
import { GENERIC_LIBRARY } from '../library/generic'
import * as ops from './project'
import { catalogueColumns, catalogueCsv, catalogueEntries, catalogueTemplate } from './catalogueImport'
import { companyAlerts } from './company'
import { validateTemplate } from './validateTemplate'

describe('parc entreprise partagé par les contrôles manuels et IA', () => {
  const company = { ...GENERIC_LIBRARY.find(t => t.id === 'gen-mic-dyn')!, id: 'user-mic', status: 'user' as const, companyQuantity: 1 }
  it('garde les doublons de modèles distincts et signale dépassement et disponibilité inconnue', () => {
    let project = ops.createProject('Parc')
    for (const t of [company, company, GENERIC_LIBRARY.find(t => t.id === 'gen-mic-dyn')!]) project = ops.addEquipment(project, t, { x: 0, y: 0 }).project
    expect(companyAlerts(project, [company]).map(a => [a.code, a.required, a.quantity])).toEqual([['shortage', 2, 1], ['outside', 1, undefined], ['unknown', 2, undefined]])
    expect(companyAlerts(project, [])).toEqual([])
    expect(companyAlerts(project, [{ ...company, companyQuantity: undefined }]).map(a => a.code)).toEqual(['outside', 'unknown'])
    expect(validateTemplate({ ...company, companyQuantity: -1 })).not.toEqual([])
    expect(validateTemplate({ ...company, companyQuantity: 1.5 })).not.toEqual([])
    expect(validateTemplate({ ...company, companyQuantity: 0 })).toEqual([])
    const host = Object.keys(project.equipment)[0]
    const withCard = ops.updateEquipment(project, host, { modules: [{ id: 'card', slotId: 'slot', templateId: 'external-card', type: 'test', model: 'Carte de test', portIds: [] }] })
    expect(companyAlerts(withCard, [company]).some(a => a.code === 'outside' && a.name === 'Carte de test')).toBe(true)
  })
  it('importe la quantité possédée sans recopier de tarif ni inventer une disponibilité', () => {
    const table = catalogueCsv('Modèle;Quantité;Tarif\nMicro dynamique;2;500')
    const result = catalogueEntries(table, catalogueColumns(table.rows[0]), [], 'capture')
    expect(result.problems).toEqual([])
    expect(catalogueTemplate(result.entries[0]).companyQuantity).toBe(2)
    for (const value of ['-1', '1.5', 'inconnu', '1000001']) {
      const invalid = catalogueCsv('Modèle;Quantité\nMicro;' + value)
      expect(catalogueEntries(invalid, catalogueColumns(invalid.rows[0]), [], 'capture').problems).toEqual([2])
    }
    const duplicate = catalogueCsv('Modèle;Quantité\nMicro;2\nMicro;3')
    expect(catalogueEntries(duplicate, catalogueColumns(duplicate.rows[0]), [], 'capture').problems).toEqual([3])
  })
})
