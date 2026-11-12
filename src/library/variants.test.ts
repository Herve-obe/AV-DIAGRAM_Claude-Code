import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { LIBRARY, LIBRARY_INDEX } from '.'
import { searchLibrary } from '../ai/tools'
import { addEquipment, createProject, isProject } from '../model/project'
import type { EquipmentTemplate } from '../model/types'

const feedback: {
  records: { sourceId: string; targetIds: string[] }[]
  excludedIds: string[]
  canonicalReused: string[]
} = JSON.parse(readFileSync(new URL('../../docs/inventaire/retours-audio04-lumiere02-2026-11-04.json', import.meta.url), 'utf8'))
const files = import.meta.glob<EquipmentTemplate>('./devices/*.json', { eager: true, import: 'default' })
const get = (id: string) => {
  const result = LIBRARY_INDEX.get(id)
  expect(result, id).toBeDefined()
  return result!
}

describe('variantes choisies dans les lots audio 04 et lumière 02', () => {
  // Fiches supprimées ensuite sur décision de l'utilisateur (ex. MKH 406 : le parc a des MKH 416 P48U)
  const deleted = new Set((JSON.parse(readFileSync(new URL('../../docs/inventaire/suppressions-audio-2026-11-06.json', import.meta.url), 'utf8')) as { deleted: { id: string }[] }).deleted.map(d => d.id))
  it('rend les variantes choisies accessibles sans conserver leurs doublons génériques', () => {
    expect(feedback.records).toHaveLength(17)
    for (const row of feedback.records) for (const id of row.targetIds) if (!deleted.has(id)) get(id)
    for (const id of feedback.excludedIds) expect(LIBRARY_INDEX.has(id), id).toBe(false)
    for (const id of feedback.canonicalReused) expect(get(id).status, id).toBe('verified')
    expect(searchLibrary(LIBRARY, 'e609')[0].template_id).toBe('sennheiser-e609-silver')
    expect(searchLibrary(LIBRARY, 'MD421')[0].template_id).toBe('sennheiser-md421-ii')
  })

  it('recharge les anciens appareils et leurs ports même lorsque leur fiche a été dédoublonnée', () => {
    for (const id of feedback.excludedIds) {
      const original = Object.values(files).find(t => t.id === id)!
      // Fichier supprimé ensuite à la demande de l'utilisateur : les projets gardent leur copie de l'appareil.
      if (deleted.has(id)) { expect(original, id).toBeUndefined(); continue }
      expect(original, id).toBeDefined()
      const added = addEquipment(createProject('Ancienne référence'), original, { x: 0, y: 0 })
      const loaded = JSON.parse(JSON.stringify(added.project))
      expect(isProject(loaded), id).toBe(true)
      expect(loaded.equipment[added.id].templateId).toBe(id)
      expect(loaded.equipment[added.id].ports).toEqual(original.ports)
    }
  })

  it('traite la ME 80 comme une tête de micro en option du module K 3, sans prise fantôme P48 supposée', () => {
    const capsule = get('sennheiser-me80')
    expect(capsule).toMatchObject({ family: 'module', moduleType: 'sennheiser-k3', portStatus: 'none' })
    expect(capsule.ports).toEqual([])
  })

  it('conserve les générations SX et SX2 séparées sans importer la connectique SX2 dans les anciens SX', () => {
    for (const ref of ['710', '713', '714']) {
      const sx = get(`robert-juliat-${ref}sx`)
      const sx2 = get(`robert-juliat-${ref}sx2`)
      expect(sx.id).not.toBe(sx2.id)
      // Ancienne génération documentée par la notice 700 SX (cordon secteur seul, sans DMX) :
      // aucune prise de la SX2 n'est recopiée.
      expect(sx.ports.every(p => p.signal === 'power')).toBe(true)
      expect(sx.ports).not.toEqual(sx2.ports)
    }
  })

  it('ne transforme pas les 2500 W de lampe Aramis en consommation système', () => {
    const aramis = get('robert-juliat-aramis')
    expect(aramis.model).toContain('2500')
    expect(aramis.powerW).toBeUndefined()
    expect(aramis.status).toBe('community')
  })

  it('distingue les deux Arcaline sans inventer des prises séparées sur leur connecteur combiné', () => {
    const small = get('ayrton-arcaline-2-50'), large = get('ayrton-arcaline-2-100')
    expect([small.powerW, large.powerW]).toEqual([50, 100])
    expect([small.weightKg, large.weightKg]).toEqual([4.7, 8.2])
    for (const t of [small, large]) {
      expect(t.ports).toEqual([])
      expect(t.portStatus).toBe('pending')
      expect(t.status).toBe('community')
    }
  })

  it('utilise les poids nets propres aux extensions de 10 et 20 faders', () => {
    expect(get('etc-eos-motorized-fader-wing-10').weightKg).toBe(2.8)
    expect(get('etc-eos-motorized-fader-wing-20').weightKg).toBe(4.9)
  })

  it('propose deux SmartPack portables sans déduire leur consommation du calibre des circuits', () => {
    const small = get('etc-smartpack-portable-6'), large = get('etc-smartpack-portable-12')
    expect(small.model).toMatch(/portable.*6 canaux/i)
    expect(large.model).toMatch(/portable.*12 canaux/i)
    for (const t of [small, large]) {
      expect(t.powerW).toBeUndefined()
      expect(t.ports).toEqual([])
      expect(t.portStatus).toBe('pending')
    }
  })
})
