import { describe, expect, it } from 'vitest'
import * as Y from 'yjs'
import { LIBRARY_BY_ID } from '../library/generic'
import * as ops from '../model/project'
import { LAYERS } from '../model/layers'
import { checkGuestChange, guestChangeReason, guestLayers, canEditPort, initialPort } from './access'
import { HostValidation } from './hostValidation'
import { createUndoManager, readProject, writeProject } from './ydoc'

function setup() {
  const console = ops.addEquipment(ops.createProject('Concert'), LIBRARY_BY_ID.get('gen-console')!, { x: 0, y: 0 })
  const camera = ops.addEquipment(console.project, LIBRARY_BY_ID.get('gen-camera')!, { x: 400, y: 0 })
  const p = ops.addPort(camera.project, camera.id, { name: 'Audio in', direction: 'in', signal: 'audioAnalog', connector: 'xlr3' }).project
  return { p, consoleId: console.id, camId: camera.id }
}
describe('droits attribués par l’hôte', () => {
  it('autorise plusieurs invités sur un calque et plusieurs calques pour le même invité', () => {
    const audio = { userId: 'audio', name: 'Audio', color: '#000' }
    const video = { userId: 'video', name: 'Vidéo', color: '#111' }
    const claims = { sound: [audio, video], image: [audio] }
    expect([...guestLayers(claims, 'audio')]).toEqual(['sound', 'image'])
    expect([...guestLayers(claims, 'video')]).toEqual(['sound'])
    expect(guestLayers(claims, 'intrus').size).toBe(0)
    expect([...guestLayers({ sound: audio }, 'audio')]).toEqual(['sound'])
  })
  it('réserve la présentation mémorisée des prises au propriétaire du domaine principal', () => {
    const { p, camId, consoleId } = setup()
    const camera = ops.updateEquipment(p, camId, { portsExpanded: false })
    expect(checkGuestChange(p, camera, new Set(['image']), 'image')).toBe(true)
    expect(checkGuestChange(p, camera, new Set(['sound']), 'sound')).toBe(false)
    expect(checkGuestChange(p, camera, new Set(LAYERS), 'all')).toBe(false)
    expect(checkGuestChange(p, ops.updateEquipment(p, consoleId, { portsExpanded: true }), new Set(['sound']), 'sound')).toBe(true)
  })
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
  it('interdit de changer le domaine d’un appareil ou de raccorder un port d’un autre calque', () => {
    const { p, consoleId, camId } = setup(), allowed = new Set<'sound'>(['sound'])
    const changed = { ...p, equipment: { ...p.equipment, [consoleId]: { ...p.equipment[consoleId], family: p.equipment[camId].family } } }
    expect(checkGuestChange(p, changed, allowed, 'sound')).toBe(false)
    const out = p.equipment[consoleId].ports.find(p => p.signal === 'audioAnalog' && p.direction === 'out')!
    const video = p.equipment[camId].ports.find(p => p.signal === 'video')!
    const wired = ops.connect(p, { equipmentId: consoleId, portId: out.id }, { equipmentId: camId, portId: video.id }).project
    expect(checkGuestChange(p, wired, allowed, 'sound')).toBe(false)
  })
  it('ne prend pas les équipements et liaisons audio inchangés d’un instantané réseau pour des éditions vidéo', () => {
    const { p, consoleId, camId } = setup()
    const audioOut = p.equipment[consoleId].ports.find(port => port.signal === 'audioAnalog' && port.direction === 'out')!
    const audioIn = p.equipment[camId].ports.find(port => port.signal === 'audioAnalog')!
    const wired = ops.connect(p, { equipmentId: consoleId, portId: audioOut.id }, { equipmentId: camId, portId: audioIn.id }).project
    const decoded = JSON.parse(JSON.stringify(wired), (_key, value) => value && typeof value === 'object' && !Array.isArray(value)
      ? Object.fromEntries(Object.entries(value).reverse()) : value)
    const videoId = wired.equipment[camId].ports.find(port => port.signal === 'video')!.id
    const next = ops.updatePort(decoded, camId, videoId, { name: 'SDI modifiée' })
    expect(checkGuestChange(wired, next, new Set(['image']), 'image')).toBe(true)
    const forbidden = ops.updatePort(next, camId, audioIn.id, { name: 'Audio interdit' })
    expect(checkGuestChange(wired, forbidden, new Set(['image']), 'image')).toBe(false)
  })
  it('protège aussi l’ordre des ports des autres calques', () => {
    const { p, camId } = setup()
    const reversed = ops.updateEquipment(p, camId, { ports: [...p.equipment[camId].ports].reverse() })
    expect(checkGuestChange(p, reversed, new Set(['sound']), 'sound')).toBe(false)
    const own = ops.addPort(p, camId, { name: 'Autre audio', direction: 'in', signal: 'audioAnalog', connector: 'xlr3' }).project
    const camera = own.equipment[camId]
    const ports = [...camera.ports]
    ;[ports[ports.length - 1], ports[ports.length - 2]] = [ports[ports.length - 2], ports[ports.length - 1]]
    expect(checkGuestChange(own, ops.updateEquipment(own, camId, { ports }), new Set(['sound']), 'sound')).toBe(true)
  })
})

