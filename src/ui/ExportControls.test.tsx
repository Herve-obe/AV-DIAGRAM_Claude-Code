// @vitest-environment jsdom
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import i18n from '../i18n'
import { DEFAULT_EXPORT } from '../model/exportOptions'
import { createProject } from '../model/project'
import type { ExportSettings, ProjectInfo } from '../model/types'
import { buttonByName, click, mount, typeInto, type Mounted } from '../test-utils/dom'
import { FormatPicker, ProtectionEditor, TitleBlockFields, WatermarkEditor, infoWithTemplate } from './ExportControls'

const t = (k: string, o?: Record<string, unknown>) => i18n.t(k, o) as string
const project = createProject('Export')
let view: Mounted
afterEach(() => view?.unmount())

/** Compose un composant contrôlé avec un état local et expose la dernière valeur émise. */
function Harness<T>({ initial, children, spy }: { initial: T; children: (v: T, set: (v: T) => void) => React.ReactNode; spy: (v: T) => void }) {
  const [value, setValue] = useState(initial)
  return <>{children(value, v => { spy(v); setValue(v) })}</>
}

describe('FormatPicker', () => {
  it('change le format de papier et conserve le reste des réglages', () => {
    const spy = vi.fn<(v: ExportSettings) => void>()
    view = mount(<Harness initial={DEFAULT_EXPORT} spy={spy}>{(v, set) => <FormatPicker project={project} value={v} onChange={set} />}</Harness>)
    click(buttonByName(view.element, 'A4'))
    expect(spy).toHaveBeenLastCalledWith({ ...DEFAULT_EXPORT, paper: 'A4' })
    const a4 = buttonByName(view.element, 'A4')
    expect(a4.getAttribute('aria-checked')).toBe('true')
    expect(buttonByName(view.element, 'A3').getAttribute('aria-checked')).toBe('false')
  })

  it('l’échelle d’impression est bornée entre 10 et 400 %', () => {
    const spy = vi.fn<(v: ExportSettings) => void>()
    view = mount(<Harness initial={DEFAULT_EXPORT} spy={spy}>{(v, set) => <FormatPicker project={project} value={v} onChange={set} />}</Harness>)
    typeInto(view.element.querySelector<HTMLInputElement>('#print-scale')!, '9000')
    expect(spy.mock.lastCall![0].printScale).toBe(400)
    typeInto(view.element.querySelector<HTMLInputElement>('#print-scale')!, '1')
    expect(spy.mock.lastCall![0].printScale).toBe(10)
  })

})

describe('WatermarkEditor', () => {
  it('masque ses champs tant que le filigrane est désactivé et les montre une fois activé', () => {
    const spy = vi.fn()
    view = mount(<Harness initial={DEFAULT_EXPORT.watermark} spy={spy}>{(v, set) => <WatermarkEditor project={project} value={v} onChange={set} />}</Harness>)
    expect(view.element.querySelector('#wm-text')).toBeNull()
    click(view.element.querySelector('input[type="checkbox"]')!)
    expect(view.element.querySelector('#wm-text')).not.toBeNull()
    expect(spy.mock.lastCall![0].enabled).toBe(true)
  })

  it('compte les destinataires distincts et ignore les lignes vides ou répétées', () => {
    const wm = { ...DEFAULT_EXPORT.watermark, enabled: true }
    view = mount(<Harness initial={wm} spy={() => {}}>{(v, set) => <WatermarkEditor project={project} value={v} onChange={set} />}</Harness>)
    expect(view.element.textContent).toContain(t('exportPdf.recipientsNone'))
    typeInto(view.element.querySelector<HTMLTextAreaElement>('#wm-recipients')!, 'Alice\n\nBob\nAlice ')
    expect(view.element.textContent).toContain(t('exportPdf.recipientsHint', { count: 2 }))
  })
})

describe('ProtectionEditor', () => {
  const off = DEFAULT_EXPORT.protection

  it('annonce « aucune protection » puis « dissuasive » une fois activée, et « forte » avec un mot de passe d’ouverture', () => {
    view = mount(<ProtectionEditor value={off} onChange={() => {}} />)
    expect(view.element.textContent).toContain(t('exportPdf.level.none'))
    view.render(<ProtectionEditor value={{ ...off, enabled: true }} onChange={() => {}} />)
    expect(view.element.textContent).toContain(t('exportPdf.level.deterrent'))
    view.render(<ProtectionEditor value={{ ...off, enabled: true }} onChange={() => {}} passwords={{ open: 'secret', owner: '' }} onPasswords={() => {}} />)
    expect(view.element.textContent).toContain(t('exportPdf.level.strong'))
  })

})

describe('TitleBlockFields et modèle de cartouche', () => {
  it('saisir un champ émet l’information mise à jour sans perdre les autres champs', () => {
    const spy = vi.fn<(v: ProjectInfo) => void>()
    view = mount(<Harness initial={{ client: 'Acme' } as ProjectInfo} spy={spy}>{(v, set) => <TitleBlockFields value={v} onChange={set} />}</Harness>)
    typeInto(view.element.querySelector<HTMLInputElement>('#tb-venue')!, 'Zénith')
    expect(spy.mock.lastCall![0]).toMatchObject({ client: 'Acme', venue: 'Zénith' })
    typeInto(view.element.querySelector<HTMLInputElement>('#tb-venue')!, '')
    expect(spy.mock.lastCall![0].venue).toBeUndefined()
  })

  it('ajoute puis supprime une révision', () => {
    const spy = vi.fn<(v: ProjectInfo) => void>()
    view = mount(<Harness initial={{ revision: 'B' } as ProjectInfo} spy={spy}>{(v, set) => <TitleBlockFields value={v} onChange={set} />}</Harness>)
    click(buttonByName(view.element, t('titleBlock.addRevision')))
    expect(spy.mock.lastCall![0].revisions).toHaveLength(1)
    expect(spy.mock.lastCall![0].revisions![0].index).toBe('B')
    click(buttonByName(view.element, t('titleBlock.removeRevision')))
    expect(spy.mock.lastCall![0].revisions).toEqual([])
  })

  it('le modèle du poste complète seulement les champs vides du projet', () => {
    const tpl = { owner: 'Ma Société', ownerDetail: '', logo: null, author: 'Auteur modèle', approver: '', docType: '', classification: '', language: '', numberPrefix: 'SYN-' }
    const info = infoWithTemplate({ owner: 'Client direct' }, tpl, new Date('2026-03-01'))
    expect(info.owner).toBe('Client direct')
    expect(info.author).toBe('Auteur modèle')
    expect(info.docNumber).toBe('SYN-2026-001')
    expect(info.status).toBe('draft')
  })
})
