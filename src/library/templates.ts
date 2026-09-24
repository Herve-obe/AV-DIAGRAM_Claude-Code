// Modèles de projets proposés à la création : points de départ modifiables, avec des blocs génériques.
// Les liaisons sont décrites par NOMS de ports, plus lisibles et plus robustes que les identifiants.
import { addAnnotation, addEquipment, addSheet, connect, createProject, DEFAULT_SHEET_ID } from '../model/project'
import type { Project } from '../model/types'
import { LIBRARY_BY_ID } from './generic'
import { buildSampleProject } from './sample'

export type TemplateId = 'blank' | 'concert' | 'tvStudio' | 'conference'

/** Petit assistant de construction : pose des blocs et les relie par noms de ports. */
function builder(name: string) {
  let p = createProject(name)
  const ids: Record<string, string> = {}
  let sheet = DEFAULT_SHEET_ID
  const api = {
    sheet(label: string, first = false) {
      if (first) {
        p = { ...p, sheets: [{ id: DEFAULT_SHEET_ID, name: label }] }
        sheet = DEFAULT_SHEET_ID
      } else {
        const r = addSheet(p, label)
        p = r.project
        sheet = r.id
      }
      return api
    },
    place(key: string, tplId: string, x: number, y: number, label: string, zoneId?: string) {
      const tpl = LIBRARY_BY_ID.get(tplId)
      if (!tpl) throw new Error(`Modèle inconnu : ${tplId}`)
      const r = addEquipment(p, tpl, { x, y }, { name: label, zoneId, sheetId: sheet })
      p = r.project
      ids[key] = r.id
      return api
    },
    link(a: string, aPort: string, b: string, bPort: string, lengthM?: number) {
      const port = (k: string, n: string) => {
        const found = p.equipment[ids[k]]?.ports.find((x) => x.name === n)
        if (!found) throw new Error(`Port introuvable : ${k} / ${n}`)
        return { equipmentId: ids[k], portId: found.id }
      }
      const r = connect(p, port(a, aPort), port(b, bPort))
      p = r.project
      if (r.id && lengthM) p = { ...p, links: { ...p.links, [r.id]: { ...p.links[r.id], lengthM } } }
      return api
    },
    frame(text: string, x: number, y: number, w: number, h: number, color: string) {
      p = addAnnotation(p, { kind: 'frame', sheetId: sheet, position: { x, y }, size: { w, h }, text, color }).project
      return api
    },
    build: () => p,
  }
  return api
}

function tvStudio(): Project {
  return builder('Plateau TV 3 caméras')
    .sheet('Plateau et régie vidéo', true)
    .frame('Plateau', -40, -60, 330, 620, 'var(--sig-video)')
    .frame('Régie vidéo', 330, -60, 700, 620, 'var(--sig-network)')
    .place('cam1', 'gen-camera', 0, 0, 'Caméra 1', 'z-vid')
    .place('cam2', 'gen-camera', 0, 160, 'Caméra 2', 'z-vid')
    .place('cam3', 'gen-camera', 0, 320, 'Caméra 3', 'z-vid')
    .place('sync', 'gen-clock', 380, 380, 'Générateur de synchro', 'z-vid')
    .place('mix', 'gen-switcher', 420, 60, 'Mélangeur vidéo', 'z-vid')
    .place('mv', 'gen-monitor', 760, 0, 'Multiviewer', 'z-vid')
    .place('pgm', 'gen-monitor', 760, 160, 'Moniteur PGM', 'z-vid')
    .link('cam1', 'SDI out', 'mix', 'SDI in 1', 30)
    .link('cam2', 'SDI out', 'mix', 'SDI in 2', 30)
    .link('cam3', 'SDI out', 'mix', 'SDI in 3', 30)
    .link('sync', 'Ref out 1', 'mix', 'Ref in', 2)
    .link('sync', 'Ref out 2', 'cam1', 'Genlock', 30)
    .link('mix', 'Multiview', 'mv', 'HDMI in', 3)
    .link('mix', 'PGM out', 'pgm', 'SDI in', 3)
    .sheet('Intercom')
    .place('base', 'gen-intercom-base', 0, 0, 'Base intercom', 'z-vid')
    .place('bp1', 'gen-intercom-beltpack', 320, 0, 'Cadreur 1', 'z-vid')
    .place('bp2', 'gen-intercom-beltpack', 320, 110, 'Cadreur 2', 'z-vid')
    .place('bp3', 'gen-intercom-beltpack', 320, 220, 'Cadreur 3', 'z-vid')
    .link('base', 'Canal 1', 'bp1', 'Ligne', 40)
    .link('base', 'Canal 1', 'bp2', 'Ligne', 40)
    .link('base', 'Canal 1', 'bp3', 'Ligne', 40)
    .build()
}

function conference(): Project {
  return builder('Salle de conférence')
    .sheet('Sonorisation et vidéoprojection', true)
    .place('hf1', 'gen-wireless-rx', 0, 0, 'Récepteur HF 1', 'z-foh')
    .place('hf2', 'gen-wireless-rx', 0, 120, 'Récepteur HF 2', 'z-foh')
    .place('pup1', 'gen-mic-cond', 0, 240, 'Micro pupitre 1', 'z-scn')
    .place('pup2', 'gen-mic-cond', 0, 340, 'Micro pupitre 2', 'z-scn')
    .place('mix', 'gen-console', 320, 0, 'Console', 'z-foh')
    .place('amp', 'gen-amp4', 640, 0, 'Amplificateur', 'z-foh')
    .place('hp1', 'gen-speaker-passive', 940, 0, 'Enceinte avant G', 'z-scn')
    .place('hp2', 'gen-speaker-passive', 940, 110, 'Enceinte avant D', 'z-scn')
    .place('cam', 'gen-camera', 320, 420, 'Caméra salle', 'z-vid')
    .place('vmix', 'gen-switcher', 640, 380, 'Sélecteur vidéo', 'z-vid')
    .place('vp', 'gen-projector', 940, 380, 'Vidéoprojecteur', 'z-scn')
    .link('hf1', 'Sortie', 'mix', 'In 1', 5)
    .link('hf2', 'Sortie', 'mix', 'In 2', 5)
    .link('pup1', 'Sortie', 'mix', 'In 3', 15)
    .link('pup2', 'Sortie', 'mix', 'In 4', 15)
    .link('mix', 'Out 1', 'amp', 'In 1', 2)
    .link('mix', 'Out 2', 'amp', 'In 2', 2)
    .link('amp', 'Out 1', 'hp1', 'Entrée', 20)
    .link('amp', 'Out 2', 'hp2', 'Entrée', 20)
    .link('cam', 'SDI out', 'vmix', 'SDI in 1', 25)
    .link('vmix', 'Multiview', 'vp', 'HDMI in', 10)
    .build()
}

export function buildTemplate(id: TemplateId, blankName: string): Project {
  switch (id) {
    case 'concert':
      return buildSampleProject()
    case 'tvStudio':
      return tvStudio()
    case 'conference':
      return conference()
    default:
      return createProject(blankName)
  }
}
