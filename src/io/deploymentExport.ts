import type { TFunction } from 'i18next'
import { networkPorts, portName, isNetworkPort, networkIssues, poeLoads } from '../model/network'
import { communicationPorts, clockIssues } from '../model/communications'
import { circuitLoad, equipmentPower } from '../model/power'
import type { ExportSettings, Project, ProjectInfo } from '../model/types'
import { sheetLayout } from './exportOptions'
import type { SheetShot } from './pdf'

export interface ReportTable { name: string; keys: string[]; rows: (string | number | null)[][] }
export function deploymentTables(p: Project, t: TFunction): Record<string, ReportTable[]> {
  const table = (key: string, keys: string[], rows: ReportTable['rows']): ReportTable => ({ name: t(`engineering.${key}`), keys: keys.map(k => t(`engineering.${k}`)), rows })
  const ports = networkPorts(p), loads = poeLoads(p)
  const network = [table('reportNetwork', ['equipment','port','address','prefix','vlan','tagged','capacity','poe','poeW'], ports.map(({e,port}) => { const n = port.network; return [e.name,port.name,n?.address ?? '',n?.prefix ?? null,n?.vlan ?? null,n?.taggedVlans?.join(', ') ?? '',n?.capacityMbps ?? null,t(`engineering.poeRoles.${n?.poe ?? 'unknown'}`),n?.poeW ?? null] })),
    table('reportPoe',['equipment','poeW','knownDemand','unknown'],Object.values(p.equipment).filter(e => e.poeBudgetW !== undefined || e.ports.some(p => p.network?.poe === 'source')).map(e => [e.name,e.poeBudgetW ?? null,loads.get(e.id)?.watts ?? 0,loads.get(e.id)?.unknown ?? 0])),
    table('reportFlows',['link','source','target','bitrate'],Object.values(p.links).flatMap(l => { const a = p.equipment[l.source.equipmentId], b = p.equipment[l.target.equipmentId], ap = a?.ports.find(x => x.id === l.source.portId), bp = b?.ports.find(x => x.id === l.target.portId); return ap && bp && isNetworkPort(ap) && isNetworkPort(bp) ? [[l.label,portName(a,ap),portName(b,bp),l.bitrateMbps ?? null]] : [] }))]
  const circuits = p.settings.powerCircuits ?? []
  const power = [table('reportPower',['circuit','phase','voltage','rated','knownPower','knownCurrent','unknown'],circuits.flatMap(c => { const result = circuitLoad(p,c); return result.loads.map(l => [c.name,l.phase,c.voltage,c.ratedA ?? null,l.watts,l.amps,l.unknown || result.unphased ? `${t('engineering.incomplete')} (${l.unknown} + ${result.unphased})` : '']) })),
    table('reportAssignments',['equipment','circuit','phase','powerW','factor','knownPower','unknown'],Object.values(p.equipment).map(e => [e.name,circuits.find(c => c.id === e.powerCircuitId)?.name ?? t('engineering.unassigned'),e.powerPhase ?? '',e.powerW ?? null,e.powerFactor ?? null,equipmentPower(e).watts,equipmentPower(e).unknown || null]))]
  const intercom = [table('reportIntercom',['equipment','port','channel','group'],communicationPorts(p,false).map(({e,port}) => [e.name,port.name,port.intercom?.channel ?? '',port.intercom?.group ?? '']))]
  const sync = [table('reportSync',['equipment','port','protocol','domain','role','rate'],communicationPorts(p,true).map(({e,port}) => [e.name,port.name,port.clock?.protocol ?? '',port.clock?.domain ?? '',port.clock ? t(`engineering.roles.${port.clock.role}`) : '',port.clock?.rate ?? '']))]
  for (const [name, issues] of [['network',networkIssues(p)],['sync',clockIssues(p)]] as const) if (issues.length) (name === 'network' ? network : sync).push(table('reportAlerts',['equipment','unknown'],issues.map(i => [i.subject,`${t(`engineering.issues.${i.code}`)} ${i.detail ?? ''}`])))
  for (const [syncView,list] of [[false,intercom],[true,sync]] as const) {
    const ports = communicationPorts(p,syncView).filter(x => !syncView || x.port.signal === 'sync' || x.port.clock)
    const refs = new Set(ports.map(x => JSON.stringify([x.e.id,x.port.id])))
    list.push(table('connections',['link','source','target'],Object.values(p.links).filter(l => refs.has(JSON.stringify([l.source.equipmentId,l.source.portId])) || refs.has(JSON.stringify([l.target.equipmentId,l.target.portId]))).map(l => { const a = p.equipment[l.source.equipmentId], b = p.equipment[l.target.equipmentId]; return [l.label,`${a?.name ?? ''} / ${a?.ports.find(x => x.id === l.source.portId)?.name ?? ''}`,`${b?.name ?? ''} / ${b?.ports.find(x => x.id === l.target.portId)?.name ?? ''}`] })))
  }
  return { network, power, intercom, sync, lists: [...network, ...power, ...intercom, ...sync] }
}

/** Tableaux vectoriels : pages bornées, entêtes répétés, mêmes cartouche/filigrane que les schémas. */
export function deploymentSheets(p: Project, view: string, opts: ExportSettings, info: ProjectInfo, t: TFunction): SheetShot[] {
  const tables = (deploymentTables(p,t)[view] ?? []).filter(table => table.rows.length > 0)
  const {area} = sheetLayout(opts.paper,opts.orientation,0,info.revisions?.length ?? 0)
  const shots: SheetShot[] = [], rowsPerPage = Math.max(1,Math.floor((area.h - 24) / 15))
  for (const table of tables) {
    for (let offset = 0; offset < Math.max(1,table.rows.length); offset += rowsPerPage) {
      if (shots.length >= 200) throw new Error(t('plan.tooManyPages'))
      const rows = table.rows.slice(offset,offset + rowsPerPage)
      shots.push({ name: table.name, dataUrl:'',width:area.w,height:area.h,draw(doc,a) {
        doc.setFont('helvetica','normal'); doc.setTextColor(30); doc.setFontSize(8)
        const width = a.w / table.keys.length
        doc.text(t('engineering.reportHint'),a.x,a.y + 4,{maxWidth:a.w})
        const row = (values: (string | number | null)[], y: number, header = false) => {
          const shade = header ? 228 : 250
          doc.setFillColor(shade,shade,shade);doc.rect(a.x,y,a.w,15,'F');doc.setFontSize(7)
          values.forEach((value,col) => { const text = typeof value === 'number' ? Number(value.toFixed(3)).toString() : String(value ?? ''); const lines = doc.splitTextToSize(text,width - 3) as string[]; if (lines.length > 4) lines.splice(3,lines.length - 3,`${lines[3].slice(0,-2)}…`);doc.text(lines,a.x + col * width + 1,y + 3) })
        }
        row(table.keys,a.y + 9,true); rows.forEach((r,i) => row(r,a.y + 24 + i * 15))
      } })
    }
  }
  return shots
}
