import type { CadDrawing, EquipmentFamily, EquipmentTemplate } from './types'
import type { DiagramPage } from '../io/diagramExchange'
import { matchTemplate, PICTOGRAM_OF, signalOf, type ImportedEquipment, type ImportedPort, type PageInterpretation } from '../io/pdfImport/interpret'

/** Les extrémités du document sont conservées ; aucune prise constructeur n'est inventée. */
export function interpretDiagram(page: DiagramPage, library: EquipmentTemplate[], index = 1): { interpretation: PageInterpretation; drawing: CadDrawing } {
  const k=1000/Math.max(100,page.width,page.height)
  const equipment: ImportedEquipment[] = page.shapes.map(s => {
    const match = matchTemplate(s.label, library), declared = s.family && Object.hasOwn(PICTOGRAM_OF, s.family) ? s.family as EquipmentFamily : undefined
    const family = match?.family ?? declared ?? 'processing'
    return { key:s.id,name:s.label.split('\n')[0],model:s.label,notes:[],box:{x:s.x*k,y:s.y*k,w:s.w*k,h:s.h*k},ports:[],family,familyFrom:match||declared?'document':'default',pictogram:PICTOGRAM_OF[family],links:0,...(match?{match:{templateId:match.id,label:`${match.manufacturer??''} ${match.model}`.trim()}}:{}) }
  })
  const map=new Map(equipment.map(e=>[e.key,e])), links:PageInterpretation['links']=[]
  let unresolved=0
  for(const line of page.edges){
    const a=line.source&&map.get(line.source.shape), b=line.target&&map.get(line.target.shape)
    if(!a||!b||a===b){unresolved++;continue}
    const inferred=signalOf([line.source?.name,line.target?.name,line.label].filter(Boolean).join(' ')), signal=line.source?.signal??line.target?.signal??inferred?.signal??'audioAnalog'
    const port=(e:ImportedEquipment,end:NonNullable<typeof line.source>,source:boolean):ImportedPort=>{
      const key=end.port??`${line.id}:${source?'source':'target'}`,exists=e.ports.find(p=>p.key===key)
      if(exists){if((source&&exists.direction==='in')||(!source&&exists.direction==='out'))exists.direction='bidir';return exists}
      const p:ImportedPort={key,name:end.name||key,unnamed:!end.name,direction:end.direction??(line.directed?(source?'out':'in'):'bidir'),directionFrom:end.direction||line.directed?'document':'default',signal,signalFrom:end.signal?'document':inferred?'keyword':'default',connector:end.connector??'unspecified',side:source?'right':'left',along:e.ports.length}
      e.ports.push(p);return p
    }
    const ap=port(a,line.source!,true),bp=port(b,line.target!,false)
    a.links++;b.links++
    const points=line.points.length>1?line.points.map(p=>[p.x*k,p.y*k] as [number,number]):[[a.box.x+a.box.w,a.box.y+a.box.h/2],[b.box.x,b.box.y+b.box.h/2]] as [number,number][]
    links.push({key:line.id,from:{eq:a.key,port:ap.key},to:{eq:b.key,port:bp.key},ref:line.label||undefined,signal,signalFrom:line.source?.signal||line.target?.signal?'document':inferred?'keyword':'default',color:line.color,points})
  }
  const interpretation:PageInterpretation={page:index,width:page.width*k,height:page.height*k,kind:equipment.length||page.edges.length?'vector':'empty',equipment,links,looseText:page.notes,unresolved}
  const drawing:CadDrawing={name:page.name,width:page.width,height:page.height,paths:[],texts:[]}
  // L'aperçu existant ramène le grand côté à 1000 ; aucune échelle physique n'est attribuée.
  const scale=1/k
  for(const e of equipment){const b=e.box;drawing.paths.push({layer:'Shapes',closed:true,points:[{x:b.x*scale,y:b.y*scale},{x:(b.x+b.w)*scale,y:b.y*scale},{x:(b.x+b.w)*scale,y:(b.y+b.h)*scale},{x:b.x*scale,y:(b.y+b.h)*scale}]});drawing.texts.push({layer:'Text',x:(b.x+5)*scale,y:(b.y+15)*scale,text:e.name.slice(0,2000),height:Math.min(12,b.h/3)*scale,angle:0})}
  for(const l of links)drawing.paths.push({layer:'Connections',points:l.points.map(([x,y])=>({x:x*scale,y:y*scale}))})
  return {interpretation,drawing}
}
