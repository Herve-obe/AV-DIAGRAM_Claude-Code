import { describe, expect, it } from 'vitest'
import * as Y from 'yjs'
import { LIBRARY_BY_ID } from '../library/generic'
import * as ops from '../model/project'
import { LAYERS } from '../model/layers'
import { checkGuestChange, guestLayers } from './access'
import { HostValidation } from './hostValidation'
import { readProject, writeProject } from './ydoc'

function setup() {
  const console = ops.addEquipment(ops.createProject('Concert'), LIBRARY_BY_ID.get('gen-console')!, { x: 0, y: 0 })
  const camera = ops.addEquipment(console.project, LIBRARY_BY_ID.get('gen-camera')!, { x: 400, y: 0 })
  const p = ops.addPort(camera.project, camera.id, { name: 'Audio in', direction: 'in', signal: 'audioAnalog', connector: 'xlr3' }).project
  return { p, consoleId: console.id, camId: camera.id }
}
describe('droits attribués par l’hôte', () => {
  it('refuse par défaut et interdit l’édition depuis le calque général, même avec tous les droits', () => {
    const { p, consoleId } = setup(), next = ops.moveEquipment(p, consoleId, { x: 1, y: 2 })
    expect(guestLayers({}, 'a').size).toBe(0)
    expect(checkGuestChange(p, next, new Set(), 'sound')).toBe(false)
    expect(checkGuestChange(p, next, new Set(LAYERS), 'all')).toBe(false)
    expect(checkGuestChange(p, next, new Set(['sound']), 'sound')).toBe(true)
  })
  it('protège l’autre domaine d’un appareil partagé et les paramètres communs', () => {
    const { p, camId } = setup(), allowed = new Set<'sound'>(['sound'])
    expect(checkGuestChange(p, ops.moveEquipment(p, camId, { x: 1, y: 2 }), allowed, 'sound')).toBe(false)
    const port = p.equipment[camId].ports.find(p => p.signal === 'audioAnalog')!
    expect(checkGuestChange(p, ops.updatePort(p, camId, port.id, { name: 'Micro' }), allowed, 'sound')).toBe(true)
    expect(checkGuestChange(p, { ...p, name: 'Autre' }, allowed, 'sound')).toBe(false)
    expect(checkGuestChange(p, ops.createProject('Autre'), new Set(LAYERS), 'sound')).toBe(false)
  })
})

describe('validation des propositions reçues sur le poste hôte', () => {
  function session() {
    const { p, consoleId, camId } = setup(), host = new Y.Doc()
    writeProject(host, null, p)
    host.getMap('claims').set('sound', { userId: 'audio', name: 'Audio', color: '#000' })
    const validator = new HostValidation(host)
    function propose(fn: (guest: Y.Doc) => void) {
      const guest = new Y.Doc()
      readProject(guest); guest.getMap('claims'); guest.getArray('chat')
      Y.applyUpdate(guest, Y.encodeStateAsUpdate(host))
      const vector = Y.encodeStateVector(host)
      fn(guest)
      const update = Y.encodeStateAsUpdate(guest, vector)
      guest.destroy()
      return update
    }
    return { host, validator, propose, consoleId, camId }
  }
  it('accepte une édition audio et la rend disponible aux autres invités', () => {
    const { host, validator, propose, consoleId } = session()
    const update = propose(g => { const p = readProject(g); writeProject(g, p, ops.moveEquipment(p, consoleId, { x: 42, y: 10 })) })
    expect(validator.apply(update, 'audio', 'sound')).toBe(true)
    expect(readProject(host).equipment[consoleId].position.x).toBe(42)
    validator.destroy(); host.destroy()
  })
  it('refuse le contournement des droits et la falsification des réservations, sans modifier le document partagé', () => {
    const { host, validator, propose, camId } = session()
    const before = readProject(host)
    const forbidden = propose(g => { const p = readProject(g); writeProject(g, p, ops.moveEquipment(p, camId, { x: 999, y: 0 })) })
    expect(validator.apply(forbidden, 'audio', 'sound')).toBe(false)
    expect(readProject(host)).toEqual(before)
    const grant = propose(g => g.getMap('claims').set('image', { userId: 'audio', name: 'A', color: '#000' }))
    expect(validator.apply(grant, 'audio', 'image')).toBe(false)
    expect(host.getMap('claims').has('image')).toBe(false)
    validator.destroy(); host.destroy()
  })
  it('refuse une identité ou une vue sans droit, puis accepte une nouvelle proposition valide après un refus', () => {
    const { host, validator, propose, consoleId } = session()
    const move = () => propose(g => { const p = readProject(g); writeProject(g, p, ops.moveEquipment(p, consoleId, { x: 20, y: 0 })) })
    expect(validator.apply(move(), 'intrus', 'sound')).toBe(false)
    expect(validator.apply(move(), 'audio', 'all')).toBe(false)
    expect(validator.apply(move(), 'audio', 'sound')).toBe(true)
    validator.destroy(); host.destroy()
  })
  it('refuse les types cachés et les mises à jour incomplètes qui attendraient un message ultérieur', () => {
    const { host, validator, propose } = session()
    expect(validator.apply(propose(g => g.getMap('hidden').set('x', 1)), 'audio', 'sound')).toBe(false)
    const attacker = new Y.Doc(), updates: Uint8Array[] = []
    attacker.on('update', u => updates.push(u))
    attacker.getMap('hidden').set('a', 1)
    attacker.getMap('hidden').set('b', 2)
    expect(validator.apply(updates[1], 'audio', 'sound')).toBe(false)
    expect(host.getMap('hidden').size).toBe(0)
    attacker.destroy(); validator.destroy(); host.destroy()
  })
})
