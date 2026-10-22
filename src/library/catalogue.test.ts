import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { LIBRARY, LIBRARY_INDEX } from '.'
import { groupByDomain } from './domains'
import { validateTemplate } from '../model/validateTemplate'
import { addEquipment, createProject, isProject } from '../model/project'
import { searchLibrary } from '../ai/tools'
import { connectorsMate } from '../model/connectors'
import type { EquipmentTemplate } from '../model/types'

interface Coverage {
  totalSource: number
  excludedNoveltyIds: number[]
  products: { noveltyId: number; templateId: string; url: string; categories: string[] }[]
}

const coverage: Coverage = JSON.parse(readFileSync(new URL('../../docs/inventaire/novelty-2026-couverture.json', import.meta.url), 'utf8'))
const template = (id: string) => {
  const t = LIBRARY_INDEX.get(id)
  expect(t, id).toBeDefined()
  return t!
}

describe('références précisées : CCU Sony et Scarlett 2i2', () => {
  it('distingue les trois générations de Scarlett et leurs prises physiques', () => {
    const models = [2, 3, 4].map(gen => template(`focusrite-scarlett-2i2-${gen}g`))
    expect(new Set(models.map(t => t.id)).size).toBe(3)
    models.forEach((t, i) => {
      expect(t.status).toBe('verified')
      expect(searchLibrary(LIBRARY, `Scarlett 2i2 Gen ${i + 2}`)[0].template_id).toBe(t.id)
    })
    expect(models[0].ports.find(p => p.id === 'usb')?.connector).toBe('usb-b')
    expect(models[1].ports.map(p => p.id)).toEqual(['in1', 'in2', 'outL', 'outR', 'phones', 'usb'])
    expect(models[1].ports.find(p => p.id === 'usb')?.connector).toBe('usb-c')
    expect(models[2].ports.filter(p => p.direction === 'in' && p.connector === 'xlr3')).toHaveLength(2)
    expect(models[2].ports.filter(p => p.direction === 'in' && p.connector === 'jack-trs')).toHaveLength(2)
    expect(models[2].ports.find(p => p.id === 'dc5v')).toMatchObject({ signal: 'power', direction: 'in', connector: 'usb-c' })
    expect(models[2].description).toContain('pas quatre canaux indépendants')
  })
  it('sépare les liaisons caméra et les sorties différentes des deux CCU', () => {
    const fb = template('sony-hxcu-fb70'), tx = template('sony-hxcu-tx70')
    for (const t of [fb, tx]) {
      expect(t.status).toBe('verified')
      expect(t.family).toBe('control')
      expect(t.domain).toBe('image')
      expect(t.ports.filter(p => p.name.startsWith('SDI OUTPUT'))).toHaveLength(4)
      expect(t.ports.filter(p => p.name.startsWith('SDI RETURN'))).toHaveLength(2)
      expect(t.rackU).toBe(1.5)
      expect(t.powerW).toBeUndefined() // les manuels donnent des ampères, pas des watts
    }
    expect(fb.ports.find(p => p.id === 'camera')?.connector).toBe('opticalcon')
    expect(tx.ports.find(p => p.id === 'camera')?.connector).toBe('triax')
    expect(fb.ports.some(p => p.connector === 'hdmi')).toBe(true)
    expect(tx.ports.some(p => p.connector === 'hdmi')).toBe(false)
    expect(fb.ports.find(p => p.id === 'trunk')?.connector).toBe('dsub9')
    expect(tx.ports.find(p => p.id === 'trunk')?.connector).toBe('dsub25')
  })
})

