import { expect, it } from 'vitest'
import * as Y from 'yjs'
import { addEquipment, connect, createProject, duplicateEquipment, isProject, templateFromEquipment, updateEquipment, updatePort, updateSettings } from './project'
import { ipv4, isNetwork } from './deployment'
import { networkIssues } from './network'
import { circuitLoad, removeCircuit } from './power'
import { clockIssues } from './communications'
import { readProject, writeProject } from '../collab/ydoc'
import { checkGuestChange } from '../collab/access'
import type { EquipmentTemplate, PowerCircuit } from './types'

const tpl: EquipmentTemplate = { id:'network-test',model:'Switch',family:'network',pictogram:'switch',status:'generic',ports:[{id:'p',name:'Port',direction:'bidir',signal:'network',connector:'rj45'}] }
function fixture() { const a = addEquipment(createProject('Engineering'),tpl,{x:0,y:0}), b = addEquipment(a.project,tpl,{x:400,y:100}); const c = connect(b.project,{equipmentId:a.id,portId:'p'},{equipmentId:b.id,portId:'p'}); return {p:c.project,a:a.id,b:b.id,link:c.id!} }
it('valide IPv4/VLAN/débits et compare les budgets réseau sans traiter inconnu comme zéro', () => {
  expect(ipv4('192.168.1.255')).toBe(3232236031)
  for (const address of ['192.168.001.1','256.1.1.1','1.2.3','1e1.0.0.1']) expect(ipv4(address)).toBeUndefined()
  expect(isNetwork({vlan:4095})).toBe(false)
  expect(isNetwork({prefix:33,capacityMbps:Infinity})).toBe(false)
  expect(isNetwork({taggedVlans:[10,10]})).toBe(false)
  const f = fixture()
  let p = updatePort(f.p,f.a,'p',{network:{address:'10.1.0.1',prefix:24,vlan:10,capacityMbps:100,poe:'source',poeW:15}})
  p = updatePort(p,f.b,'p',{network:{address:'10.1.0.1',prefix:24,vlan:10,poe:'sink',poeW:20}})
  p = updateEquipment(p,f.a,{poeBudgetW:10})
  p = {...p,links:{...p.links,[f.link]:{...p.links[f.link],bitrateMbps:150}}}
  expect(networkIssues(p).map(x => x.code)).toEqual(expect.arrayContaining(['duplicateIp','bandwidth','poePort','poeBudget']))
  p = updatePort(p,f.b,'p',{network:{address:'10.2.0.1',prefix:24,vlan:10,poe:'sink'}})
  expect(networkIssues(p).map(x => x.code)).toEqual(expect.arrayContaining(['subnetMismatch','poeUnknown']))
  p = updatePort(p,f.b,'p',{network:{address:'10.1.0.1',prefix:24,vlan:20}})
  expect(networkIssues(p).map(x => x.code)).toContain('vlanMismatch')
  expect(networkIssues(p).map(x => x.code)).not.toContain('duplicateIp')
})
it('calcule chaque phase séparément, conserve les inconnues et retire un circuit atomiquement', () => {
  const c: PowerCircuit = {id:'c',name:'Plateau',phases:3,voltage:230,ratedA:10}
  let p = updateSettings(createProject('Power'),{powerCircuits:[c]})
  for (const [powerW,powerFactor,powerPhase] of [[2300,1,'L1'],[460,.5,'L2'],[230,undefined,'L3'],[1380,1,'ABC'],[100,1,undefined]] as const) {
    const r = addEquipment(p,tpl,{x:0,y:0}); p = updateEquipment(r.project,r.id,{powerW,powerFactor,powerPhase,powerCircuitId:c.id})
  }
  const load = circuitLoad(p,c)
  expect(load.loads.map(x => x.amps)).toEqual([12,6,2])
  expect(load.loads[2].unknown).toBe(1)
  expect(load.unphased).toBe(1)
  const removed = removeCircuit(p,c.id)
  expect(removed.settings.powerCircuits).toEqual([])
  expect(Object.values(removed.equipment).every(x => !x.powerCircuitId && !x.powerPhase)).toBe(true)
  expect(p.settings.powerCircuits).toHaveLength(1)
})
it('repère les maîtres forcés concurrents et ne confond pas les candidats automatiques', () => {
  const f = fixture(), clock = {protocol:'PTPv2',domain:'0',role:'master' as const,rate:'48 kHz'}
  let p = updatePort(f.p,f.a,'p',{clock})
  const source = p.equipment[f.a]
  const fanout = updateEquipment(p,f.a,{ports:[...source.ports,{...source.ports[0],id:'clock-2',name:'Clock OUT 2'}]})
  expect(clockIssues(fanout)).toEqual([])
  p = updatePort(p,f.b,'p',{clock:{...clock,rate:'96 kHz'}})
  expect(clockIssues(p).map(x => x.code)).toEqual(['clockMasters','clockRates'])
  p = updatePort(p,f.b,'p',{clock:{...clock,role:'auto'}})
  expect(clockIssues(p)).toEqual([])
  p = updatePort(p,f.a,'p',{clock:{...clock,role:'follower'}})
  p = updatePort(p,f.b,'p',{clock:undefined})
  expect(clockIssues(p)[0].code).toBe('clockSource')
})
it('préserve fichier/Yjs/droits et ne réplique pas les affectations uniques dans un modèle ou une copie', () => {
  const f = fixture(), port = {network:{address:'10.0.0.1',prefix:24,vlan:100,capacityMbps:1000},clock:{protocol:'PTP',domain:'42',role:'master' as const},intercom:{channel:'A'}}
  const p = updatePort(f.p,f.a,'p',port)
  expect(isProject(JSON.parse(JSON.stringify(p)))).toBe(true)
  const doc = new Y.Doc(); writeProject(doc,null,p)
  expect(readProject(doc).equipment[f.a].ports[0]).toEqual(p.equipment[f.a].ports[0])
  const n = updatePort(p,f.a,'p',{network:{...port.network,vlan:200}})
  expect(checkGuestChange(p,n,new Set(['network']),'network')).toBe(true)
  expect(checkGuestChange(p,n,new Set(['sound']),'sound')).toBe(false)
  expect(checkGuestChange(p,updateSettings(p,{powerCircuits:[{id:'c',name:'Main',phases:1,voltage:230}]}),new Set(['network']),'network')).toBe(false)
  const model = templateFromEquipment(p.equipment[f.a])
  expect(model.ports[0].network?.address).toBeUndefined()
  expect(model.ports[0].network?.capacityMbps).toBe(1000)
  expect(model.ports[0].clock).toBeUndefined()
  const copy = duplicateEquipment(p,[f.a])
  expect(copy.project.equipment[copy.ids[0]].ports[0].network?.address).toBeUndefined()
  expect(copy.project.equipment[copy.ids[0]].ports[0].clock?.role).toBe('auto')
  expect(updatePort(p,f.a,'p',{network:{address:'invalid'}})).toBe(p)
  expect(isProject({...p,settings:{...p.settings,powerCircuits:[{id:'c',name:'Invalid',phases:2,voltage:230}]}})).toBe(false)
})
