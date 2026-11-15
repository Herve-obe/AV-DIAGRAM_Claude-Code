// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '../i18n'
import { useCollab } from '../collab/session'
import { buttonByName, mount, press, typeInto, type Mounted } from '../test-utils/dom'
import { ChatPanel } from './ChatPanel'

// L'envoi réel passe par le document partagé de la session : on observe seulement l'appel
const sent = vi.hoisted(() => vi.fn())
vi.mock('../collab/session', async (original) => ({ ...await original<typeof import('../collab/session')>(), sendChat: sent }))

const t = (k: string) => i18n.t(k) as string
const message = (id: string, userId: string, name: string, text: string) => ({ id, userId, name, color: '#123456', text, at: Date.UTC(2026, 0, 5, 9, 30) })
const field = (el: HTMLElement) => el.querySelector('textarea')!

let view: Mounted
beforeEach(() => {
  sent.mockClear()
  useCollab.setState({ status: 'connected', chatOpen: true, chat: [], userId: 'me' })
})
afterEach(() => { view?.unmount(); useCollab.setState({ status: 'off', chatOpen: false, chat: [] }) })

describe('ChatPanel', () => {
  it('ne s’affiche pas hors session ni quand le tchat est fermé', () => {
    useCollab.setState({ status: 'off' })
    view = mount(<ChatPanel />)
    expect(view.element.querySelector('aside')).toBeNull()
    useCollab.setState({ status: 'connected', chatOpen: false })
    view.render(<ChatPanel />)
    expect(view.element.querySelector('aside')).toBeNull()
  })

  it('annonce qu’il n’y a pas encore de message', () => {
    view = mount(<ChatPanel />)
    expect(view.element.textContent).toContain(t('collab.chat.empty'))
  })

  it('affiche les messages avec leur auteur et leur texte, dans l’ordre', () => {
    useCollab.setState({ chat: [message('1', 'bob', 'Bob', 'Retour scène OK'), message('2', 'me', 'Moi', 'Merci')] })
    view = mount(<ChatPanel />)
    const text = view.element.textContent!
    expect(text).not.toContain(t('collab.chat.empty'))
    expect(text).toContain('Bob')
    expect(text.indexOf('Retour scène OK')).toBeLessThan(text.indexOf('Merci'))
  })

  it('le bouton Envoyer est inactif tant que le message est vide ou blanc', () => {
    view = mount(<ChatPanel />)
    const send = buttonByName(view.element, t('collab.chat.send')) as HTMLButtonElement
    expect(send.disabled).toBe(true)
    typeInto(field(view.element), '   ')
    expect((buttonByName(view.element, t('collab.chat.send')) as HTMLButtonElement).disabled).toBe(true)
    typeInto(field(view.element), 'Bonjour')
    expect((buttonByName(view.element, t('collab.chat.send')) as HTMLButtonElement).disabled).toBe(false)
  })

  it('Entrée envoie le message et vide le champ ; Maj+Entrée n’envoie pas', () => {
    view = mount(<ChatPanel />)
    typeInto(field(view.element), 'Ligne 1')
    press(field(view.element), 'Enter', { shiftKey: true })
    expect(sent).not.toHaveBeenCalled()
    press(field(view.element), 'Enter')
    expect(sent).toHaveBeenCalledExactlyOnceWith('Ligne 1')
    expect(field(view.element).value).toBe('')
  })

})
