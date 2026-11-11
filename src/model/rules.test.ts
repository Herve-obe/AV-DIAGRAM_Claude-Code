import { describe, expect, it } from 'vitest'
import { GENERIC_LIBRARY } from '../library/generic'
import { buildSampleProject } from '../library/sample'
import * as ops from './project'
import { checkLink, checkProject, mutedIssues } from './rules'
import { LIBRARY } from '../library'
import { tpl, twoBoxes } from './testFixtures'

describe('règles de compatibilité', () => {
  it('micro vers entrée micro : aucune alerte', () => {
    const { p, a, b } = twoBoxes('gen-mic-dyn', 'gen-console')
    const r = ops.connect(p, { equipmentId: a, portId: 'p1' }, { equipmentId: b, portId: 'p1' })
    expect(checkLink(r.project, r.project.links[r.id!])).toEqual([])
  })
  it('micro vers entrée ligne : avertissement de niveau', () => {
    const { p, a, b } = twoBoxes('gen-mic-dyn', 'gen-processor')
    const r = ops.connect(p, { equipmentId: a, portId: 'p1' }, { equipmentId: b, portId: 'p1' })
    const codes = checkLink(r.project, r.project.links[r.id!]).map((i) => i.code)
    expect(codes).toContain('level-mic-to-line')
  })
  it('sortie phono vers entrée ligne, ligne vers entrée phono : avertissements', () => {
    const { p, a, b } = twoBoxes('gen-mic-dyn', 'gen-processor')
    const q = structuredClone(p)
    q.equipment[a].ports[0].level = 'phono'
    const r = ops.connect(q, { equipmentId: a, portId: 'p1' }, { equipmentId: b, portId: 'p1' })
    expect(checkLink(r.project, r.project.links[r.id!]).map((i) => i.code)).toContain('level-phono-to-line')
    q.equipment[a].ports[0].level = 'line+4'
    q.equipment[b].ports[0].level = 'phono'
    const s = ops.connect(q, { equipmentId: a, portId: 'p1' }, { equipmentId: b, portId: 'p1' })
    expect(checkLink(s.project, s.project.links[s.id!]).map((i) => i.code)).toContain('level-line-to-phono')
  })
  it('SDI vers entrée XLR : erreur de signal', () => {
    const { p, a, b } = twoBoxes('gen-camera', 'gen-console')
    const r = ops.connect(p, { equipmentId: a, portId: 'p1' }, { equipmentId: b, portId: 'p1' })
    const issues = checkLink(r.project, r.project.links[r.id!])
    expect(issues.find((i) => i.code === 'signal-mismatch')?.severity).toBe('error')
    expect(issues.map((i) => i.code)).toContain('adapter-needed')
  })
  it('sortie HP vers entrée ligne : erreur', () => {
    const { p, a, b } = twoBoxes('gen-amp4', 'gen-processor')
    const r = ops.connect(p, { equipmentId: a, portId: 'p5' }, { equipmentId: b, portId: 'p1' })
    expect(checkLink(r.project, r.project.links[r.id!]).map((i) => i.code)).toContain('level-speaker-to-line')
  })
  it('deux sources sur une entrée : erreur', () => {
    const boxes = twoBoxes('gen-mic-dyn', 'gen-console')
    const { a, b } = boxes
    let p = boxes.p
    const r0 = ops.addEquipment(p, tpl('gen-mic-dyn'), { x: 0, y: 100 })
    p = r0.project
    p = ops.connect(p, { equipmentId: a, portId: 'p1' }, { equipmentId: b, portId: 'p1' }).project
    const r = ops.connect(p, { equipmentId: r0.id, portId: 'p1' }, { equipmentId: b, portId: 'p1' })
    expect(checkLink(r.project, r.project.links[r.id!]).map((i) => i.code)).toContain('input-busy')
  })
  it('une alerte ignorée disparaît', () => {
    const { p, a, b } = twoBoxes('gen-mic-dyn', 'gen-processor')
    const r = ops.connect(p, { equipmentId: a, portId: 'p1' }, { equipmentId: b, portId: 'p1' })
    const ignored = ops.updateLink(r.project, r.id!, { ignoredRules: ['level-mic-to-line'] })
    expect(checkLink(ignored, ignored.links[r.id!])).toEqual([])
  })
})

describe('alimentation fantôme', () => {
  it('micro statique sur entrée console générique (fantôme fourni) : aucune alerte fantôme', () => {
    const { p, a, b } = twoBoxes('gen-mic-cond', 'gen-console')
    const r = ops.connect(p, { equipmentId: a, portId: 'p1' }, { equipmentId: b, portId: 'p1' })
    expect(checkLink(r.project, r.project.links[r.id!]).map((i) => i.code)).not.toContain('phantom-missing')
  })
  it('micro statique sur une entrée sans fantôme : avertissement', () => {
    const boxes = twoBoxes('gen-mic-cond', 'gen-console')
    const { a, b } = boxes
    const p = ops.updatePort(boxes.p, b, 'p1', { phantom: 'none' })
    const r = ops.connect(p, { equipmentId: a, portId: 'p1' }, { equipmentId: b, portId: 'p1' })
    expect(checkLink(r.project, r.project.links[r.id!]).map((i) => i.code)).toContain('phantom-missing')
  })
})

