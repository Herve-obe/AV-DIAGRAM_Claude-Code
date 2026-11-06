import { afterEach, describe, expect, it, vi } from 'vitest'
import { createInstance } from 'i18next'
import fr from '../i18n/fr.json'
import en from '../i18n/en.json'
import { AiError } from './agent'
import { assistantErrorText, testAssistant } from './setup'
import { nativeTransport } from './transport'

const call = (name = 'check_project', args = '{}') => ({ choices: [{ message: { content: null, tool_calls: [{ id: 'check', type: 'function', function: { name, arguments: args } }] } }] })
afterEach(() => vi.restoreAllMocks())

describe('configuration IA', () => {
  it('vérifie les outils en un appel sans attendre une conclusion du modèle', async () => {
    const request = vi.spyOn(nativeTransport, 'request').mockResolvedValue({ status: 200, body: JSON.stringify(call()) })
    await testAssistant({ provider: 'builtin', model: 'test' }, 'fr')
    expect(request).toHaveBeenCalledTimes(1)
    const body = JSON.parse(request.mock.calls[0][2].body!)
    expect(body.tool_choice).toBe('required')
    expect(body.tools.map((t: { function: { name: string } }) => t.function.name)).toEqual(['check_project'])
    expect(body.max_tokens).toBe(128)
    expect(JSON.stringify(body)).not.toContain('propose_audio_production')
  })
  it('vérifie aussi le format Anthropic et la consigne anglaise', async () => {
    const request = vi.spyOn(nativeTransport, 'request').mockResolvedValue({ status: 200, body: JSON.stringify({ content: [{ type: 'tool_use', id: 'check', name: 'check_project', input: {} }] }) })
    await testAssistant({ provider: 'anthropic', model: 'test' }, 'en')
    const body = JSON.parse(request.mock.calls[0][2].body!)
    expect(body.tool_choice).toEqual({ type: 'tool', name: 'check_project' })
    expect(body.max_tokens).toBe(2048)
    expect(body.system).toMatch(/empty test diagram/)
    expect(request).toHaveBeenCalledTimes(1)
  })
  it.each([
    { choices: [{ message: { content: 'Je vais vérifier.' } }] },
    call('add_equipment'), call('check_project', '{"unexpected":true}'),
    { choices: [{ message: { ...call().choices[0].message, tool_calls: [...call().choices[0].message.tool_calls, ...call().choices[0].message.tool_calls] } }] },
  ])('refuse une annonce, un mauvais outil ou des paramètres inattendus', async response => {
    vi.spyOn(nativeTransport, 'request').mockResolvedValue({ status: 200, body: JSON.stringify(response) })
    await expect(testAssistant({ provider: 'builtin', model: 'test' }, 'fr')).rejects.toBe('tools')
  })
  it('conserve la cause des erreurs de serveur et de format', async () => {
    const request = vi.spyOn(nativeTransport, 'request').mockResolvedValue({ status: 503, body: '{"error":{"message":"modèle indisponible"}}' })
    await expect(testAssistant({ provider: 'builtin', model: 'test' }, 'fr')).rejects.toMatchObject({ kind: 'server', message: 'modèle indisponible' })
    request.mockResolvedValue({ status: 200, body: 'invalide' })
    await expect(testAssistant({ provider: 'builtin', model: 'test' }, 'fr')).rejects.toMatchObject({ kind: 'format' })
  })
  it.each(['fr', 'en'])('affiche la vraie erreur dans le parcours intégré (%s)', async lng => {
    const i18n = createInstance()
    await i18n.init({ lng, resources: { fr: { translation: fr }, en: { translation: en } } })
    expect(assistantErrorText(i18n.t, 'integrity')).toBe(i18n.t('ai.local.error.integrity'))
    expect(assistantErrorText(i18n.t, 'tools')).toBe(i18n.t('ai.local.error.tools'))
    expect(assistantErrorText(i18n.t, new AiError('steps', ''))).toBe(i18n.t('ai.error.steps'))
    expect(assistantErrorText(i18n.t, new AiError('network', 'exit 12'))).toContain('exit 12')
    expect(assistantErrorText(i18n.t, 'lancement impossible')).toContain('lancement impossible')
    expect(assistantErrorText(i18n.t, undefined)).toBe(i18n.t('ai.error.network'))
  })
})
