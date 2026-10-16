// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import '../i18n'
import { useCollab, type Participant } from '../collab/session'
import { CollabDialog } from './CollabDialog'
import { CollabSessionBar } from './CollabSessionBar'

const actions = vi.hoisted(() => ({ discover: vi.fn(), host: vi.fn(), join: vi.fn(), begin: vi.fn(), assign: vi.fn(), leave: vi.fn() }))
vi.mock('../collab/discovery', () => ({ discoverSessions: actions.discover }))
vi.mock('../collab/session', async importOriginal => ({
  ...await importOriginal<typeof import('../collab/session')>(),
  canHost: () => true, hostSession: actions.host, joinSession: actions.join, beginSession: actions.begin, assignLayer: actions.assign, leave: actions.leave,
}))

const person = (id: number, name: string, self = false): Participant => ({ clientId: id, peerId: id, userId: `user-${id}`, name, self, color: '#333', selection: [], backup: false })
const owner = person(1, 'Régie', true), guest = person(2, 'Son')
const hosting = { status: 'connected' as const, role: 'host' as const, started: false, participants: [owner], host: { port: 4455, code: '123456', hostToken: 'private', addresses: ['192.168.1.2:4455'], peers: [] } }

describe('parcours de session collaborative', () => {
  let element: HTMLDivElement, root: Root
  const draw = (bar = false) => act(() => root.render(bar ? <CollabSessionBar /> : <CollabDialog />))
  const click = (text: string, role?: string) => act(() => {
    const button = [...element.querySelectorAll('button')].find(b => b.textContent === text && (role ? b.getAttribute('role') === role : b.getAttribute('role') !== 'tab'))
    expect(button).toBeDefined(); button!.click()
  })
  const input = (id: string, value: string) => act(() => {
    const field = element.querySelector<HTMLInputElement>(`#${id}`)!
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(field, value)
    field.dispatchEvent(new Event('input', { bubbles: true }))
  })
  beforeEach(() => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
    vi.resetAllMocks()
    actions.discover.mockResolvedValue([])
    useCollab.setState({ dialogOpen: true, status: 'off', started: false, role: null, name: 'Régie', participants: [], host: null, claims: {}, resumable: null, error: null, relayRank: null })
    element = document.createElement('div'); document.body.append(element); root = createRoot(element)
  })
  afterEach(() => { act(() => root.unmount()); element.remove() })

  it('montre la salle d’attente et explique pourquoi les rôles ne sont pas encore disponibles', () => {
    useCollab.setState(hosting); draw()
    expect(element.textContent).toContain('En attente d’invités')
    expect(element.textContent).toContain('Tu pourras alors leur attribuer les calques')
    expect(element.querySelector('select')).toBeNull()
    actions.begin.mockReturnValue(true)
    click('Commencer la session')
    expect(actions.begin).toHaveBeenCalledOnce()
    expect(useCollab.getState().dialogOpen).toBe(false)
  })
  it('propose les invités connectés pour attribuer chaque calque', () => {
    useCollab.setState({ ...hosting, participants: [owner, guest] }); draw()
    expect(element.querySelectorAll('select')).toHaveLength(5)
    const select = element.querySelector('select')!
    expect([...select.options].map(o => o.textContent)).toContain('Son')
    act(() => { select.value = 'user-2'; select.dispatchEvent(new Event('change', { bubbles: true })) })
    expect(actions.assign).toHaveBeenCalledWith('sound', 2)
  })
  it('permet de retirer un calque attribué à un invité déconnecté', () => {
    useCollab.setState({ ...hosting, started: true, claims: { sound: { peerId: 2, userId: 'user-2', name: 'Son', color: '#333' } } }); draw()
    const select = element.querySelector('select')!
    expect(select.value).toBe('user-2')
    act(() => { select.value = ''; select.dispatchEvent(new Event('change', { bubbles: true })) })
    expect(actions.assign).toHaveBeenCalledWith('sound', null)
  })
  it('cherche les hôtes automatiquement et rejoint la sélection sans saisie d’IP', async () => {
    actions.discover.mockResolvedValue([{ id: 'concert', address: '192.168.1.2:4455', sessionName: 'Concert', hostName: 'Régie' }])
    draw()
    await act(async () => click('Rejoindre', 'tab'))
    expect(actions.discover).toHaveBeenCalledOnce()
    expect(element.textContent).toContain('Concert')
    expect(element.querySelector('#collab-address')?.closest('details')?.open).toBe(false)
    expect(element.querySelector<HTMLInputElement>('input[type="radio"]')!.checked).toBe(true)
    input('collab-code', '123456')
    await act(async () => click('Rejoindre'))
    expect(actions.join).toHaveBeenCalledWith('192.168.1.2:4455', '123456')
  })
  it('explique ce qui manque pour rejoindre sans choisir parmi plusieurs hôtes à la place de l’invité', async () => {
    useCollab.setState({ name: '' })
    actions.discover.mockResolvedValue([
      { id: 'concert', address: '192.168.1.2:4455', sessionName: 'Concert', hostName: 'Régie' },
      { id: 'studio', address: '192.168.1.3:4455', sessionName: 'Studio', hostName: 'Studio' },
    ])
    draw(); await act(async () => click('Rejoindre', 'tab'))
    const button = element.querySelector<HTMLButtonElement>('.collab-action')!
    const requirement = () => element.querySelector('#collab-join-requirement')?.textContent
    expect(button.disabled).toBe(true)
    expect(requirement()).toBe('Renseigne ton nom pour rejoindre la session.')
    input('collab-name', '   ')
    expect(button.disabled).toBe(true)
    input('collab-name', 'Régie son')
    expect(requirement()).toBe('Sélectionne une session dans la liste ou saisis une adresse dans les options avancées.')
    expect([...element.querySelectorAll<HTMLInputElement>('input[type="radio"]')].every(r => !r.checked)).toBe(true)
    act(() => element.querySelectorAll<HTMLInputElement>('input[type="radio"]')[1].click())
    expect(requirement()).toBe('Saisis les 6 chiffres du code communiqué par l’hôte.')
    input('collab-code', '01234')
    expect(button.disabled).toBe(true)
    input('collab-code', '012345')
    expect(button.disabled).toBe(false)
    expect(requirement()).toBeUndefined()
    await act(async () => click('Rejoindre'))
    expect(actions.join).toHaveBeenCalledWith('192.168.1.3:4455', '012345')
  })
  it('garde la saisie manuelle prioritaire même lorsqu’un seul hôte est découvert', async () => {
    actions.discover.mockResolvedValue([{ id: 'concert', address: '192.168.1.2:4455', sessionName: 'Concert', hostName: 'Régie' }])
    draw(); await act(async () => click('Rejoindre', 'tab'))
    input('collab-address', '192.168.1.8:4455'); input('collab-code', '654321')
    await act(async () => click('Actualiser'))
    expect(element.querySelector<HTMLInputElement>('input[type="radio"]')!.checked).toBe(false)
    await act(async () => click('Rejoindre'))
    expect(actions.join).toHaveBeenCalledWith('192.168.1.8:4455', '654321')
  })
  it('conserve l’hôte présélectionné pendant les actualisations sans le remplacer s’il disparaît', async () => {
    const concert = { id: 'concert', address: '192.168.1.2:4455', sessionName: 'Concert', hostName: 'Régie' }
    const studio = { id: 'studio', address: '192.168.1.3:4455', sessionName: 'Studio', hostName: 'Studio' }
    actions.discover.mockResolvedValueOnce([concert]).mockResolvedValueOnce([studio, concert]).mockResolvedValueOnce([studio])
    draw(); await act(async () => click('Rejoindre', 'tab'))
    input('collab-code', '123456')
    await act(async () => click('Actualiser'))
    expect(element.querySelectorAll<HTMLInputElement>('input[type="radio"]')[1].checked).toBe(true)
    expect(element.querySelector<HTMLButtonElement>('.collab-action')!.disabled).toBe(false)
    await act(async () => click('Actualiser'))
    expect(element.querySelector<HTMLInputElement>('input[type="radio"]')!.checked).toBe(false)
    expect(element.querySelector<HTMLButtonElement>('.collab-action')!.disabled).toBe(true)
  })
  it('ne remplace pas une sélection explicite par un autre hôte après actualisation', async () => {
    const concert = { id: 'concert', address: '192.168.1.2:4455', sessionName: 'Concert', hostName: 'Régie' }
    const studio = { id: 'studio', address: '192.168.1.3:4455', sessionName: 'Studio', hostName: 'Studio' }
    actions.discover.mockResolvedValueOnce([concert, studio]).mockResolvedValueOnce([studio])
    draw(); await act(async () => click('Rejoindre', 'tab'))
    act(() => element.querySelector<HTMLInputElement>('input[type="radio"]')!.click())
    input('collab-code', '123456')
    await act(async () => click('Actualiser'))
    expect(element.querySelector<HTMLInputElement>('input[type="radio"]')!.checked).toBe(false)
    expect(element.querySelector<HTMLButtonElement>('.collab-action')!.disabled).toBe(true)
    expect(element.querySelector('#collab-join-requirement')?.textContent).toContain('Sélectionne une session')
    expect(actions.join).not.toHaveBeenCalled()
  })
  it('permet une connexion manuelle si la découverte échoue', async () => {
    actions.discover.mockRejectedValue(new Error('Réseau'))
    draw(); await act(async () => click('Rejoindre', 'tab'))
    expect(element.textContent).toContain('Recherche indisponible')
    input('collab-address', '192.168.1.8:4455'); input('collab-code', '654321')
    await act(async () => click('Rejoindre'))
    expect(actions.join).toHaveBeenCalledWith('192.168.1.8:4455', '654321')
  })
  it('fait attendre l’invité puis ouvre le schéma au départ sans fermer une gestion rouverte', () => {
    useCollab.setState({ ...hosting, role: 'guest', host: null }); draw()
    expect(element.textContent).toContain('Le schéma reste en lecture seule')
    expect(element.textContent).not.toContain('Commencer la session')
    act(() => useCollab.setState({ started: true }))
    expect(useCollab.getState().dialogOpen).toBe(false)
    act(() => useCollab.getState().setDialogOpen(true))
    expect(element.querySelector('[role="dialog"]')).not.toBeNull()
  })
  it('garde Terminer la session accessible depuis le logiciel quand la gestion est fermée', () => {
    useCollab.setState({ ...hosting, dialogOpen: false, started: true }); draw(true)
    click('Terminer la session')
    expect(actions.leave).toHaveBeenCalledOnce()
    click('Gérer la session')
    expect(useCollab.getState().dialogOpen).toBe(true)
  })
})
