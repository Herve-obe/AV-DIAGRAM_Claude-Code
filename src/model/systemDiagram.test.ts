import { expect, it } from 'vitest'
import { GENERIC_LIBRARY } from '../library/generic'
import * as ops from './project'
import { connectSystem } from './systemDiagram'

it('ne confond pas deux protocoles numériques sur le même connecteur', () => {
  const template = GENERIC_LIBRARY.find(t => t.id === 'gen-stagebox-madi')!
  let project = ops.createProject('Protocoles')
  const from = ops.addEquipment(project, template, { x: 0, y: 0 }); project = from.project
  const to = ops.addEquipment(project, { ...template, ports: template.ports.map(p => ({ ...p, format: p.signal === 'audioDigital' ? 'S/PDIF' : p.format })) }, { x: 300, y: 0 }); project = to.project
  const roles = new Map([['source', [from.id]], ['target', [to.id]]]), links = [{ from: 'source', to: 'target', signal: 'audioDigital' }]
  expect(connectSystem(project, roles, links)).toHaveProperty('error')
  expect(Object.keys(project.links)).toHaveLength(0)
  const compatible = ops.updateEquipment(project, to.id, { ports: template.ports })
  const result = connectSystem(compatible, roles, links)
  expect('error' in result).toBe(false)
  if ('project' in result) expect(Object.keys(result.project.links)).toHaveLength(1)
})
