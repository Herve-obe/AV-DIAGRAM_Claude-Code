import { describe, expect, it } from 'vitest'
import { deflateSync, strToU8, zipSync } from 'fflate'
import { readDiagram, readDrawio, readVisio, drawioXml } from './diagramExchange'
import { parseXml, inflatedPage, visioArchive } from './diagramXml'
import { addEquipment, connect, createProject } from '../model/project'
import { GENERIC_LIBRARY } from '../library/generic'

const graph='<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><object id="a" label="Caméra &amp; régie"><mxCell parent="1" vertex="1"><mxGeometry x="20" y="30" width="120" height="60" as="geometry"/></mxCell></object><mxCell id="b" value="Moniteur" vertex="1" parent="1"><mxGeometry x="400" y="30" width="120" height="60" as="geometry"/></mxCell><mxCell id="e" edge="1" parent="1" source="a" target="b" value="SDI" style="endArrow=block;"><mxGeometry relative="1" as="geometry"/></mxCell></root></mxGraphModel>'
export function visioFixture():Uint8Array {
  const c=(name:string,value:number)=>`<Cell N="${name}" V="${value}"/>`
  const shape=(id:string,x:number)=>`<Shape ID="${id}">${c('PinX',x)}${c('PinY',5)}${c('Width',2)}${c('Height',1)}<Text>Équipement ${id}</Text></Shape>`
  return zipSync({
    'visio/pages/pages.xml':strToU8('<Pages xmlns:r="rels"><Page ID="0" Name="Plateau"><PageSheet>'+c('PageWidth',12)+c('PageHeight',8)+'</PageSheet><Rel r:id="r1"/></Page></Pages>'),
    'visio/pages/_rels/pages.xml.rels':strToU8('<Relationships><Relationship Id="r1" Target="page1.xml"/></Relationships>'),
    'visio/pages/page1.xml':strToU8(`<PageContents><Shapes>${shape('1',2)}${shape('2',7)}<Shape ID="3" OneD="1">${c('BeginX',3)}${c('BeginY',5)}${c('EndX',6)}${c('EndY',5)}${c('EndArrow',13)}<Text>SDI</Text></Shape></Shapes><Connects><Connect FromSheet="3" FromCell="BeginX" ToSheet="1" ToCell="Connections.X1"/><Connect FromSheet="3" FromCell="EndX" ToSheet="2" ToCell="Connections.X2"/></Connects></PageContents>`)
  })
}
describe('échanges de synoptiques',()=>{
  it('lit le XML brut, les objets englobants et la topologie explicite',()=>{
    const p=readDrawio(graph)[0]
    expect(p.shapes.map(s=>s.label)).toEqual(['Caméra & régie','Moniteur'])
    expect(p.shapes[0]).toMatchObject({x:20,y:30,w:120,h:60})
    expect(p.edges[0]).toMatchObject({source:{shape:'a'},target:{shape:'b'},directed:true,label:'SDI'})
  })
  it('lit plusieurs pages dont une page deflate URI/base64',()=>{
    const bytes=deflateSync(strToU8(encodeURIComponent(graph))),base64=btoa(String.fromCharCode(...bytes))
    const p=readDrawio(`<mxfile><diagram name="Brut">${graph}</diagram><diagram name="Compressé">${base64}</diagram></mxfile>`)
    expect(p.map(p=>p.name)).toEqual(['Brut','Compressé']);expect(p[1].edges).toEqual(p[0].edges)
  })
  it('résout groupes et ports relatifs sans créer un équipement pour chaque port',()=>{
    const xml=graph.replace('<mxCell id="b"','<mxCell id="p" value="SDI OUT" vertex="1" parent="a"><mxGeometry relative="1" x="1" y="0.5" width="8" height="8" as="geometry"/></mxCell><mxCell id="b"').replace('source="a"','source="p"')
    const p=readDrawio(xml)[0];expect(p.shapes).toHaveLength(2);expect(p.edges[0].source).toMatchObject({shape:'a',port:'p',name:'SDI OUT'})
  })
  it('refuse les DTD, XML malformés, identifiants répétés et cycles de parents',()=>{
    expect(()=>parseXml('<!DOCTYPE a [<!ENTITY x SYSTEM "file:///secret">]><a>&x;</a>')).toThrow('unsafe')
    expect(()=>parseXml('<a><b></a>')).toThrow()
    expect(()=>readDrawio(graph.replace('id="b"','id="a"'))).toThrow('invalid')
    expect(()=>readDrawio(graph.replace('id="a" label','id="a" label').replace('parent="1" vertex="1"','parent="a" vertex="1"'))).toThrow('invalid')
  })
  it('borne les fichiers et la décompression réelle, pas seulement les tailles déclarées',()=>{
    expect(()=>readDiagram(new Uint8Array(10_000_001),'x.drawio')).toThrow('large')
    expect(()=>inflatedPage(deflateSync(strToU8('x'.repeat(10_000_001))))).toThrow('large')
    expect(()=>visioArchive(zipSync({'visio/pages/bomb.xml':strToU8('x'.repeat(10_000_001))}))).toThrow('large')
  })
  it('lit les pages, coordonnées pouces et extrémités Visio sans exécuter de formule',()=>{
    const p=readVisio(visioFixture())[0]
    expect(p.shapes[0]).toMatchObject({id:'1',x:72,y:180,w:144,h:72})
    expect(p.edges[0]).toMatchObject({source:{shape:'1',port:'Connections.X1'},target:{shape:'2',port:'Connections.X2'},directed:true})
    expect(p.edges[0].points).toEqual([{x:216,y:216},{x:432,y:216}])
  })
  it('ignore les références externes et refuse un chemin ZIP ambigu',()=>{
    expect(()=>readVisio(zipSync({'visio/pages/pages.xml':strToU8('<Pages><Page><Rel r:id="r"/></Page></Pages>')}))).toThrow()
    expect(()=>visioArchive(zipSync({'../visio/pages/x.xml':strToU8('<a/>')}))).toThrow('invalid')
  })
  it('reprend les valeurs absentes des masters et transforme les enfants d’un groupe Visio',()=>{
    const files=visioArchive(visioFixture())
    files.set('visio/masters/masters.xml','<Masters xmlns:r="r"><Master ID="5"><Rel r:id="m"/></Master></Masters>')
    files.set('visio/masters/_rels/masters.xml.rels','<Relationships><Relationship Id="m" Target="master1.xml"/></Relationships>')
    files.set('visio/masters/master1.xml','<MasterContents><Shapes><Shape ID="100"><Cell N="Width" V="2"/><Cell N="Height" V="1"/></Shape></Shapes></MasterContents>')
    const page=files.get('visio/pages/page1.xml')!.replace('<Shape ID="1">','<Shape ID="1" Master="5">').replace('<Cell N="Width" V="2"/>','').replace('<Cell N="Height" V="1"/>','')
    files.set('visio/pages/page1.xml',page)
    const zip=()=>zipSync(Object.fromEntries([...files].map(([k,v])=>[k,strToU8(v)])))
    expect(readVisio(zip())[0].shapes[0].w).toBe(144)
    files.set('visio/pages/page1.xml',page.replace('<Shapes>','<Shapes><Shape ID="10"><Cell N="PinX" V="1"/><Cell N="PinY" V="1"/><Cell N="LocPinX" V="0"/><Cell N="LocPinY" V="0"/><Shapes>').replace('</Shapes><Connects>','</Shapes></Shape></Shapes><Connects>'))
    expect(readVisio(zip())[0].shapes[0]).toMatchObject({x:144,y:108})
  })
  it('exporte les renvois entre feuilles sans les confondre avec des équipements',()=>{
    const template={...GENERIC_LIBRARY[0],ports:[{id:'p1',name:'Out',direction:'out' as const,signal:'video' as const,connector:'bnc'}]}
    const a=addEquipment(createProject('Renvois'),template,{x:0,y:0}),b=addEquipment(a.project,{...template,ports:[{...template.ports[0],direction:'in'}]},{x:400,y:0})
    const p=b.project,ap=p.equipment[a.id].ports.find(q=>q.direction==='out')!,bp=p.equipment[b.id].ports.find(q=>q.direction==='in')!
    const linked=connect(p,{equipmentId:a.id,portId:ap.id},{equipmentId:b.id,portId:bp.id}).project
    linked.sheets!.push({id:'s2',name:'Régie'});linked.equipment[b.id].sheetId='s2'
    const pages=readDrawio(drawioXml(linked))
    expect(pages).toHaveLength(2);expect(pages[0].notes.join(' ')).toContain('Régie');expect(pages[0].warnings).toContain('dangling')
  })
  it('exporte des pages draw.io éditables avec ports et données de signal explicites',()=>{
    const tpl={...GENERIC_LIBRARY[0],ports:[{id:'sdi',name:'SDI <1>',direction:'out' as const,signal:'video' as const,connector:'bnc'}]}
    const a=addEquipment(createProject('Exemple'),tpl,{x:20,y:30}),b=addEquipment(a.project,{...tpl,ports:[{...tpl.ports[0],direction:'in'}]},{x:400,y:30})
    const p=connect(b.project,{equipmentId:a.id,portId:'sdi'},{equipmentId:b.id,portId:'sdi'}).project
    const xml=drawioXml(p),page=readDrawio(xml)[0]
    expect(page.shapes).toHaveLength(2);expect(page.edges).toHaveLength(1)
    expect(page.edges[0].source).toMatchObject({name:'SDI <1>',direction:'out',signal:'video',connector:'bnc'})
    expect(page.edges[0].target?.direction).toBe('in')
    expect(()=>drawioXml(createProject('Vide'))).toThrow('empty')
  })
})
