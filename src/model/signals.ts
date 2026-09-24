// Familles de signaux : couleur (token CSS), style de trait, et règle de transport.
// Le code couleur est une convention du projet, pas une norme (voir docs/cahier-des-charges.md, 5.1).

export const SIGNAL_FAMILIES = [
  'audioAnalog',
  'audioDigital',
  'audioIp',
  'video',
  'videoIp',
  'sync',
  'intercom',
  'control',
  'network',
  'power',
] as const

export type SignalFamily = (typeof SIGNAL_FAMILIES)[number]

export interface SignalStyle {
  /** Variable CSS définie dans styles/tokens.css */
  color: string
  /** Motif de trait SVG (stroke-dasharray), vide = trait plein */
  dash: string
  /** Épaisseur du trait en px */
  width: number
}

export const SIGNAL_STYLE: Record<SignalFamily, SignalStyle> = {
  audioAnalog: { color: 'var(--sig-audio-analog)', dash: '', width: 2 },
  audioDigital: { color: 'var(--sig-audio-digital)', dash: '', width: 3 },
  audioIp: { color: 'var(--sig-audio-ip)', dash: '10 5', width: 2 },
  video: { color: 'var(--sig-video)', dash: '', width: 2 },
  videoIp: { color: 'var(--sig-video)', dash: '10 5', width: 2 },
  sync: { color: 'var(--sig-sync)', dash: '2 4', width: 2 },
  intercom: { color: 'var(--sig-intercom)', dash: '8 3 2 3', width: 2 },
  control: { color: 'var(--sig-control)', dash: '4 3', width: 1.5 },
  network: { color: 'var(--sig-network)', dash: '', width: 2 },
  power: { color: 'var(--sig-power)', dash: '', width: 3 },
}

/**
 * Familles transportées par un lien réseau : un flux Dante ou NDI circule sur un port Ethernet.
 * Une liaison audioIp -> network (ou l'inverse) est donc compatible.
 */
const CARRIED_BY_NETWORK: SignalFamily[] = ['audioIp', 'videoIp', 'network', 'intercom', 'control']

export function familiesCompatible(a: SignalFamily, b: SignalFamily): boolean {
  if (a === b) return true
  if (a === 'network') return CARRIED_BY_NETWORK.includes(b)
  if (b === 'network') return CARRIED_BY_NETWORK.includes(a)
  return false
}
