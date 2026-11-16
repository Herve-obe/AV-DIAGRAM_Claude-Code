// Fiches de procédure de l'assistant (docs/ia/procedures.md) : fidèles à l'interface et au manuel, retrouvées par la recherche.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import fr from '../i18n/fr.json'
import { isHowToQuestion, searchProcedures } from './knowledge'

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')
const procedures = read('docs/ia/procedures.md')
const manualChapters = read('docs/manuel-utilisateur.md').split('\n').filter(l => l.startsWith('## ')).map(l => l.slice(3).trim().replace(/^\d+\.\s*/, ''))
const fiches = procedures.split(/\n(?=## )/).filter(s => s.startsWith('## ')).map(section => ({
  title: section.match(/^## (.+)/)![1].trim(),
  section,
  keys: (section.match(/^Libellés\s*:(.*)$/m)?.[1] ?? '').split(',').map(k => k.trim()).filter(Boolean),
  manual: section.match(/^Manuel\s*:\s*chapitre (\d+), « (.+?) »/m),
}))
const label = (key: string) => key.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), fr)

describe('fiches de procédure de l’assistant', () => {
  it('ont toutes la structure attendue', () => {
    expect(fiches.length).toBeGreaterThanOrEqual(25)
    for (const f of fiches) {
      for (const line of ['Mots-clés :', 'But :', 'Étapes :', 'Libellés :']) expect(f.section, `${f.title} : ${line}`).toContain(line)
      expect(f.section, f.title).toMatch(/^1\. /m)
    }
    expect(new Set(fiches.map(f => f.title)).size).toBe(fiches.length)
  })

  it('ne citent que des libellés qui existent dans l’interface', () => {
    for (const f of fiches) for (const key of f.keys) {
      const value = label(key)
      expect(typeof value, `${f.title} : clé ${key} absente de fr.json`).toBe('string')
    }
  })

  it('renvoient au bon chapitre du manuel', () => {
    for (const f of fiches.filter(f => f.manual)) {
      const [, n, title] = f.manual!
      expect(manualChapters[Number(n) - 1], `${f.title} : chapitre ${n}`).toBe(title)
    }
  })

  it('sont retrouvées par la recherche locale pour au moins 85 % des questions de référence', () => {
    const questions: { question: string; fiche: string }[] = JSON.parse(read('docs/ia/questions-aide.json'))
    const known = questions.filter(q => fiches.some(f => f.title === q.fiche))
    const found = known.filter(q => searchProcedures(q.question)[0]?.source === `Procédure AV Diagram, ${q.fiche}`)
    expect(known.length).toBeGreaterThanOrEqual(30)
    expect(found.length / known.length, known.filter(q => !found.includes(q)).map(q => `${q.question} → ${q.fiche}`).join('\n')).toBeGreaterThanOrEqual(0.85)
  })

  it('reconnaît une question d’usage sans capter une demande de schéma', () => {
    for (const q of ['Comment je fais pour ajouter une zone ?', 'où se trouve l’export PDF', 'How do I add a sheet?', 'Je ne trouve pas la sauvegarde automatique'])
      expect(isHowToQuestion(q), q).toBe(true)
    for (const q of ['Propose un plateau avec 3 caméras', 'Ajoute une DI sur la console', 'Vérifie mon schéma'])
      expect(isHowToQuestion(q), q).toBe(false)
  })
})
