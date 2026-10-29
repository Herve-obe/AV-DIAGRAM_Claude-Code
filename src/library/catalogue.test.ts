import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { LIBRARY, LIBRARY_INDEX } from '.'
import excludedDevices from './excluded.json'
import { groupByDomain } from './domains'
import { validateTemplate } from '../model/validateTemplate'
import { addEquipment, createProject, DEFAULT_SHEET_ID, isProject } from '../model/project'
import { createDraft, runTool, searchLibrary } from '../ai/tools'
import { connectorsMate } from '../model/connectors'
import type { EquipmentTemplate } from '../model/types'

interface Coverage {
  totalSource: number
  excludedNoveltyIds: number[]
  products: { noveltyId: number; templateId: string; url: string; categories: string[] }[]
}

const undocumented: EquipmentTemplate = { id: 'test-pending', model: 'Fiche test en attente', manufacturer: 'Test', family: 'processing', pictogram: 'processor', status: 'community', ports: [], portStatus: 'pending', sources: [{ document: 'Fixture sans connectique documentée', accessed: '2026-10-28' }] }

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
      if (Object.hasOwn(excludedDevices, p.templateId)) {
        expect(LIBRARY_INDEX.has(p.templateId), p.templateId).toBe(false)
      } else {
        expect(template(p.templateId).sources?.some(s => s.url === p.url), p.templateId).toBe(true)
      }
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

  it('conserve la traçabilité des variantes et des ensembles désormais exclus', () => {
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
    const tpl = undocumented
    expect(tpl.portStatus).toBe('pending')
    const { project, id } = addEquipment(createProject('Catalogue'), tpl, { x: 40, y: 40 })
    const loaded = JSON.parse(JSON.stringify(project))
    expect(isProject(loaded)).toBe(true)
    expect(loaded.equipment[id].ports).toEqual([])
    expect(loaded.equipment[id].templateId).toBe(tpl.id)
  })

  it('retrouve les références alternatives et indique à l’assistant la connectique manquante', () => {
    const t = template('rme-madi-routeur')
    expect(searchLibrary([t], 'MADI Routeur')[0].template_id).toBe(t.id)
    const pending = undocumented
    expect(searchLibrary([pending], 'Fiche test')[0].portStatus).toBe('pending')
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


describe('audit intégral du périmètre et du classement du catalogue', () => {
  const files = import.meta.glob<EquipmentTemplate>('./devices/*.json', { eager: true, import: 'default' })
  const auditUrl = new URL('../../docs/inventaire/catalogue-audit-2026-10-25.json', import.meta.url)
  const manifest: { parts: string[] } = JSON.parse(readFileSync(auditUrl, 'utf8'))
  const audit: { entries: { id: string; decision: string }[] } = {
    entries: manifest.parts.flatMap(part => JSON.parse(readFileSync(new URL(part, auditUrl), 'utf8'))),
  }

  it('enregistre une décision pour chaque référence et ne retire aucune donnée des projets anciens', () => {
    const raw = Object.values(files)
    expect(new Set(raw.map(t => t.id)).size).toBe(raw.length)
    expect(audit.entries.map(t => t.id).sort()).toEqual(raw.map(t => t.id).sort())
    expect(new Set(audit.entries.map(t => t.id)).size).toBe(raw.length)
    for (const row of audit.entries) {
      if (row.decision === 'excluded') expect(Object.hasOwn(excludedDevices, row.id), row.id).toBe(true)
      expect(LIBRARY_INDEX.has(row.id), row.id).toBe(!Object.hasOwn(excludedDevices, row.id))
    }
    const support = raw.find(t => t.id === 'adam-hall-slt005')!
    const { project, id } = addEquipment(createProject('Ancien projet'), support, { x: 0, y: 0 })
    const loaded = JSON.parse(JSON.stringify(project))
    expect(isProject(loaded)).toBe(true)
    expect(loaded.equipment[id].model).toBe('SLT005')
  })

  it('écarte les accessoires et les ensembles, et conserve les appareils physiques', () => {
    for (const id of ['adam-hall-slt005', 'compulocks-ipadair-stand', 'luke-asb-i', 'novelty-siege-de-pont-pour-poursuite', 'novelty-cmx', 'novelty-hmi2500the-h', 'apple-logic-pro-x', 'shure-sbrc-e', 'audio-technica-at8601', 'l-acoustics-syva-base']) expect(LIBRARY_INDEX.has(id), id).toBe(false)
    for (const id of ['l-acoustics-108p', 'motorola-dp1400', 'indu-electric-ap125tdif', 'oray-fly-duo-150-200', 'barco-tld-1-2', 'look-solutions-unique-2']) expect(LIBRARY_INDEX.has(id), id).toBe(true)
    expect(searchLibrary(LIBRARY, 'SLT005')).toEqual([])
    expect(template('audio-technica-at8615').ports.map(p => p.direction)).toEqual(['in', 'out'])
  })

  it('range les appareils par fonction réelle', () => {
    expect(template('akai-apc40')).toMatchObject({ family: 'control', domain: 'sound' })
    expect(template('yamaha-d5000').family).toBe('processing')
    expect(template('toa-pa031').family).toBe('amplification')
    expect(template('taiden-tmx-0808-sdi')).toMatchObject({ family: 'videoRouting', domain: 'image' })
    expect(template('panasonic-aw-rp50')).toMatchObject({ family: 'control', domain: 'image' })
    expect(template('etc-eos-apex-5-console-lumiere-48-univers')).toMatchObject({ family: 'lightingControl', domain: 'light' })
    expect(template('yamaha-ro8-d').family).toBe('stagebox')
  })

  it('distingue les cartes, les slots internes et les prises physiques', () => {
    const my = template('yamaha-my16-at'), desk = template('yamaha-01v96')
    expect(my).toMatchObject({ family: 'module', moduleType: 'yamaha-mini-ygdai' })
    expect(my.ports.some(p => p.id === 'slot')).toBe(false)
    expect(desk.ports.some(p => p.id === 'slot')).toBe(false)
    expect(desk.slots).toContainEqual(expect.objectContaining({ type: my.moduleType }))
    expect(template('yamaha-cl5').slots).toHaveLength(3)
    expect(template('panasonic-ty-sb01qs')).toMatchObject({ family: 'module', moduleType: 'intel-sdm' })
    expect(template('auvitran-avbx7').slots).toHaveLength(7)
    expect(template('auvitran-axc-dante').moduleType).toBe('auvitran-axc')
    expect(template('yamaha-my16-es64').aliases).not.toContain('MY16AE')
  })

  it('ne fait pas passer la puissance audio pour une consommation électrique', () => {
    for (const id of ['yamaha-vxs3f', 'bose-dm2c-lp-white']) expect(template(id).powerW, id).toBeUndefined()
    expect(template('yamaha-hs5').powerW).toBe(45)
    expect(template('yamaha-dzr12').powerW).toBe(150) // consommation à 1/8, pas les 2000 W audio
    expect(template('yamaha-stagepas-1k').powerW).toBe(85)
    expect(LIBRARY_INDEX.has('etc-source-four-led-lustr2')).toBe(false)
    expect(template('etc-source-four-led-series-2-lustr').status).toBe('verified')
  })
})


describe('appareils unitaires — décision du 26 octobre', () => {
  const files = import.meta.glob<EquipmentTemplate>('./devices/*.json', { eager: true, import: 'default' })
  const audit: { entries: { id: string; decision: 'excluded' | 'normalized'; modelAfter?: string }[] } = JSON.parse(readFileSync(new URL('../../docs/inventaire/ensembles-audit-2026-10-26.json', import.meta.url), 'utf8'))
  const feedback: { records: { id: string; decision: string }[] } = JSON.parse(readFileSync(new URL('../../docs/inventaire/retours-lot-audio-01-2026-10-28.json', import.meta.url), 'utf8'))
  const feedback02: typeof feedback = JSON.parse(readFileSync(new URL('../../docs/inventaire/retours-lot-audio-02-2026-10-29.json', import.meta.url), 'utf8'))

  it('applique toutes les exclusions sans altérer les appareils enregistrés dans les anciens projets', () => {
    for (const row of [...audit.entries.filter(r => r.decision === 'excluded'), ...feedback.records.filter(r => r.decision === 'Retirer'), ...feedback02.records.filter(r => r.decision === 'Retirer')]) {
      expect(LIBRARY_INDEX.has(row.id), row.id).toBe(false)
      const original = Object.values(files).find(t => t.id === row.id)!
      expect(original, row.id).toBeDefined()
      const { project, id } = addEquipment(createProject('Projet existant'), original, { x: 0, y: 0 })
      const loaded = JSON.parse(JSON.stringify(project))
      expect(isProject(loaded), row.id).toBe(true)
      expect(loaded.equipment[id].ports, row.id).toEqual(original.ports)
      expect(loaded.equipment[id].model, row.id).toBe(original.model)
    }
  })

  it('présente les lots homogènes comme un seul appareil, sans poids de transport supposé', () => {
    for (const row of audit.entries.filter(r => r.decision === 'normalized' && !Object.hasOwn(excludedDevices, r.id))) {
      const unit = template(row.id)
      expect([unit.model, ...(unit.aliases ?? [])], row.id).toContain(row.modelAfter)
      expect([unit.model, unit.description, ...(unit.aliases ?? [])].join(' '), row.id).not.toMatch(/(?:kit|set)\s*(?:de\s*)?[x×]?\s*[2-9]|(?:kit|set)\s*x?\s*2[0-9]/i)
    }
    expect(template('l-acoustics-12xt-kit-x2').weightKg).toBe(29) // masse unitaire documentée dans la nouvelle notice
    expect(template('novelty-matled-cbat-setx4').weightKg).toBeUndefined()
    expect(template('astera-quikpunch').weightKg).toBe(6.567)
  })

  it('sépare les ensembles HF des appareils à plusieurs canaux dans un même châssis', () => {
    for (const id of ['sennheiser-ew100-eng-g4', 'sennheiser-ew335-g3-a', 'shure-psm1000', 'shure-ur4d-plus-ur2-x2-freq-g1e', 'swit-flow500', 'teradek-beam', 'novelty-regie-4k-compacte', 'l-acoustics-la-rak-ii-avb']) expect(LIBRARY_INDEX.has(id), id).toBe(false)
    for (const id of ['sennheiser-ek-100-g4', 'sennheiser-sk-100-g4', 'sennheiser-em-300-g3', 'shure-ur1', 'shure-ur4d', 'shure-p10t', 'shure-p10r-plus', 'digico-sd-rack', 'blackmagic-design-smartview-duo', 'marshall-electronics-v-r44p-hdsdi']) expect(LIBRARY_INDEX.has(id), id).toBe(true)
  })
})

it('traite les prises parallèles de l’AR-133 comme une seule entrée mono en jack ou XLR', () => {
  const di = template('bss-audio-ar133')
  for (const connector of ['jack-ts', 'xlr3']) {
    const source: EquipmentTemplate = { id: 'source-instrument-test', model: 'Source fictive', family: 'capture', pictogram: 'di', status: 'generic',
      ports: [{ id: 'out', name: 'Sortie', direction: 'out', signal: 'audioAnalog', connector, level: 'instrument' }] }
    const draft = createDraft(createProject('Entrée mono fictive'), DEFAULT_SHEET_ID)
    const ctx = { library: [source, di], describe: (i: { code: string }) => i.code }
    const args = { equipment: [{ ref: 'source', template_id: source.id, count: 2 }, { ref: 'di', template_id: di.id }],
      connections: [{ from: 'source', to: 'di', signal: 'audioAnalog' }] }
    const two = runTool(draft, { id: 'two', name: 'propose_system', args }, ctx)
    expect(JSON.parse(two.content).error).toBeTruthy()
    expect(two.draft).toBe(draft)
    const one = runTool(draft, { id: 'one', name: 'propose_system', args: { ...args,
      equipment: [{ ...args.equipment[0], count: 1 }, args.equipment[1]] } }, ctx)
    expect(JSON.parse(one.content).error).toBeUndefined()
    expect(one.draft.addedLinks).toHaveLength(1)
    expect(Object.keys(draft.base.equipment)).toHaveLength(0)
  }
})
