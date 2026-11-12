// Batterie d'évaluation : cas tirés des exercices de BTS d'Hervé Obejero, et correcteur automatique.
import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { GENERIC_LIBRARY } from '../library/generic'
import { addEquipment, connect, createProject } from '../model/project'
import { SIGNAL_FAMILIES } from '../model/signals'
import type { Project } from '../model/types'
import { DOMAIN_FAMILIES } from '../library/domains'
import { gradeCase, hasPath, overallScore, type EvalCase } from './evaluation'

const dir = new URL('../../docs/ia/evaluation/cas/', import.meta.url)
const cases: EvalCase[] = readdirSync(dir).filter(f => f.endsWith('.json')).map(f => JSON.parse(readFileSync(new URL(f, dir), 'utf8')))
const families = new Set(Object.values(DOMAIN_FAMILIES).flat())

/** Pose un appareil générique et renvoie le projet et son identifiant. */
function put(p: Project, templateId: string, name: string) {
  const t = GENERIC_LIBRARY.find(t => t.id === templateId)!
  return addEquipment(p, t, { x: 0, y: 0 }, { name })
}
/** Relie la première sortie audio analogique libre de a à la première entrée audio analogique libre de b. */
function wire(p: Project, a: string, b: string) {
  const used = new Set(Object.values(p.links).flatMap(l => [`${l.source.equipmentId}/${l.source.portId}`, `${l.target.equipmentId}/${l.target.portId}`]))
  const out = p.equipment[a].ports.find(x => x.direction !== 'in' && x.signal === 'audioAnalog' && !used.has(`${a}/${x.id}`))!
  const inp = p.equipment[b].ports.find(x => x.direction !== 'out' && x.signal === 'audioAnalog' && !used.has(`${b}/${x.id}`))!
  const r = connect(p, { equipmentId: a, portId: out.id }, { equipmentId: b, portId: inp.id })
  expect(r.id).not.toBeNull()
  return r.project
}

describe('batterie d’évaluation de l’assistant', () => {
  it('contient des cas complets, aux familles et signaux connus du logiciel', () => {
    expect(cases.length).toBeGreaterThanOrEqual(15)
    for (const c of cases) {
      expect(c.demande.length, c.id).toBeGreaterThan(200)
      expect(c.demande.length, c.id).toBeLessThanOrEqual(4000)
      expect(['simple', 'moyen', 'complexe'], c.id).toContain(c.difficulte)
      expect(c.exigences.length, c.id).toBeGreaterThan(0)
      for (const r of c.exigences) {
        if (r.verif.famille) expect(families.has(r.verif.famille), `${c.id}/${r.id} : ${r.verif.famille}`).toBe(true)
        if (r.verif.signal) expect((SIGNAL_FAMILIES as readonly string[]).includes(r.verif.signal), `${c.id}/${r.id} : ${r.verif.signal}`).toBe(true)
      }
    }
  })

  it('note un schéma : quantités, liaisons directes ou à travers un appareil, exigences laissées au juge', () => {
    const c = cases.find(c => c.id === 'talk-show-twitch')!
    let p = createProject('Talk-show')
    let r = put(p, 'gen-console', 'Console SQ5'); p = r.project; const desk = r.id
    const mics: string[] = []
    for (let i = 1; i <= 5; i++) { r = put(p, 'gen-mic-dyn', `Micro ${i}`); p = r.project; mics.push(r.id) }
    r = put(p, 'gen-speaker-active', 'Retour plateau talk-show'); p = r.project; const ret1 = r.id
    r = put(p, 'gen-speaker-active', 'Retour plateau live'); p = r.project; const ret2 = r.id
    r = put(p, 'gen-recorder', 'Enregistreur AV'); p = r.project; const rec = r.id
    for (const m of mics) p = wire(p, m, desk)
    p = wire(p, desk, ret1); p = wire(p, desk, ret2); p = wire(p, desk, rec)
    const g = gradeCase(c, p)
    const byId = Object.fromEntries(g.automatic.map(x => [x.id, x]))
    expect(byId.e1.ok).toBe(true) // une console
    expect(byId.e2.ok).toBe(true) // 5 micros
    expect(byId.e3.ok).toBe(true) // 2 retours reliés à la console
    expect(byId.e5.ok).toBe(true) // console → enregistreur
    expect(byId.e4.ok).toBe(false) // aucun poste de streaming : exigence échouée et expliquée
    expect(byId.e4.detail).toContain('non relié')
    expect(g.forJudge.map(x => x.id)).toEqual(expect.arrayContaining(['e7', 'e8', 'e9']))
    expect(g.score).toBeGreaterThan(0)
    expect(g.score).toBeLessThan(100)
    expect(hasPath(p, 'micro', 'enregistreur')).toBe(true) // à travers la console
    expect(hasPath(p, 'enregistreur', 'micro')).toBe(false) // sens respecté
  })

  it('pondère la note globale par la difficulté', () => {
    const grade = (score: number) => ({ id: 'x', automatic: [], forJudge: [], score })
    expect(overallScore([{ grade: grade(100), difficulte: 'simple' }, { grade: grade(0), difficulte: 'complexe' }])).toBe(25)
  })
})
