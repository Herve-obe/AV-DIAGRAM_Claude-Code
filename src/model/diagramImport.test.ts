import { expect, it } from 'vitest'
import { interpretDiagram } from './diagramImport'
import { buildImport, defaultChoices } from '../io/pdfImport/build'
import { readDrawio } from '../io/diagramExchange'
import { createProject, isProject } from './project'
import { useProject } from '../store/projectStore'

it('conserve la topologie, signale les déductions et applique un import annulable sur une nouvelle feuille',()=>{
  const xml='<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="a" vertex="1" value="Source" parent="1"><mxGeometry x="10" y="10" width="100" height="60"/></mxCell><mxCell id="b" vertex="1" value="Cible" parent="1"><mxGeometry x="300" y="10" width="100" height="60"/></mxCell><mxCell id="l" edge="1" value="SDI" source="a" target="b" parent="1"/></root></mxGraphModel>'
  const {interpretation:r,drawing}=interpretDiagram(readDrawio(xml)[0],[])
  expect(r.equipment[0].familyFrom).toBe('default');expect(r.links[0].signalFrom).toBe('keyword')
  expect(r.equipment[0].ports[0]).toMatchObject({connector:'unspecified',unnamed:true,direction:'out'})
  expect(drawing.paths[0].points[0].x*1000/Math.max(drawing.width,drawing.height)).toBeCloseTo(r.equipment[0].box.x)
  const p=createProject('Existant'),before=JSON.stringify(p),out=buildImport(p,r,defaultChoices(r,'test.drawio'),new Map())
  expect(JSON.stringify(p)).toBe(before);expect(Object.keys(out.project.equipment)).toHaveLength(2);expect(Object.keys(out.project.links)).toHaveLength(1);expect(isProject(out.project)).toBe(true)
  useProject.getState().load(p);const loaded=useProject.getState().project;useProject.getState().replaceProject(out.project);useProject.getState().undo();expect(useProject.getState().project).toEqual(loaded)
})
