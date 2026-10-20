import { expect, it } from 'vitest'
import { jsPDF } from 'jspdf'
import i18n from '../i18n'
import { addEquipment, createProject } from '../model/project'
import { GENERIC_LIBRARY } from '../library/generic'
import { deploymentSheets, deploymentTables } from './deploymentExport'
import { diagramDrawing, type CadDiagramGeometry } from './cadExport'
import { exportSettingsOf, sheetLayout } from './exportOptions'

it('pagine les tableaux vectoriels avec leurs entêtes sans modifier le projet', () => {
  let p = createProject('Reports')
  const model = {...GENERIC_LIBRARY[0],ports:[{id:'eth',name:'Ethernet',signal:'network' as const,direction:'bidir' as const,connector:'rj45'}]}
  for (let n = 0; n < 35; n++) p = addEquipment(p,model,{x:0,y:0}).project
  const before = JSON.stringify(p), opts = {...exportSettingsOf(p),paper:'A4' as const,orientation:'portrait' as const}
  const shots = deploymentSheets(p,'network',opts,{},i18n.t)
  expect(shots.filter(s => s.name === 'Interfaces réseau').length).toBeGreaterThan(1)
  expect(shots.every(s => s.name === 'Interfaces réseau')).toBe(true)
  const doc = new jsPDF({format:'a4',unit:'mm'}), {area} = sheetLayout(opts.paper,opts.orientation,0,0)
  for (const s of shots) s.draw!(doc,area)
  expect(doc.output()).toContain('IPv4')
  expect(deploymentTables(p,i18n.t).network[0].rows[0][2]).toBe('')
  expect(JSON.stringify(p)).toBe(before)
})
it('exporte exactement la géométrie mesurée, sans réintroduire les ports repliés', () => {
  const r = addEquipment(createProject('DXF'),GENERIC_LIBRARY[0],{x:0,y:0})
  const geometry: CadDiagramGeometry = {boxes:new Map([[r.id,{x:-100,y:20,w:400,h:120,ports:new Map()}]]),routes:new Map()}
  const drawing = diagramDrawing(r.project,'sh-1',geometry)
  expect(drawing.paths[0].points).toEqual([{x:-1,y:.2},{x:3,y:.2},{x:3,y:1.4},{x:-1,y:1.4}])
  expect(drawing.texts.some(t => t.layer === 'AVD_PORTS')).toBe(false)
})
it('respecte le repliage mémorisé même sans mesure du canevas pour le DXF', () => {
  const r = addEquipment(createProject('DXF'), GENERIC_LIBRARY[0], { x: 0, y: 0 })
  const eq = r.project.equipment[r.id]
  eq.portsExpanded = false
  expect(diagramDrawing(r.project, 'sh-1').texts.some(t => t.layer === 'AVD_PORTS')).toBe(false)
  eq.portsExpanded = true
  expect(diagramDrawing(r.project, 'sh-1').texts.filter(t => t.layer === 'AVD_PORTS')).toHaveLength(eq.ports.length)
})