describe('catalogue Novelty hors Structure', () => {
  it('couvre chaque fiche retenue, avec sa source, et exclut toute la catégorie Structure', () => {
    expect(coverage.products).toHaveLength(1534)
    expect(coverage.excludedNoveltyIds).toHaveLength(417)
    expect(coverage.totalSource).toBe(1951)
    expect(new Set(coverage.products.map(p => p.noveltyId)).size).toBe(1534)
    const excluded = new Set(coverage.excludedNoveltyIds)
    for (const p of coverage.products) {
      expect(excluded.has(p.noveltyId), String(p.noveltyId)).toBe(false)
      expect(p.categories.some(c => c.startsWith('Structure')), String(p.noveltyId)).toBe(false)
      expect(template(p.templateId).sources?.some(s => s.url === p.url), p.templateId).toBe(true)
    }
    expect(excluded.has(33763)).toBe(true) // fiche classée à la fois Vidéo et Structure
    expect(coverage.products.some(p => p.noveltyId === 33763)).toBe(false)
  })

  it('rend tous les modèles accessibles dans leur menu, sans identifiants en double', () => {
    expect(LIBRARY_INDEX.size).toBe(LIBRARY.length)
    const displayed = groupByDomain(LIBRARY).flatMap(d => d.families.flatMap(f => f.items.map(t => t.id)))
    expect(new Set(displayed).size).toBe(LIBRARY.length)
    expect(displayed).toHaveLength(LIBRARY.length)
    expect(template('novelty-rc32').domain).toBe('distribution')
    expect(template('audio-technica-at8615').domain).toBe('sound')
  })

  it('conserve les variantes et les ensembles qui ne sont pas équivalents à un appareil seul', () => {
    const linked = (id: number) => coverage.products.find(p => p.noveltyId === id)!.templateId
    expect(linked(14310)).not.toBe('l-acoustics-112p') // kit de deux enceintes
    expect(linked(35417)).not.toBe('blackmagic-web-presenter') // version 4K
    expect(linked(36086)).not.toBe('yamaha-dm3-d') // variante non précisée
    expect(linked(26303)).toBe('rane-sl4') // désignation commerciale de SL4
    expect(linked(50210)).toBe('robe-ledbeam-150')
  })

  it('conserve les ports et le statut vérifié des appareils déjà documentés', () => {
    const dm3 = template('yamaha-dm3-d')
    expect(dm3.status).toBe('verified')
    expect(dm3.ports.filter(p => p.name.startsWith('INPUT '))).toHaveLength(16)
    expect(dm3.ports.filter(p => p.name.startsWith('OUTPUT '))).toHaveLength(8)
    expect(dm3.ports.some(p => p.name === 'Dante Primary')).toBe(true)
    expect(template('robe-ledbeam-150').status).toBe('verified')
  })

  it('utilise les entrées/sorties déclarées, sans confondre ampères et watts ni poids de transport et poids unitaire', () => {
    const rc32 = template('novelty-rc32')
    expect(rc32.ports.filter(p => p.direction === 'in' && p.connector === 'p17-32-tri')).toHaveLength(1)
    expect(rc32.ports.filter(p => p.connector === 'p17-32-mono')).toHaveLength(3)
    expect(rc32.ports.filter(p => p.connector === 'schuko')).toHaveLength(6)
    expect(rc32.powerW).toBeUndefined()
    expect(connectorsMate('p17-32-tri', 'p17-32-mono')).toBe(false)
    expect(connectorsMate('p17-125-tri', 'p17-63-tri')).toBe(false)
    const quik = template('astera-quikpunch')
    expect(quik.ports).toHaveLength(4)
    expect(quik.weightKg).toBe(6.567)
    expect(quik.powerW).toBe(100)
    const inconsistent = template('novelty-ap63compt')
    expect(inconsistent.weightKg).toBeUndefined()
    expect(inconsistent.ports).toEqual([])
  })

  it('ajoute puis sauvegarde et recharge un appareil sans connectique documentée sans inventer de port', () => {
    const tpl = template('audio-technica-at8615')
    expect(tpl.portStatus).toBe('pending') // une embase de micro peut être câblée
    const { project, id } = addEquipment(createProject('Catalogue'), tpl, { x: 40, y: 40 })
    const loaded = JSON.parse(JSON.stringify(project))
    expect(isProject(loaded)).toBe(true)
    expect(loaded.equipment[id].ports).toEqual([])
    expect(loaded.equipment[id].templateId).toBe(tpl.id)
  })

  it('retrouve les références alternatives et indique à l’assistant la connectique manquante', () => {
    const t = template('rane-sl4')
    expect(searchLibrary([t], 'Serato')[0].template_id).toBe(t.id)
    const pending = template('audio-technica-at8615')
    expect(searchLibrary([pending], 'AT8615')[0].portStatus).toBe('pending')
  })
})

describe('fiches à connectique explicite', () => {
  const empty: EquipmentTemplate = { id: 'test', manufacturer: 'Test', model: 'Test', family: 'passive', pictogram: 'patch', ports: [], status: 'community',
    sources: [{ url: 'https://example.com/catalogue', accessed: '2026-10-19' }] }

  it('exige une distinction entre connectique non documentée et accessoire sans connectique', () => {
    expect(validateTemplate(empty).join()).toContain('aucun port')
    expect(validateTemplate({ ...empty, portStatus: 'pending' })).toEqual([])
    expect(validateTemplate({ ...empty, portStatus: 'none' })).toEqual([])
    expect(validateTemplate({ ...empty, portStatus: 'pending', sources: [] }).join()).toContain('source')
    expect(validateTemplate({ ...empty, portStatus: 'pending', status: 'verified' }).join()).toContain('connectique')
    expect(validateTemplate({ ...empty, portStatus: 'none', ports: [{ id: 'p1', name: 'In', direction: 'in', signal: 'audioAnalog', connector: 'xlr3' }] }).join()).toContain('sans connectique')
  })
})
