// Projet d'exemple chargé au premier lancement : un concert simple, avec des blocs génériques.
import { addEquipment, connect, createProject } from '../model/project'
import type { Project } from '../model/types'
import { LIBRARY_BY_ID } from './generic'

export function buildSampleProject(): Project {
  let p = createProject('Exemple : concert, salle de 1 200 places')
  const ids: Record<string, string> = {}

  const place = (key: string, tplId: string, x: number, y: number, name: string, zoneId: string) => {
    const tpl = LIBRARY_BY_ID.get(tplId)
    if (!tpl) throw new Error(`Modèle inconnu : ${tplId}`)
    const r = addEquipment(p, tpl, { x, y }, { name, zoneId })
    p = r.project
    ids[key] = r.id
  }
  const link = (a: string, ap: string, b: string, bp: string, lengthM?: number) => {
    const r = connect(p, { equipmentId: ids[a], portId: ap }, { equipmentId: ids[b], portId: bp })
    p = r.project
    if (r.id && lengthM) p = { ...p, links: { ...p.links, [r.id]: { ...p.links[r.id], lengthM } } }
  }

  place('kick', 'gen-mic-dyn', 0, 0, 'Kick In', 'z-scn')
  place('snare', 'gen-mic-dyn', 0, 110, 'Caisse claire', 'z-scn')
  place('vox', 'gen-mic-cond', 0, 220, 'Voix lead', 'z-scn')
  place('di', 'gen-di', 0, 330, 'DI clavier', 'z-scn')
  place('sb', 'gen-stagebox-ip', 300, 0, 'Stagebox SB-1', 'z-scn')
  place('sw', 'gen-switch8', 620, 420, 'Switch SW-1', 'z-foh')
  place('desk', 'gen-console', 620, 0, 'Console FOH', 'z-foh')
  place('clk', 'gen-clock', 300, 470, 'Horloge CLK-1', 'z-foh')
  place('dsp', 'gen-processor', 940, 0, 'Processeur PS-1', 'z-foh')
  place('amp', 'gen-amp4', 1240, 0, 'Ampli AMP-1', 'z-scn')
  place('spkL', 'gen-speaker-passive', 1540, 0, 'Façade L', 'z-scn')
  place('spkR', 'gen-speaker-passive', 1540, 130, 'Façade R', 'z-scn')
  place('rec', 'gen-recorder', 940, 420, 'Enregistreur REC-1', 'z-foh')

  link('kick', 'p1', 'sb', 'p1', 10)
  link('snare', 'p1', 'sb', 'p2', 10)
  link('vox', 'p1', 'sb', 'p3', 10)
  link('di', 'p3', 'sb', 'p4', 5)
  link('sb', 'p13', 'sw', 'p1', 50)
  link('desk', 'p14', 'sw', 'p2', 3)
  link('rec', 'p3', 'sw', 'p3', 3)
  link('clk', 'p1', 'desk', 'p15', 3)
  link('desk', 'p13', 'dsp', 'p3', 2)
  link('dsp', 'p4', 'amp', 'p1', 40)
  link('dsp', 'p5', 'amp', 'p2', 40)
  link('amp', 'p5', 'spkL', 'p1', 15)
  link('amp', 'p6', 'spkR', 'p1', 15)
  // Erreur volontaire pour montrer le contrôle : un micro directement sur une entrée ligne
  link('vox', 'p1', 'rec', 'p1')
  return p
}
