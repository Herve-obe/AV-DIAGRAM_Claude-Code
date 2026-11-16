// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it } from 'vitest'
import '../i18n'
import { LIBRARY_BY_ID } from '../library/generic'
import { addEquipment, addPort, connect, createProject } from '../model/project'
import { useProject } from '../store/projectStore'
import { useUi } from '../store/uiStore'
import { useCollab } from '../collab/session'
import { NetworkView } from './DeploymentViews'
import { Inspector } from './Inspector'
import { PortEditor } from './PortEditor'
it('ajoute une prise vidéo en Expert avec le profil Image', () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  const camera = addEquipment(createProject('Image'), LIBRARY_BY_ID.get('gen-camera')!, { x: 0, y: 0 })
  useProject.setState({ project: camera.project })
  useCollab.setState({ status: 'connected', role: 'guest', started: true, userId: 'image', claims: { image: [{ userId: 'image', name: 'Vidéo', color: '#000' }] } })
  useUi.setState({ layer: 'image' })
  const element = document.createElement('div'); document.body.append(element); const root = createRoot(element)
  try {
    act(() => root.render(<PortEditor eq={camera.project.equipment[camera.id]} />))
    act(() => [...element.querySelectorAll('button')].find(b => b.textContent?.includes('Ajouter un port'))!.click())
    const ports = useProject.getState().project.equipment[camera.id].ports
    expect(ports).toHaveLength(camera.project.equipment[camera.id].ports.length + 1)
    expect(ports.at(-1)?.signal).toBe('video')
  } finally { act(() => root.unmount()); element.remove(); useCollab.setState({ status: 'off' }) }
})

it('grise les propriétés caméra et son port vidéo sans bloquer son port Audio', () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  const camera = addEquipment(createProject('Caméra mixte'), LIBRARY_BY_ID.get('gen-camera')!, { x: 0, y: 0 })
  const added = addPort(camera.project, camera.id, { name: 'Audio reportage', direction: 'in', signal: 'audioAnalog', connector: 'xlr3' })
  const eq = added.project.equipment[camera.id], audio = eq.ports.find(p => p.id === added.id)!, video = eq.ports.find(p => p.signal === 'video')!
  useProject.setState({ project: added.project })
  useCollab.setState({ status: 'connected', role: 'guest', started: true, userId: 'audio', claims: { sound: [{ userId: 'audio', name: 'Audio', color: '#000' }] } })
  useUi.setState({ layer: 'sound', mode: 'expert', selectedEquipment: [camera.id], selectedLinks: [] })
  const element = document.createElement('div'); document.body.append(element); const root = createRoot(element)
  try {
    act(() => root.render(<Inspector />))
    expect(element.querySelector('#eq-name')!.matches(':disabled')).toBe(true)
    act(() => [...element.querySelectorAll<HTMLButtonElement>('.port-row')].find(b => b.textContent?.includes(audio.name))!.click())
    const input = document.getElementById(`port-${eq.id}-${audio.id}-name`) as HTMLInputElement
    expect(input.matches(':disabled')).toBe(false)
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, 'Micro scène')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    act(() => input.dispatchEvent(new FocusEvent('focusout', { bubbles: true })))
    expect(useProject.getState().project.equipment[eq.id].ports.find(p => p.id === audio.id)?.name).toBe('Micro scène')
    act(() => [...element.querySelectorAll<HTMLButtonElement>('.port-row')].find(b => b.textContent?.includes(video.name))!.click())
    expect(document.getElementById(`port-${eq.id}-${video.id}-name`)!.matches(':disabled')).toBe(true)
  } finally { act(() => root.unmount()); element.remove(); useCollab.setState({ status: 'off' }) }
})

it('la vue Réseau permet l’IP de sa console Audio et ouvre les ports du switch inclus', () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  const desk = addEquipment(createProject('Interfaces'), LIBRARY_BY_ID.get('gen-console')!, { x: 0, y: 0 })
  const added = addPort(desk.project, desk.id, { name: 'Gestion locale', signal: 'network', direction: 'bidir', connector: 'rj45' })
  const sw = addEquipment(added.project, LIBRARY_BY_ID.get('gen-switch8')!, { x: 400, y: 0 })
  useProject.setState({ project: sw.project })
  useUi.setState({ layer: 'network', mode: 'expert' })
  useCollab.setState({ status: 'connected', role: 'guest', started: true, userId: 'audio', claims: { sound: [{ userId: 'audio', name: 'Audio', color: '#000' }] } })
  const element = document.createElement('div'); document.body.append(element); const root = createRoot(element)
  try {
    act(() => root.render(<NetworkView />))
    const inputs = [...element.querySelectorAll<HTMLInputElement>('input[aria-label$="IPv4"]')]
    const own = inputs.find(i => i.getAttribute('aria-label')!.includes('Gestion locale'))!
    expect(own.disabled).toBe(false)
    const infra = inputs.find(i => i.getAttribute('aria-label')!.includes(sw.project.equipment[sw.id].name))!
    expect(infra.disabled).toBe(false)
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(own, '192.168.1.51')
      own.dispatchEvent(new Event('input', { bubbles: true }))
    })
    act(() => own.dispatchEvent(new FocusEvent('focusout', { bubbles: true })))
    expect(useProject.getState().project.equipment[desk.id].ports.find(p => p.id === added.id)?.network?.address).toBe('192.168.1.51')
  } finally { act(() => root.unmount()); element.remove(); useCollab.setState({ status: 'off' }) }
})

it('nomme la caméra et sa prise protégées dans le refus de liaison, sans accuser la console Audio accessible', () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  const desk = addEquipment(createProject('Liaison protégée'), LIBRARY_BY_ID.get('gen-console')!, { x: 0, y: 0 })
  const camera = addEquipment(desk.project, LIBRARY_BY_ID.get('gen-camera')!, { x: 400, y: 0 })
  const added = addPort(camera.project, camera.id, { name: 'Vidéo IP protégée', direction: 'bidir', signal: 'videoIp', connector: 'rj45' })
  const audio = added.project.equipment[desk.id].ports.find(p => p.signal === 'audioIp')!
  const linked = connect(added.project, { equipmentId: desk.id, portId: audio.id }, { equipmentId: camera.id, portId: added.id! })
  useProject.setState({ project: linked.project })
  useUi.setState({ layer: 'network', mode: 'expert', selectedEquipment: [], selectedLinks: [linked.id!] })
  useCollab.setState({ status: 'connected', started: true, role: 'guest', userId: 'audio', claims: { sound: [{ userId: 'audio', name: 'Audio', color: '#000' }] } })
  const element = document.createElement('div'); document.body.append(element); const root = createRoot(element)
  try {
    act(() => root.render(<Inspector />))
    const fields = element.querySelector<HTMLFieldSetElement>('fieldset')!
    expect(fields.disabled).toBe(true)
    expect(element.querySelector('#lk-length')!.matches(':disabled')).toBe(true)
    expect(fields.title).toContain(added.project.equipment[camera.id].name)
    expect(fields.title).toContain('Vidéo IP protégée')
    expect(fields.title).not.toContain(added.project.equipment[desk.id].name)
  } finally { act(() => root.unmount()); element.remove(); useCollab.setState({ status: 'off' }) }
})
