// Bloc d'un sous-schéma replié : nom du groupe, nombre d'éléments et ports d'interface
// (une poignée par liaison qui franchit la frontière). Double-clic pour ouvrir le détail.
import { memo } from 'react'
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import { useTranslation } from 'react-i18next'
import type { GroupPort } from '../model/groups'
import { SIGNAL_STYLE } from '../model/signals'
import { Icon } from '../ui/Icon'

export type GroupNodeData = { name: string; count: number; ports: GroupPort[]; offPage: Record<string, string> }
export type GroupFlowNode = Node<GroupNodeData, 'subsheet'>

function GroupPortRow({ port, offPage }: { port: GroupPort; offPage?: string }) {
  const side = port.direction === 'in' ? 'left' : 'right'
  return (
    <div className={`port port-${side}`} title={port.name}>
      <Handle
        id={port.id}
        type={side === 'left' ? 'target' : 'source'}
        position={side === 'left' ? Position.Left : Position.Right}
        className="handle"
        isConnectable={false}
        style={{ ['--port-color' as string]: SIGNAL_STYLE[port.signal].color }}
      />
      {offPage && side === 'left' && <span className="off-page" title={offPage}>◂ {offPage}</span>}
      <span className="port-name">{port.name}</span>
      {offPage && side === 'right' && <span className="off-page" title={offPage}>{offPage} ▸</span>}
    </div>
  )
}

function GroupNodeView({ data, selected }: NodeProps<GroupFlowNode>) {
  const { t } = useTranslation()
  const inputs = data.ports.filter((p) => p.direction === 'in')
  const outputs = data.ports.filter((p) => p.direction === 'out')
  return (
    <div className={`eq-node group-node ${selected ? 'is-selected' : ''}`} title={t('groups.openHint')}>
      <header className="eq-head">
        <span className="eq-pict"><Icon name="frame" size={16} /></span>
        <span className="eq-titles">
          <span className="eq-name">{data.name}</span>
          <span className="eq-model">{t('groups.summary', { count: data.count })}</span>
        </span>
      </header>
      {data.ports.length > 0 && (
        <div className="eq-ports">
          <div className="eq-col">{inputs.map((p) => <GroupPortRow key={p.id} port={p} offPage={data.offPage[p.id]} />)}</div>
          <div className="eq-col eq-col-right">{outputs.map((p) => <GroupPortRow key={p.id} port={p} offPage={data.offPage[p.id]} />)}</div>
        </div>
      )}
    </div>
  )
}

export const GroupNode = memo(GroupNodeView)
