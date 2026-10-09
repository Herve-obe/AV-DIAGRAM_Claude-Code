// Bloc équipement : en-tête (pictogramme, nom, modèle) puis ports. Par défaut entrées à gauche, sorties à
// droite ; le bloc peut pivoter d'un quart de tour (entrées en haut, à droite ou en bas). Dans un calque,
// les ports des autres domaines sont estompés.
import { memo, useEffect } from 'react'
import i18n from '../i18n'
import { Handle, Position, useUpdateNodeInternals, type Node, type NodeProps } from '@xyflow/react'
import { connectorLabel } from '../model/connectors'
import { portInView, type LayerView } from '../model/layers'
import { SIGNAL_STYLE } from '../model/signals'
import type { Equipment, PortDef, Rotation } from '../model/types'
import { Icon } from '../ui/Icon'
import { Pictogram } from '../ui/Pictogram'

/** offPage : pour chaque port relié à une autre feuille, le nom de cette feuille (renvoi) */
export type EquipmentNodeData = {
  equipment: Equipment
  compact: boolean
  offPage: Record<string, string>
  layer: LayerView
  /** Nombre de rappels inter-calques en attente (ports d'un autre domaine non reliés) */
  hints: number
  hintTitle?: string
  /** Participants de la session qui ont sélectionné ce bloc (nom, couleur) */
  presence?: { name: string; color: string }[]
  /** Calque réservé par quelqu'un d'autre : « Image : Marc » */
  lockedBy?: string
}
export type EquipmentFlowNode = Node<EquipmentNodeData, 'equipment'>

type Side = 'left' | 'right' | 'top' | 'bottom'
const POSITION: Record<Side, Position> = { left: Position.Left, right: Position.Right, top: Position.Top, bottom: Position.Bottom }
/** Bord des entrées et des sorties selon l'orientation */
const SIDES: Record<Rotation, { input: Side; output: Side }> = {
  0: { input: 'left', output: 'right' },
  90: { input: 'top', output: 'bottom' },
  180: { input: 'right', output: 'left' },
  270: { input: 'bottom', output: 'top' },
}

function PortRow({ port, side, input, offPage, dim }: { port: PortDef; side: Side; input: boolean; offPage?: string; dim: boolean }) {
  const style = SIGNAL_STYLE[port.signal]
  // Info-bulle complète : sens, signal, niveau, connecteur (aide à choisir le bon port)
  const t = i18n.t.bind(i18n)
  const title = [
    port.name,
    t(`direction.${port.direction}`),
    t(`signal.${port.signal}`),
    port.level && port.level !== 'none' ? t(`level.${port.level}`) : '',
    connectorLabel(port.connector),
    port.format ?? '',
  ].filter(Boolean).join(' · ')
  // Renvoi affiché du côté extérieur du bloc
  const before = side === 'left' || side === 'top'
  return (
    <div className={`port port-${side}${dim ? ' port-dim' : ''}`} title={title} data-sig={port.signal} data-dir={port.direction}>
      <Handle
        id={port.id}
        type={input ? 'target' : 'source'}
        position={POSITION[side]}
        className={`handle ${port.direction === 'bidir' ? 'handle-bidir' : ''}`}
        style={{ ['--port-color' as string]: style.color }}
      />
      {offPage && before && <span className="off-page" title={offPage}>{side === 'top' ? '▴' : '◂'} {offPage}</span>}
      <span className="port-name">{port.name}</span>
      {offPage && !before && <span className="off-page" title={offPage}>{offPage} {side === 'bottom' ? '▾' : '▸'}</span>}
    </div>
  )
}

function EquipmentNodeView({ id, data, selected }: NodeProps<EquipmentFlowNode>) {
  const eq = data.equipment
  const rotation = eq.rotation ?? 0
  // Les poignées changent de bord sans forcément changer la taille du bloc : on fait remesurer
  const updateNodeInternals = useUpdateNodeInternals()
  useEffect(() => updateNodeInternals(id), [id, rotation, updateNodeInternals])
  const { input, output } = SIDES[rotation]
  const inputs = eq.ports.filter((p) => p.direction === 'in')
  const outputs = eq.ports.filter((p) => p.direction !== 'in')
  const row = (list: PortDef[], side: Side, isInput: boolean) =>
    list.map((p) => <PortRow key={p.id} port={p} side={side} input={isInput} offPage={data.offPage[p.id]} dim={!portInView(p, data.layer)} />)
  const ins = row(inputs, input, true)
  const outs = row(outputs, output, false)
  const head = (
    <header className="eq-head">
      <span className="eq-pict"><Pictogram id={eq.pictogram} size={16} /></span>
      <span className="eq-titles">
        <span className="eq-name">{eq.name}</span>
        {!data.compact && <span className="eq-model">{eq.manufacturer ? `${eq.manufacturer} ${eq.model}` : eq.model}</span>}
      </span>
      {data.lockedBy && <span className="eq-lock" title={data.lockedBy}><Icon name="lock" size={12} /></span>}
      {data.hints > 0 && <span className="eq-hint" title={data.hintTitle}>{data.hints}</span>}
    </header>
  )
  // Présence : contour aux couleurs des participants qui manipulent ce bloc
  const presence = data.presence ?? []
  const presenceStyle = presence.length
    ? { boxShadow: presence.map((p, i) => `0 0 0 ${2 + i * 2}px ${p.color}`).join(', ') }
    : undefined
  const presenceTag = presence.length > 0 && (
    <span className="eq-presence" style={{ background: presence[0].color }} title={presence.map((p) => p.name).join(', ')}>
      {presence.map((p) => p.name).join(', ')}
    </span>
  )
  if (rotation === 90 || rotation === 270) {
    // Ports en rangées au-dessus et au-dessous de l'en-tête
    const [top, bottom] = rotation === 90 ? [ins, outs] : [outs, ins]
    return (
      <div className={`eq-node eq-vertical ${selected ? 'is-selected' : ''}`} style={presenceStyle}>
        {presenceTag}
        {top.length > 0 && <div className="eq-row eq-row-top">{top}</div>}
        {head}
        {bottom.length > 0 && <div className="eq-row eq-row-bottom">{bottom}</div>}
      </div>
    )
  }
  const [left, right] = rotation === 0 ? [ins, outs] : [outs, ins]
  return (
    <div className={`eq-node ${selected ? 'is-selected' : ''}`} style={presenceStyle}>
      {presenceTag}
      {head}
      {(left.length > 0 || right.length > 0) && (
        <div className="eq-ports">
          <div className="eq-col">{left}</div>
          <div className="eq-col eq-col-right">{right}</div>
        </div>
      )}
    </div>
  )
}

export const EquipmentNode = memo(EquipmentNodeView)