describe('validation des propositions reçues sur le poste hôte', () => {
  it.each(['audio', 'video'] as const)('conserve deux éditions simultanées des ports d’une caméra, %s reçu en premier', first => {
    const { p, camId } = setup(), host = new Y.Doc()
    host.clientID = 10
    writeProject(host, null, p)
    host.getMap('claims').set('sound', { userId: 'audio', name: 'Audio', color: '#000' })
    host.getMap('claims').set('image', { userId: 'video', name: 'Vidéo', color: '#111' })
    const audio = new Y.Doc(), video = new Y.Doc()
    audio.clientID = 20; video.clientID = 30
    for (const guest of [audio, video]) Y.applyUpdate(guest, Y.encodeStateAsUpdate(host))
    const undo = createUndoManager(audio, 'local')
    const snapshot = Y.encodeStateVector(host)
    const audioPort = p.equipment[camId].ports.find(port => port.signal === 'audioAnalog')!
    const videoPort = p.equipment[camId].ports.find(port => port.signal === 'video')!
    expect(checkGuestChange(p, ops.updatePort(p, camId, videoPort.id, { name: 'SDI scène' }), new Set(['image']), 'image')).toBe(true)
    writeProject(audio, p, ops.updatePort(p, camId, audioPort.id, { name: 'Micro reportage' }), 'local')
    writeProject(video, p, ops.updatePort(p, camId, videoPort.id, { name: 'SDI scène' }), 'local')
    const validator = new HostValidation(host)
    const updates = {
      audio: Y.encodeStateAsUpdate(audio, snapshot), video: Y.encodeStateAsUpdate(video, snapshot),
    }
    try {
      for (const user of first === 'audio' ? ['audio', 'video'] as const : ['video', 'audio'] as const) {
        expect(validator.apply(updates[user], user, user === 'audio' ? 'sound' : 'image'), user).toBe(true)
      }
      const result = readProject(host).equipment[camId].ports
      expect(result.find(port => port.id === audioPort.id)?.name).toBe('Micro reportage')
      expect(result.find(port => port.id === videoPort.id)?.name).toBe('SDI scène')
      Y.applyUpdate(audio, Y.encodeStateAsUpdate(host), 'network')
      const beforeUndo = Y.encodeStateVector(host)
      undo.undo()
      expect(validator.apply(Y.encodeStateAsUpdate(audio, beforeUndo), 'audio', 'sound')).toBe(true)
      expect(readProject(host).equipment[camId].ports.find(port => port.id === audioPort.id)?.name).toBe(audioPort.name)
      expect(typeof readProject(host).updatedAt).toBe('string')
    } finally { undo.destroy(); validator.destroy(); host.destroy(); audio.destroy(); video.destroy() }
  })

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
    expect(validator.apply(forbidden, 'audio', 'network')).toBe(false)
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
  it('refuse de falsifier les listes de membres, y compris avec une édition autorisée', () => {
    const { host, validator, propose, consoleId } = session()
    const member = { userId: 'audio', name: 'Audio', color: '#000' }
    host.getMap('claims').set('sound', [member, { ...member, userId: 'other' }])
    const before = readProject(host)
    const forged = propose(g => {
      const p = readProject(g)
      writeProject(g, p, ops.moveEquipment(p, consoleId, { x: 88, y: 0 }))
      g.getMap('claims').set('sound', [member])
    })
    expect(validator.apply(forged, 'audio', 'sound')).toBe(false)
    expect(readProject(host)).toEqual(before)
    expect(host.getMap('claims').get('sound')).toHaveLength(2)
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
  it('bloque les éditions dans la salle d’attente et interdit à un invité de commencer la session', () => {
    const { host, validator, propose, consoleId } = session()
    host.getMap('session').set('started', false)
    const before = readProject(host)
    const move = () => propose(g => { const p = readProject(g); writeProject(g, p, ops.moveEquipment(p, consoleId, { x: 42, y: 0 })) })
    expect(validator.apply(move(), 'audio', 'sound')).toBe(false)
    expect(readProject(host)).toEqual(before)
    expect(validator.apply(propose(g => g.getMap('session').set('started', true)), 'audio', 'sound')).toBe(false)
    expect(host.getMap('session').get('started')).toBe(false)
    host.getMap('session').set('started', true)
    expect(validator.apply(move(), 'audio', 'sound')).toBe(true)
    expect(readProject(host).equipment[consoleId].position.x).toBe(42)
    validator.destroy(); host.destroy()
  })
})

describe('profils métiers indépendants des filtres', () => {
  it('supprime un appareil Audio mixte non relié malgré son port réseau libre', () => {
    const base = ops.createProject('HF'), rx = ops.addEquipment(base, LIBRARY_BY_ID.get('gen-wireless-rx')!, { x: 0, y: 0 })
    expect(checkGuestChange(rx.project, ops.removeElements(rx.project, [rx.id], []), new Set(['sound']), 'sound')).toBe(true)
  })
  it('raccorde la console Dante à un port libre du switch depuis Audio ou Réseau avec le seul profil Audio', () => {
    const desk = ops.addEquipment(ops.createProject('Dante'), LIBRARY_BY_ID.get('gen-console')!, { x: 0, y: 0 })
    const sw = ops.addEquipment(desk.project, LIBRARY_BY_ID.get('gen-switch8')!, { x: 200, y: 0 })
    const a = sw.project.equipment[desk.id].ports.find(p => p.signal === 'audioIp')!, b = sw.project.equipment[sw.id].ports[0]
    const next = ops.connect(sw.project, { equipmentId: desk.id, portId: a.id }, { equipmentId: sw.id, portId: b.id }).project
    expect(checkGuestChange(sw.project, next, new Set(['sound']), 'sound')).toBe(true)
    expect(checkGuestChange(sw.project, next, new Set(['sound']), 'network')).toBe(true)
  })
})

describe('protection des métiers et de l’infrastructure', () => {
  const sound = new Set<'sound'>(['sound'])
  function networkSetup() {
    const { p, consoleId, camId } = setup()
    const net = ops.addPort(p, consoleId, { name: 'Gestion', direction: 'bidir', signal: 'network', connector: 'rj45' })
    const power = ops.addPort(net.project, consoleId, { name: 'Alimentation', direction: 'in', signal: 'power', connector: 'iec-c13' })
    const sw = ops.addEquipment(power.project, LIBRARY_BY_ID.get('gen-switch8')!, { x: 700, y: 0 })
    return { p: sw.project, consoleId, camId, swId: sw.id, netId: net.id!, powerId: power.id! }
  }
  it('édite les interfaces techniques de ses appareils depuis Réseau sans droit Réseau global', () => {
    const { p, consoleId, camId, swId, netId, powerId } = networkSetup()
    for (const id of [netId, powerId]) expect(checkGuestChange(p, ops.updatePort(p, consoleId, id, { name: 'Interface scène' }), sound, 'network')).toBe(true)
    expect(checkGuestChange(p, ops.updatePort(p, consoleId, netId, { network: { address: '192.168.1.10', prefix: 24 } }), sound, 'network')).toBe(true)
    const sync = p.equipment[consoleId].ports.find(p => p.signal === 'sync')!
    expect(checkGuestChange(p, ops.updatePort(p, consoleId, sync.id, { clock: { protocol: 'Word clock', domain: '0', role: 'master' } }), sound, 'network')).toBe(true)
    const swPort = p.equipment[swId].ports[0]
    expect(checkGuestChange(p, ops.updatePort(p, swId, swPort.id, { network: { vlan: 22 } }), sound, 'network')).toBe(false)
    expect(checkGuestChange(p, ops.updateEquipment(p, swId, { name: 'Switch modifié' }), sound, 'network')).toBe(false)
    expect(checkGuestChange(p, ops.updatePort(p, swId, swPort.id, { network: { vlan: 22 } }), new Set(['network']), 'sound')).toBe(true)
    const cameraNet = ops.addPort(p, camId, { name: 'Gestion caméra', direction: 'bidir', signal: 'network', connector: 'rj45' })
    expect(checkGuestChange(cameraNet.project, ops.updatePort(cameraNet.project, camId, cameraNet.id!, { name: 'Interdit' }), sound, 'network')).toBe(false)
  })
  it('autorise Sound et Image simultanément, mais ne laisse pas convertir un port Audio en vidéo sans profil Image', () => {
    const { p, consoleId, camId } = networkSetup(), video = p.equipment[camId].ports.find(p => p.signal === 'video')!, audio = p.equipment[consoleId].ports[0]
    const both = ops.updatePort(ops.updatePort(p, camId, video.id, { name: 'Vidéo scène' }), consoleId, audio.id, { name: 'Micro scène' })
    expect(checkGuestChange(p, both, new Set(['sound', 'image']), 'network')).toBe(true)
    expect(checkGuestChange(p, both, sound, 'network')).toBe(false)
    expect(checkGuestChange(p, ops.updatePort(p, consoleId, audio.id, { signal: 'video' }), sound, 'sound')).toBe(false)
    expect(checkGuestChange(p, ops.updatePort(p, consoleId, audio.id, { connector: 'jack-trs', level: 'line+4' }), sound, 'network')).toBe(true)
    expect(checkGuestChange(p, ops.updateEquipment(p, consoleId, { family: 'camera' }), sound, 'sound')).toBe(false)
    expect(canEditPort(p.equipment[consoleId], audio, new Set(['network']))).toBe(false)
  })
  it('refuse atomiquement suppression mixte avec liaison étrangère et remplacement d’une liaison protégée sur un switch', () => {
    const { p, consoleId, camId, swId } = networkSetup()
    const video = ops.addPort(p, consoleId, { name: 'Vidéo embarquée', direction: 'out', signal: 'video', connector: 'bnc' })
    const camPort = video.project.equipment[camId].ports.find(p => p.signal === 'video')!
    const linked = ops.connect(video.project, { equipmentId: consoleId, portId: video.id! }, { equipmentId: camId, portId: camPort.id })
    expect(guestChangeReason(linked.project, ops.removeElements(linked.project, [consoleId], []), sound, 'sound')?.code).toBe('link')
    expect(checkGuestChange(video.project, ops.removeElements(video.project, [consoleId], []), sound, 'sound')).toBe(true)
    const forgedDelete = { ...linked.project, equipment: Object.fromEntries(Object.entries(linked.project.equipment).filter(([id]) => id !== consoleId)) }
    expect(checkGuestChange(linked.project, forgedDelete, sound, 'sound')).toBe(false)
    const videoIp = ops.addPort(p, camId, { name: 'Vidéo IP', direction: 'bidir', signal: 'videoIp', connector: 'rj45' })
    const slot = videoIp.project.equipment[swId].ports[0], desk = videoIp.project.equipment[consoleId].ports.find(p => p.signal === 'audioIp')!
    const protectedLink = ops.connect(videoIp.project, { equipmentId: camId, portId: videoIp.id! }, { equipmentId: swId, portId: slot.id })
    const occupied = ops.connect(protectedLink.project, { equipmentId: consoleId, portId: desk.id }, { equipmentId: swId, portId: slot.id })
    expect(guestChangeReason(protectedLink.project, occupied.project, sound, 'sound')?.code).toBe('busy')
    const removed = ops.removeElements(protectedLink.project, [], [protectedLink.id!])
    const replacement = ops.connect(removed, { equipmentId: consoleId, portId: desk.id }, { equipmentId: swId, portId: slot.id })
    expect(checkGuestChange(protectedLink.project, replacement.project, sound, 'sound')).toBe(false)
    const sameId = { ...replacement.project, links: { [protectedLink.id!]: { ...replacement.project.links[replacement.id!], id: protectedLink.id! } } }
    expect(checkGuestChange(protectedLink.project, sameId, sound, 'sound')).toBe(false)
  })
  it('choisit un port initial autorisé et refuse même une mutation d’horodatage sans aucun profil', () => {
    const { p, consoleId, camId, swId } = networkSetup()
    expect(initialPort(p.equipment[consoleId], sound, 'network')?.signal).toBe('network')
    expect(initialPort(p.equipment[camId], new Set(['image']), 'image')?.signal).toBe('video')
    expect(initialPort(p.equipment[swId], sound, 'network')).toBeNull()
    expect(checkGuestChange(p, { ...p, updatedAt: '2030-01-01T00:00:00Z' }, new Set(), 'sound')).toBe(false)
    expect(checkGuestChange(p, p, new Set(), 'all')).toBe(true)
    expect(checkGuestChange(p, { ...p, name: 'Nom commun' }, new Set(['sound', 'image']), 'sound')).toBe(false)
  })
})
