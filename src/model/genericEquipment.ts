// Équipement générique créé par l'utilisateur pour pallier un modèle absent de la bibliothèque :
// nom, menu, famille, groupes de prises (sens, signal, connecteur, nombre), poids et consommation facultatifs.
import { DOMAIN_FAMILIES } from '../library/domains'
import { CONNECTORS } from './connectors'
import type { SignalFamily } from './signals'
import type { EquipmentFamily, EquipmentTemplate, Level, LibraryDomain, PictogramId, PortDef, PortDirection } from './types'

/** Signaux proposés dans chaque menu. */
export const DOMAIN_SIGNALS: Record<LibraryDomain, SignalFamily[]> = {
  sound: ['audioAnalog', 'audioDigital', 'audioIp', 'intercom', 'sync', 'control', 'network', 'rf', 'power'],
  image: ['video', 'videoIp', 'audioAnalog', 'audioDigital', 'sync', 'control', 'intercom', 'network', 'power'],
  light: ['dmx', 'network', 'control', 'rf', 'power'],
  network: ['network', 'control', 'power'],
  distribution: ['power', 'dmx', 'network', 'control'],
  misc: ['audioAnalog', 'audioDigital', 'audioIp', 'video', 'videoIp', 'sync', 'intercom', 'control', 'network', 'dmx', 'rf', 'power'],
}

/** Connecteurs proposés pour chaque signal (catalogue réel de connectors.ts, connecteurs propriétaires exclus). */
const SIGNAL_CONNECTORS: Record<SignalFamily, string[]> = {
  audioAnalog: ['xlr3', 'combo', 'jack-trs', 'jack-ts', 'minijack', 'rca', 'speakon-nl2', 'speakon-nl4', 'speakon-nl8', 'terminal', 'binding-post', 'dsub25', 'multipin', 'ta3', 'ta4', 'ta5', 'lemo3', 'microdot', 'bare-wire'],
  audioDigital: ['xlr3', 'bnc', 'rca', 'toslink', 'dsub25', 'ethercon', 'rj45', 'usb-b', 'usb-c', 'opticalcon', 'sfp', 'lc'],
  audioIp: ['ethercon', 'rj45', 'sfp', 'lc', 'opticalcon'],
  video: ['bnc', 'hdmi', 'displayport', 'dvi', 'vga', 'sfp', 'lc', 'opticalcon', 'smpte-fiber', 'triax', 'usb-c'],
  videoIp: ['rj45', 'ethercon', 'sfp', 'lc', 'opticalcon'],
  sync: ['bnc', 'xlr3', 'lemo5', 'minijack', 'rj45'],
  intercom: ['xlr3', 'xlr4', 'xlr5', 'rj45', 'ethercon', 'minijack'],
  control: ['dsub9', 'dsub15', 'dsub25', 'rj45', 'ethercon', 'usb-a', 'usb-b', 'usb-c', 'din5', 'minijack', 'jack-ts', 'jack-trs', 'terminal', 'xlr3'],
  network: ['rj45', 'ethercon', 'sfp', 'lc', 'sc', 'st', 'opticalcon'],
  power: ['iec-c13', 'iec-c19', 'iec-c7', 'powercon', 'powercon-true1', 'powercon-32', 'schuko', 'cee7-e', 'p17-16-mono', 'p17-32-mono', 'p17-32-tri', 'p17-63-mono', 'p17-63-tri', 'p17-125-tri', 'socapex19', 'powerlock', 'camlock', 'mains-captive', 'dc-barrel', 'xlr4', 'terminal', 'bare-wire'],
  rf: ['bnc', 'sma', 'tnc', 'rf'],
  dmx: ['xlr5', 'xlr3', 'rj45', 'ethercon', 'terminal'],
}

const KNOWN = new Set(CONNECTORS.map(c => c.id))

export function connectorsFor(signal: SignalFamily): string[] {
  return (SIGNAL_CONNECTORS[signal] ?? []).filter(id => KNOWN.has(id))
}

/** Familles proposées pour un menu (les options installables relèvent de la règle principal + option). */
export function familiesFor(domain: LibraryDomain): EquipmentFamily[] {
  return DOMAIN_FAMILIES[domain].filter(f => f !== 'module')
}

const PICTOGRAMS: Partial<Record<EquipmentFamily, PictogramId>> = {
  capture: 'mic', wireless: 'wireless', console: 'console', stagebox: 'stagebox', processing: 'processor', amplification: 'amp',
  speaker: 'speaker', recording: 'recorder', intercom: 'intercom', sync: 'clock', control: 'control', camera: 'camera',
  videoSwitcher: 'switcher', videoRouting: 'router', display: 'display', network: 'switch', power: 'power',
  luminaire: 'light', lightingControl: 'console', dmxDistribution: 'control', passive: 'patch',
}

export interface PortGroup {
  direction: PortDirection
  signal: SignalFamily
  connector: string
  count: number
  /** Libellé de base, numéroté s'il y a plusieurs prises (ex. « Entrée » → « Entrée 1 », « Entrée 2 ») */
  label: string
  level?: Level
}

export interface GenericSpec {
  name: string
  domain: LibraryDomain
  family: EquipmentFamily
  groups: PortGroup[]
  weightKg?: number
  powerW?: number
}

/** Au plus 256 prises par équipement, pour garder un schéma lisible. */
export const MAX_GENERIC_PORTS = 256

export function genericErrors(spec: GenericSpec): string[] {
  const errors: string[] = []
  if (!spec.name.trim()) errors.push('name')
  if (!familiesFor(spec.domain).includes(spec.family)) errors.push('family')
  const total = spec.groups.reduce((n, g) => n + g.count, 0)
  if (!total || total > MAX_GENERIC_PORTS) errors.push('ports')
  for (const g of spec.groups) {
    if (!Number.isInteger(g.count) || g.count < 1 || !DOMAIN_SIGNALS[spec.domain].includes(g.signal) || !connectorsFor(g.signal).includes(g.connector)) errors.push('group')
  }
  if (spec.weightKg !== undefined && !(spec.weightKg >= 0)) errors.push('weight')
  if (spec.powerW !== undefined && !(spec.powerW >= 0)) errors.push('power')
  return [...new Set(errors)]
}

/** Construit la fiche « Mes modèles » de l'équipement générique ; identifiants de prises stables et uniques. */
export function buildGenericTemplate(spec: GenericSpec, unique = () => Math.random().toString(36).slice(2, 8)): EquipmentTemplate {
  const slug = spec.name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'equipement'
  const ports: PortDef[] = []
  spec.groups.forEach((g, gi) => {
    for (let i = 1; i <= g.count; i++) {
      const base = g.label.trim() || (g.direction === 'in' ? 'In' : g.direction === 'out' ? 'Out' : 'I/O')
      ports.push({
        id: `g${gi + 1}p${i}`,
        name: g.count > 1 ? `${base} ${i}` : base,
        direction: g.direction,
        signal: g.signal,
        connector: g.connector,
        ...(g.signal === 'audioAnalog' && g.level ? { level: g.level } : {}),
      })
    }
  })
  return {
    id: `user-generic-${slug}-${unique()}`,
    model: spec.name.trim(),
    family: spec.family,
    domain: spec.domain,
    pictogram: PICTOGRAMS[spec.family] ?? 'patch',
    status: 'user',
    description: 'Équipement générique créé par l’utilisateur (modèle absent de la bibliothèque).',
    ports,
    ...(spec.weightKg !== undefined ? { weightKg: spec.weightKg } : {}),
    ...(spec.powerW !== undefined ? { powerW: spec.powerW } : {}),
  }
}
