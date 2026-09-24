// Bloc équipement : en-tête (pictogramme, nom, modèle) puis ports. Entrées à gauche, sorties à droite.
import { memo } from 'react'
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import { connectorLabel } from '../model/connectors'
import { SIGNAL_STYLE } from '../model/signals'
import type { Equipment, PortDef } from '../model/types'
import { Pictogram } from '../ui/Pictogram'

export type EquipmentNodeData = { equipment: Equipment; compact: boolean }
export type EquipmentFlowNode = Node<EquipmentNodeData, 'equipment'>

function PortRow({ port, side }: { port: PortDef; side: 'left' | 'right' }) {
  const style = SIGNAL_STYLE[port.signal]
  const title = `${port.name} · ${connectorLabel(port.connector)}${port.format ? ` · ${port.format}` : ''}`
  return (
    <div className={`port port-${side}`} title={title}>
      <Handle
        id={port.id}
        type={side === 'left' ? 'target' : 'source'}
        position={side === 'left' ? Position.Left : Position.Right}
        className={`handle ${port.direction === 'bidir' ? 'handle-bidir' : ''}`}
        style={{ ['--port-color' as string]: style.color }}
      />
      <span className="port-name">{port.name}</span>
    </div>
  )
}

function EquipmentNodeView({ data, selected }: NodeProps<EquipmentFlowNode>) {
  const eq = data.equipment
  const inputs = eq.ports.filter((p) => p.direction === 'in')
  const outputs = eq.ports.filter((p) => p.direction !== 'in')
  const rows = Math.max(inputs.length, outputs.length)
  return (
    <div className={`eq-node ${selected ? 'is-selected' : ''}`}>
      <header className="eq-head">
        <span className="eq-pict"><Pictogram id={eq.pictogram} size={16} /></span>
        <span className="eq-titles">
          <span className="eq-name">{eq.name}</span>
          {!data.compact && <span className="eq-model">{eq.manufacturer ? `${eq.manufacturer} ${eq.model}` : eq.model}</span>}
        </span>
      </header>
      {rows > 0 && (
        <div className="eq-ports">
          <div className="eq-col">{inputs.map((p) => <PortRow key={p.id} port={p} side="left" />)}</div>
          <div className="eq-col eq-col-right">{outputs.map((p) => <PortRow key={p.id} port={p} side="right" />)}</div>
        </div>
      )}
    </div>
  )
}

export const EquipmentNode = memo(EquipmentNodeView)
