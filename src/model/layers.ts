// Calques : chaque personne qui travaille sur le projet peut n'afficher que son domaine (audio, image,
// lumière, réseau, électrique). Un équipement appartient au calque de sa famille et à celui de chacun
// de ses ports : une caméra avec des entrées audio apparaît donc aussi dans le calque Audio.
//
// Rappels : quand un équipement a des ports d'un autre domaine que le sien (entrées audio d'une
// caméra, sorties vidéo d'une console…) et qu'ils ne sont pas reliés, le logiciel le signale ;
// l'utilisateur peut prendre le rappel en compte ou l'ignorer.
import { domainOf } from '../library/domains'
import type { SignalFamily } from './signals'
import type { Equipment, LibraryDomain, PortDef, Project } from './types'

/** Calques affichables (le domaine « Divers » n'en est pas un). */
export const LAYERS = ['sound', 'image', 'light', 'network', 'distribution'] as const
export type Layer = (typeof LAYERS)[number]
/** Choix d'affichage : tous les calques ou un seul */
export type LayerView = 'all' | Layer

/** Calque d'une famille de signal ; la synchro et le contrôle servent à tous les domaines. */
const SIGNAL_LAYER: Record<SignalFamily, Layer | null> = {
  audioAnalog: 'sound',
  audioDigital: 'sound',
  audioIp: 'sound',
  intercom: 'sound',
  rf: 'sound',
  video: 'image',
  videoIp: 'image',
  dmx: 'light',
  network: 'network',
  power: 'distribution',
  sync: null,
  control: null,
}

export const layerOfSignal = (s: SignalFamily): Layer | null => SIGNAL_LAYER[s]

/** Calque principal d'un équipement : celui de sa famille (Divers : aucun). */
export function primaryLayer(eq: Pick<Equipment, 'family'>): Layer | null {
  const d: LibraryDomain = domainOf(eq)
  return (LAYERS as readonly string[]).includes(d) ? (d as Layer) : null
}

/** Calques où l'équipement apparaît : sa famille et les signaux de ses ports. */
export function layersOf(eq: Pick<Equipment, 'family' | 'ports'>): Set<Layer> {
  const set = new Set<Layer>()
  const main = primaryLayer(eq)
  if (main) set.add(main)
  for (const p of eq.ports) {
    const l = layerOfSignal(p.signal)
    if (l) set.add(l)
  }
  return set
}

/** Visible dans le calque choisi ? Un équipement « Divers » sans port typé reste toujours visible. */
export function equipmentInView(eq: Pick<Equipment, 'family' | 'ports'>, view: LayerView): boolean {
  if (view === 'all') return true
  const layers = layersOf(eq)
  return layers.size === 0 || layers.has(view)
}

/** Port mis en avant dans le calque choisi (les autres sont estompés). Synchro et contrôle : toujours. */
export function portInView(port: Pick<PortDef, 'signal'>, view: LayerView): boolean {
  if (view === 'all') return true
  const l = layerOfSignal(port.signal)
  return l === null || l === view
}

/**
 * Domaines croisés pris en compte par les rappels. Réseau et électrique sont présents sur presque
 * tous les appareils : les signaler partout noierait les rappels utiles.
 */
const CROSS_LAYERS: Layer[] = ['sound', 'image', 'light']

export interface CrossLayerHint {
  equipmentId: string
  /** Calque des ports concernés (ex. « sound » pour les entrées audio d'une caméra) */
  layer: Layer
  /** Calque principal de l'équipement */
  home: Layer
  /** Ports de ce calque non reliés */
  ports: PortDef[]
  /** Rappel ignoré par l'utilisateur (reste consultable) */
  dismissed: boolean
}

export const hintKey = (layer: Layer) => `layer:${layer}`

/** Rappels de connexions entre domaines : ports d'un autre domaine, non reliés. */
export function crossLayerHints(project: Project): CrossLayerHint[] {
  const used = new Set<string>()
  for (const l of Object.values(project.links)) {
    used.add(`${l.source.equipmentId}/${l.source.portId}`)
    used.add(`${l.target.equipmentId}/${l.target.portId}`)
  }
  const out: CrossLayerHint[] = []
  for (const eq of Object.values(project.equipment)) {
    const home = primaryLayer(eq)
    if (!home || !CROSS_LAYERS.includes(home)) continue
    for (const layer of CROSS_LAYERS) {
      if (layer === home) continue
      const ports = eq.ports.filter((p) => layerOfSignal(p.signal) === layer && !used.has(`${eq.id}/${p.id}`))
      if (!ports.length) continue
      out.push({ equipmentId: eq.id, layer, home, ports, dismissed: !!eq.dismissedHints?.includes(hintKey(layer)) })
    }
  }
  return out
}
