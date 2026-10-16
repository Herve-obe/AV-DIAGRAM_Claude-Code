import { describe, expect, it } from 'vitest'
import { LIBRARY_BY_ID } from '../library/generic'
import * as ops from '../model/project'
import type { Project } from '../model/types'
import { checkChange, fullyLocked, lockedLayers, type Claims } from './protection'

/** Projet : une console (Audio) et une caméra (Image) qui a aussi une entrée audio. */
function setup() {
  let p: Project = ops.createProject('Essai')
  const c = ops.addEquipment(p, LIBRARY_BY_ID.get('gen-console')!, { x: 0, y: 0 })
  p = c.project
  const cam = ops.addEquipment(p, LIBRARY_BY_ID.get('gen-camera')!, { x: 400, y: 0 })
  p = cam.project
  p = ops.addPort(p, cam.id, { name: 'Audio in 1', direction: 'in', signal: 'audioAnalog', connector: 'xlr3' }).project
  const sw = ops.addEquipment(p, LIBRARY_BY_ID.get('gen-switcher')!, { x: 800, y: 0 })
  p = sw.project
  return { p, consoleId: c.id, camId: cam.id, switcherId: sw.id }
}

const claims: Claims = { image: { userId: 'video', name: 'Vidéo', color: '#000' } }

describe('collaboration : calques réservés', () => {
  it('calques réservés par les autres seulement', () => {
    expect([...lockedLayers(claims, 'audio')]).toEqual(['image'])
    expect(lockedLayers(claims, 'video').size).toBe(0)
  })

  it('équipement entièrement dans un calque réservé : aucune modification', () => {
    const { p, switcherId } = setup()
    const locked = lockedLayers(claims, 'audio')
    expect(fullyLocked(p.equipment[switcherId], locked)).toBeNull() // le mélangeur a un port réseau
    const moved = ops.moveEquipment(p, switcherId, { x: 900, y: 50 })
    expect(checkChange(p, moved, locked)).toBeNull()
    const mon = ops.addEquipment(p, LIBRARY_BY_ID.get('gen-monitor')!, { x: 0, y: 300 })
    // Ajout d'un moniteur (Image) par la personne de l'audio : refusé
    expect(checkChange(p, mon.project, locked)).toMatchObject({ kind: 'equipment', layer: 'image' })
    // Le propriétaire du calque, lui, peut l'ajouter puis le déplacer ; l'audio ne peut pas le déplacer
    const q = mon.project
    expect(checkChange(q, ops.moveEquipment(q, mon.id, { x: 10, y: 300 }), locked)).toMatchObject({ id: mon.id })
  })

  it('équipement partagé : disposition libre, ports et réglages de l\'autre calque protégés', () => {
    const { p, camId } = setup()
    const locked = lockedLayers(claims, 'audio')
    const cam = p.equipment[camId]
    expect(checkChange(p, ops.moveEquipment(p, camId, { x: 420, y: 10 }), locked)).toBeNull()
    expect(checkChange(p, ops.rotateEquipment(p, [camId], 1), locked)).toBeNull()
    // Renommer la caméra : réglage du calque Image
    expect(checkChange(p, ops.updateEquipment(p, camId, { name: 'CAM 9' }), locked)).toMatchObject({ layer: 'image' })
    // Modifier son entrée audio : permis ; modifier sa sortie SDI : refusé
    const audioPort = cam.ports.find((x) => x.signal === 'audioAnalog')!
    const sdi = cam.ports.find((x) => x.signal === 'video')!
    expect(checkChange(p, ops.updatePort(p, camId, audioPort.id, { name: 'Micro reportage' }), locked)).toBeNull()
    expect(checkChange(p, ops.updatePort(p, camId, sdi.id, { name: 'SDI A' }), locked)).toMatchObject({ layer: 'image' })
    // Suppression : refusée (elle effacerait le travail de l'autre calque)
    expect(checkChange(p, ops.removeElements(p, [camId], []), locked)).toMatchObject({ kind: 'equipment' })
  })

  it('liaisons : celles du calque réservé sont protégées, les autres libres', () => {
    const { p, consoleId, camId, switcherId } = setup()
    const locked = lockedLayers(claims, 'audio')
    const cam = p.equipment[camId]
    const con = p.equipment[consoleId]
    const sw = p.equipment[switcherId]
    // Liaison audio caméra <- console : permise pour l'audio
    const out = con.ports.find((x) => x.direction === 'out' && x.signal === 'audioAnalog')!
    const aIn = cam.ports.find((x) => x.signal === 'audioAnalog')!
    const audio = ops.connect(p, { equipmentId: consoleId, portId: out.id }, { equipmentId: camId, portId: aIn.id })
    expect(audio.id).toBeTruthy()
    expect(checkChange(p, audio.project, locked)).toBeNull()
    // Liaison vidéo caméra -> mélangeur : refusée
    const sdi = cam.ports.find((x) => x.signal === 'video')!
    const swIn = sw.ports.find((x) => x.direction === 'in' && x.signal === 'video')!
    const video = ops.connect(p, { equipmentId: camId, portId: sdi.id }, { equipmentId: switcherId, portId: swIn.id })
    expect(checkChange(p, video.project, locked)).toMatchObject({ kind: 'link', layer: 'image' })
  })

  it('sans réservation, tout est permis', () => {
    const { p, switcherId } = setup()
    expect(checkChange(p, ops.removeElements(p, [switcherId], []), new Set())).toBeNull()
  })
})
