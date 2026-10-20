import { layerOfSignal, primaryLayer } from '../model/layers'
import type { Equipment, PortDef } from '../model/types'
import { useUi } from '../store/uiStore'
import { useCollab } from './session'

/** Indications d'interface ; le garde du projet et l'hôte contrôlent toujours les modifications. */
export function useEditing() {
  const c = useCollab()
  const layer = useUi(s => s.layer)
  const common = c.status === 'off' || c.role === 'host'
  const assigned = c.role === 'guest' && c.started && layer !== 'all' && c.claims[layer]?.userId === c.userId
  return {
    common,
    equipment: (e: Equipment) => common || (assigned && primaryLayer(e) === layer),
    port: (e: Equipment, p: PortDef) => common || (assigned && (layerOfSignal(p.signal) ?? primaryLayer(e)) === layer),
    link: (a: PortDef, b: PortDef) => common || (assigned && layerOfSignal(a.signal) === layer && layerOfSignal(b.signal) === layer),
  }
}
