import { describe, expect, it } from 'vitest'
import { GENERIC_LIBRARY } from '../library/generic'
import { buildSampleProject } from '../library/sample'
import { checkProject } from './rules'
import { equipmentInView } from './layers'
import { domainOf } from '../library/domains'
import { LIBRARY } from '../library'
import { validateTemplate } from './validateTemplate'
import { tpl } from './testFixtures'

describe('projet d\'exemple et bibliothèque', () => {
  it('chaque port de la bibliothèque a un identifiant unique dans son modèle', () => {
    for (const t of GENERIC_LIBRARY) expect(new Set(t.ports.map((p) => p.id)).size).toBe(t.ports.length)
  })
  it('l\'exemple est câblé sans alerte volontaire', () => {
    const p = buildSampleProject()
    expect(checkProject(p)).toEqual([])
    expect(Object.keys(p.links)).toHaveLength(15)
  })
  it('bibliothèque filtrée sur le calque Audio : consoles gardées, projecteurs sans port audio écartés', () => {
    const onSound = LIBRARY.filter((tpl) => equipmentInView(tpl, 'sound'))
    expect(onSound.some((tpl) => tpl.family === 'console')).toBe(true)
    const lightOnly = LIBRARY.filter((tpl) => domainOf(tpl) === 'light' && !tpl.ports.some((p) => ['audioAnalog', 'audioDigital', 'audioIp', 'intercom', 'rf'].includes(p.signal)))
    expect(lightOnly.length).toBeGreaterThan(0)
    for (const tpl of lightOnly) expect(onSound).not.toContain(tpl)
    expect(LIBRARY.filter((tpl) => equipmentInView(tpl, 'all'))).toHaveLength(LIBRARY.length)
  })
})

describe('fiches constructeur', () => {
  it('accepte un relevé identifié pour une fiche à documenter, sans lui attribuer de prises ni le statut vérifié', async () => {
    const { validateTemplate } = await import('./validateTemplate')
    const template = { id: 'test-catalogue', family: 'camera' as const, manufacturer: 'Test', model: 'X', pictogram: 'camera' as const,
      ports: [], portStatus: 'pending' as const, status: 'community' as const, sources: [{ document: 'Relevé utilisateur fictif, désignation seulement', accessed: '2026-10-22' }] }
    expect(validateTemplate(template)).toEqual([])
    expect(validateTemplate({ ...template, sources: [] }).length).toBeGreaterThan(0)
    expect(validateTemplate({ ...template, sources: [{ document: ' ', accessed: '2026-10-22' }] }).length).toBeGreaterThan(0)
    expect(validateTemplate({ ...template, sources: [{ document: 'Relevé', accessed: 'date inconnue' }] }).length).toBeGreaterThan(0)
    expect(validateTemplate({ ...template, status: 'verified' }).length).toBeGreaterThan(0)
  })
  it('toutes les fiches de src/library/devices sont valides', async () => {
    const { readdirSync, readFileSync } = await import('node:fs')
    const { validateTemplate } = await import('./validateTemplate')
    const dir = new URL('../library/devices/', import.meta.url)
    for (const f of readdirSync(dir).filter((n) => n.endsWith('.json'))) {
      expect(validateTemplate(JSON.parse(readFileSync(new URL(f, dir), 'utf8'))), f).toEqual([])
    }
  })
  it('refuse une fiche vérifiée sans source', async () => {
    const { validateTemplate } = await import('./validateTemplate')
    // Données de test fictives, pas un produit réel
    const errors = validateTemplate({
      id: 'test-x', family: 'console', manufacturer: 'Test', model: 'X', pictogram: 'console', status: 'verified',
      ports: [{ id: 'p1', name: 'In', direction: 'in', signal: 'audioAnalog', connector: 'xlr3' }],
    })
    expect(errors.join()).toContain('source')
  })
})

describe('bibliothèque : menus', () => {
  it('range chaque modèle dans un menu, sans en perdre', async () => {
    const { LIBRARY } = await import('../library')
    const { groupByDomain, domainOf } = await import('../library/domains')
    const groups = groupByDomain(LIBRARY)
    const placed = groups.flatMap((g) => g.families.flatMap((f) => f.items))
    expect(placed).toHaveLength(LIBRARY.length)
    expect(groups.map((g) => g.domain)).toEqual(['sound', 'image', 'light', 'network', 'distribution', 'misc'])
    expect(domainOf(tpl('gen-mic-dyn'))).toBe('sound')
    expect(domainOf(tpl('gen-camera'))).toBe('image')
    expect(domainOf(tpl('gen-switch8'))).toBe('network')
    // Enregistreur vidéo de la famille « Enregistrement » : rangé en Image par sa fiche
    expect(domainOf(LIBRARY.find((t) => t.id === 'blackmagic-hyperdeck-studio-pro')!)).toBe('image')
  })
})

describe('équipement générique créé par l’utilisateur', () => {
  it('construit une fiche valide avec les prises demandées, le poids et la consommation facultatifs', async () => {
    const { buildGenericTemplate, genericErrors, connectorsFor, familiesFor } = await import('./genericEquipment')
    const spec = { name: 'Boîtier de scène maison', domain: 'sound' as const, family: 'stagebox' as const, powerW: 12,
      groups: [
        { direction: 'in' as const, signal: 'audioAnalog' as const, connector: 'xlr3', count: 8, label: 'Entrée', level: 'mic' as const },
        { direction: 'out' as const, signal: 'audioAnalog' as const, connector: 'multipin', count: 1, label: 'Multipaire' },
      ] }
    expect(genericErrors(spec)).toEqual([])
    const t = buildGenericTemplate(spec, () => 'abc')
    expect(validateTemplate(t)).toEqual([])
    expect(t).toMatchObject({ id: 'user-generic-boitier-de-scene-maison-abc', status: 'user', domain: 'sound', family: 'stagebox', powerW: 12 })
    expect(t.weightKg).toBeUndefined()
    expect(t.ports.map(p => p.name).slice(0, 2)).toEqual(['Entrée 1', 'Entrée 2'])
    expect(t.ports).toHaveLength(9)
    expect(new Set(t.ports.map(p => p.id)).size).toBe(9)
    // Connecteurs limités à la catégorie : pas de XLR micro sur un réseau, pas de SDI dans la lumière
    expect(connectorsFor('network')).not.toContain('xlr3')
    expect(familiesFor('light')).not.toContain('module')
    expect(genericErrors({ ...spec, domain: 'light', family: 'luminaire' })).toContain('group')
    expect(genericErrors({ ...spec, name: ' ', groups: [] })).toEqual(expect.arrayContaining(['name', 'ports']))
  })
})