describe('flux réseau', () => {
  it('alerte quand une liaison transporte plus de canaux que la capacité déclarée', () => {
    let p = buildSampleProject()
    const l = Object.values(p.links)[0]
    p = ops.updatePort(p, l.source.equipmentId, l.source.portId, { channels: 64 })
    p = ops.updateLink(p, l.id, { channels: 64 })
    expect(checkLink(p, p.links[l.id]).map((i) => i.code)).not.toContain('channels-over')
    p = ops.updateLink(p, l.id, { channels: 65 })
    expect(checkLink(p, p.links[l.id]).map((i) => i.code)).toContain('channels-over')
  })
})

describe('contrôles désactivés pour le schéma', () => {
  it('une règle désactivée ne signale plus, sur toutes les liaisons, et reste listée pour être réactivée', () => {
    let p = buildSampleProject()
    const mic = Object.values(p.equipment).find(e => e.templateId === 'gen-mic-cond')!
    const rec = Object.values(p.equipment).find(e => e.templateId === 'gen-recorder')!
    p = ops.connect(p, { equipmentId: mic.id, portId: 'p1' }, { equipmentId: rec.id, portId: 'p1' }).project
    const before = checkProject(p).filter((i) => i.code === 'level-mic-to-line')
    expect(before.length).toBeGreaterThan(0)
    p = ops.updateSettings(p, { mutedRules: ['level-mic-to-line'] })
    expect(checkProject(p).some((i) => i.code === 'level-mic-to-line')).toBe(false)
    expect(mutedIssues(p).filter((i) => i.scope === 'project' && i.code === 'level-mic-to-line')).toHaveLength(before.length)
    p = ops.updateSettings(p, { mutedRules: [] })
    expect(checkProject(p).filter((i) => i.code === 'level-mic-to-line')).toHaveLength(before.length)
  })
})

describe('entrées micro/ligne et éclatés D-Sub 25', () => {
  const mtrx = LIBRARY.find(t => t.id === 'avid-mtrx-studio')!
  const mic = GENERIC_LIBRARY.find(t => t.ports.some(p => p.direction === 'out' && p.level === 'mic' && p.connector === 'xlr3'))!
  const lineOut = (id: string) => ({ id, name: 'Out', direction: 'out' as const, signal: 'audioAnalog' as const, connector: 'xlr3', level: 'line+4' as const })

  it("n'alerte pas quand un micro entre dans une entrée ligne qui accepte aussi le micro", async () => {
    const { levelIssueOf } = await import('./rules')
    const combo = { id: 'in', name: 'In', direction: 'in' as const, signal: 'audioAnalog' as const, connector: 'combo', level: 'line+4' as const, modes: [{ connector: 'combo', level: 'mic' as const }] }
    const micOut = { ...lineOut('o'), level: 'mic' as const }
    expect(levelIssueOf(micOut, combo)).toBeNull()
    expect(levelIssueOf(lineOut('o'), combo)).toBeNull()
    expect(levelIssueOf(micOut, { ...combo, modes: undefined })).toBe('level-mic-to-line')
  })

  it("documente le mode ligne des entrées décrites micro/ligne dans les fiches", () => {
    const ports = LIBRARY.filter(t => t.family !== 'camera').flatMap(t => t.ports.filter(p => p.direction !== 'out' && p.signal === 'audioAnalog' && p.level === 'mic' && /mic\s*\/\s*line|micro\s*\/\s*ligne/i.test(`${p.name} ${p.format ?? ''}`)))
    expect(ports.length).toBeGreaterThan(100)
    for (const p of ports) expect(p.modes?.some(m => m.level === 'line+4' || m.level === 'line-10' || m.level === 'none'), p.name).toBe(true)
  })

  it("propose d'office l'éclaté D-Sub 25 et accepte 8 liaisons sur une prise de 8 voies", async () => {
    const { buildCableBom, suggestCable } = await import('./cables')
    expect(suggestCable('xlr3', 'dsub25')?.id).toBe('db25-xlrf-8')
    expect(suggestCable('dsub25', 'xlr3')?.id).toBe('db25-xlrm-8')
    expect(suggestCable('dsub25', 'jack-trs')?.id).toBe('db25-trs-8')
    expect(suggestCable('xlr3', 'xlr3')).toBeUndefined()
    let p = ops.createProject('MTRX')
    const m = ops.addEquipment(p, mtrx, { x: 0, y: 0 }); p = m.project
    const sources: string[] = []
    for (let i = 0; i < 9; i++) { const r = ops.addEquipment(p, mic, { x: 0, y: 100 * i }); p = r.project; sources.push(r.id) }
    const micPort = mic.ports.find(x => x.direction === 'out' && x.connector === 'xlr3')!.id
    const links: string[] = []
    const busy: boolean[] = []
    for (const s of sources) {
      const r = ops.connect(p, { equipmentId: s, portId: micPort }, { equipmentId: m.id, portId: 'li1_8' }); p = r.project; links.push(r.id!)
      busy.push(checkLink(p, p.links[r.id!]).some(i => i.code === 'input-busy'))
    }
    expect(p.links[links[0]].cableTypeId).toBe('db25-xlrf-8')
    expect(busy).toEqual([false, false, false, false, false, false, false, false, true])
    const bom = buildCableBom(p, () => ['xlr3', 'dsub25'])
    expect(bom.find(l => l.cableId === 'db25-xlrf-8')?.quantity).toBe(2)
  })
})
