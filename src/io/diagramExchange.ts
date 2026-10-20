import { child, children, descendants, inflatedPage, parseXml, plainText, textOf, visioArchive, xmlEscape, type XmlNode } from './diagramXml'
import type { PortDef, Project } from '../model/types'
import { portsToDisplay } from '../model/portDisplay'
import { SIGNAL_FAMILIES, SIGNAL_STYLE } from '../model/signals'

type Point = { x: number; y: number }
export interface DiagramShape { id: string; label: string; x: number; y: number; w: number; h: number; family?: string }
export interface DiagramEnd { shape: string; port?: string; name?: string; signal?: PortDef['signal']; connector?: string; direction?: PortDef['direction'] }
export interface DiagramEdge { id: string; label: string; source?: DiagramEnd; target?: DiagramEnd; points: Point[]; directed: boolean; color: string }
export interface DiagramPage { name: string; width: number; height: number; shapes: DiagramShape[]; edges: DiagramEdge[]; warnings: string[]; notes: string[] }
const num = (s: string | undefined, fallback = 0) => { const v = s === undefined ? fallback : Number(s); if (!Number.isFinite(v) || Math.abs(v) > 1_000_000) throw new Error('invalid'); return v }
const styleOf = (s = '') => new Map(s.split(';').map(x => { const i = x.indexOf('='); return i < 0 ? [x, '1'] : [x.slice(0, i), x.slice(i + 1)] }))
const color = (s = '') => /^#[0-9a-f]{6}$/i.test(s) ? s : '#666666'
function finish(page: DiagramPage): DiagramPage {
  const ids = new Set<string>()
  for (const s of [...page.shapes, ...page.edges]) { if (!s.id || s.id.length > 200 || ids.has(s.id)) throw new Error('invalid'); ids.add(s.id) }
  if (page.shapes.length + page.edges.length > 2000) throw new Error('large')
  let minX=0,minY=0,maxX=100,maxY=100,count=0
  const bounds=(x:number,y:number)=>{if(++count>200_000)throw new Error('large');if(!Number.isFinite(x)||!Number.isFinite(y)||Math.abs(x)>1_000_000||Math.abs(y)>1_000_000)throw new Error('invalid');minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y)}
  for(const s of page.shapes){bounds(s.x,s.y);bounds(s.x+s.w,s.y+s.h)}
  for(const e of page.edges)for(const p of e.points)bounds(p.x,p.y)
  const dx=-minX,dy=-minY
  for(const s of page.shapes){s.x+=dx;s.y+=dy}
  for(const e of page.edges)e.points=e.points.map(p=>({x:p.x+dx,y:p.y+dy}))
  page.width=Math.max(100,page.width+dx,maxX+dx+40);page.height=Math.max(100,page.height+dy,maxY+dy+40)
  page.warnings = [...new Set(page.warnings)]
  return page
}

export function readDrawio(xml: string): DiagramPage[] {
  const doc = parseXml(xml), diagrams = doc.name === 'mxGraphModel' ? [doc] : doc.name === 'mxfile' ? children(doc, 'diagram') : []
  if (!diagrams.length || diagrams.length > 50) throw new Error('invalid')
  let expanded = 0
  return diagrams.map((diagram, pageIndex) => {
    let model = diagram.name === 'mxGraphModel' ? diagram : child(diagram, 'mxGraphModel')
    if (!model) {
      const encoded = diagram.text.trim(); if (!/^[a-z0-9+/=\s]+$/i.test(encoded)) throw new Error('invalid')
      let text = inflatedPage(Uint8Array.from(atob(encoded), c => c.charCodeAt(0)))
      if (!text.trimStart().startsWith('<')) text = decodeURIComponent(text)
      expanded += text.length; if (expanded > 20_000_000) throw new Error('large')
      model = parseXml(text)
    }
    if (model.name !== 'mxGraphModel') throw new Error('invalid')
    const root = child(model, 'root'); if (!root) throw new Error('invalid')
    const cells = descendants(root, 'mxCell'), map = new Map<string, XmlNode>()
    const wrappers = new Map(root.children.filter(c => c.name !== 'mxCell').map(c => [child(c, 'mxCell'), c]))
    for (const c of cells) { const id=c.attrs.id??wrappers.get(c)?.attrs.id; if (!id || map.has(id)) throw new Error('invalid');c.attrs.id=id; map.set(id, c) }
    const page: DiagramPage = { name: plainText(diagram.attrs.name ?? `Page ${pageIndex + 1}`), width: Math.max(100, num(model.attrs.pageWidth, 1123)), height: Math.max(100, num(model.attrs.pageHeight, 794)), shapes: [], edges: [], warnings: [], notes: [] }
    const boxes = new Map<string, { x: number; y: number; w: number; h: number }>()
    const box = (id: string, chain = new Set<string>()): { x: number; y: number; w: number; h: number } => {
      const cached = boxes.get(id); if (cached) return cached
      if (chain.has(id) || chain.size > 64) throw new Error('invalid')
      const c = map.get(id); if (!c) return { x: 0, y: 0, w: 0, h: 0 }
      chain.add(id); const parent = c.attrs.parent ? box(c.attrs.parent, chain) : { x: 0, y: 0, w: 0, h: 0 }; chain.delete(id)
      const g = child(c, 'mxGeometry'), offset = g?.children.find(n => n.attrs.as === 'offset'), relative = g?.attrs.relative === '1' && c.attrs.vertex === '1'
      const b = { x: parent.x + num(g?.attrs.x) * (relative ? parent.w : 1) + num(offset?.attrs.x), y: parent.y + num(g?.attrs.y) * (relative ? parent.h : 1) + num(offset?.attrs.y), w: Math.max(1, num(g?.attrs.width, 120)), h: Math.max(1, num(g?.attrs.height, 60)) }
      if (c.attrs.vertex !== '1') { b.w = parent.w; b.h = parent.h }
      boxes.set(id, b); return b
    }
    const label = (c: XmlNode) => {const value=c.attrs.value ?? wrappers.get(c)?.attrs.label ?? '';return styleOf(c.attrs.style).get('html')==='1'?plainText(value):value.trim().slice(0,2000)}
    const port = (c: XmlNode) => c.attrs.avdRole === 'port' || (child(c, 'mxGeometry')?.attrs.relative === '1' && map.get(c.attrs.parent)?.attrs.vertex === '1')
    const container = (c: XmlNode) => c.attrs.avdRole !== 'equipment' && (styleOf(c.attrs.style).has('group') || styleOf(c.attrs.style).get('container') === '1')
    for (const c of cells.filter(c => c.attrs.vertex === '1')) {
      const b = box(c.attrs.id), style = styleOf(c.attrs.style)
      if (style.has('image') || style.get('shape') === 'image') page.warnings.push('images')
      if(style.get('shape')||style.has('ellipse')||style.has('swimlane'))page.warnings.push('appearance')
      if (num(style.get('rotation')) || style.get('flipH') === '1' || style.get('flipV') === '1') page.warnings.push('transforms')
      if (port(c)) continue
      if (container(c)) { page.warnings.push('groups'); if (label(c)) page.notes.push(label(c)); continue }
      if (style.has('text') || c.attrs.avdRole === 'annotation') { if (label(c)) page.notes.push(label(c)); continue }
      if (c.attrs.visible === '0') { page.warnings.push('hidden'); continue }
      page.shapes.push({ id: c.attrs.id, label: label(c) || c.attrs.id, ...b, family: c.attrs.avdFamily })
      page.width = Math.max(page.width, b.x + b.w + 40); page.height = Math.max(page.height, b.y + b.h + 40)
    }
    const kept = new Set(page.shapes.map(s => s.id))
    const end = (id: string | undefined): DiagramEnd | undefined => {
      if (!id) return undefined
      const c = map.get(id); if (!c) return undefined
      const owner = port(c) ? c.attrs.parent : id
      if (!kept.has(owner)) return undefined
      return { shape: owner, ...(port(c) ? { port: id, name: label(c) } : {}), ...(SIGNAL_FAMILIES.includes(c.attrs.avdSignal as PortDef['signal']) ? { signal: c.attrs.avdSignal as PortDef['signal'] } : {}), connector: c.attrs.avdConnector?.slice(0,200), ...(['in','out','bidir'].includes(c.attrs.avdDirection)?{direction:c.attrs.avdDirection as PortDef['direction']}: {}) }
    }
    for (const c of cells.filter(c => c.attrs.edge === '1')) {
      const g = child(c, 'mxGeometry'), style = styleOf(c.attrs.style), parent = box(c.attrs.parent), points: Point[] = []
      const source = end(c.attrs.source), target = end(c.attrs.target)
      for (const name of ['sourcePoint', 'points', 'targetPoint']) {
        const n = g?.children.find(n => n.attrs.as === name)
        for (const p of n ? n.name === 'mxPoint' ? [n] : children(n, 'mxPoint') : []) points.push({ x: parent.x + num(p.attrs.x), y: parent.y + num(p.attrs.y) })
      }
      if (points.length > 1000) throw new Error('large')
      const reverse = (style.get('startArrow') ?? 'none') !== 'none' && (style.get('endArrow') ?? 'classic') === 'none'
      page.edges.push({ id: c.attrs.id, label: label(c), source: reverse ? target : source, target: reverse ? source : target, points: reverse ? points.reverse() : points, directed: !(style.get('endArrow') === 'none' && (style.get('startArrow') ?? 'none') === 'none'), color: color(style.get('strokeColor')) })
      if (!source || !target) page.warnings.push('dangling')
    }
    return finish(page)
  })
}

const cell = (n: XmlNode | undefined, name: string, fallback = 0) => num(n && children(n, 'Cell').find(c => c.attrs.N === name)?.attrs.V, fallback)
type Matrix = [number, number, number, number, number, number]
const point = (m: Matrix, x: number, y: number) => ({ x: m[0] * x + m[2] * y + m[4], y: m[1] * x + m[3] * y + m[5] })
const mul = (a: Matrix, b: Matrix): Matrix => [a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]]
function relationship(files: Map<string, string>, path: string, base: string): Map<string, string> {
  const out = new Map<string, string>(), xml = files.get(path); if (!xml) return out
  for (const r of children(parseXml(xml), 'Relationship')) {
    if (r.attrs.TargetMode === 'External') continue
    const parts = r.attrs.Target?.startsWith('/') ? [] : base.split('/').filter(Boolean)
    for (const part of (r.attrs.Target ?? '').split('/')) { if (part === '..') { if (!parts.length) throw new Error('unsafe'); parts.pop() } else if (part && part !== '.') parts.push(part) }
    const target = parts.join('/'); if (!target.startsWith('visio/')) throw new Error('unsafe')
    if (out.has(r.attrs.Id)) throw new Error('invalid'); out.set(r.attrs.Id, target)
  }
  return out
}
export function readVisio(bytes: Uint8Array): DiagramPage[] {
  const files = visioArchive(bytes), pages = files.get('visio/pages/pages.xml'); if (!pages) throw new Error('invalid')
  const rels = relationship(files,'visio/pages/_rels/pages.xml.rels','visio/pages'), masters = new Map<string, XmlNode>()
  const masterList = files.get('visio/masters/masters.xml'), mr = relationship(files,'visio/masters/_rels/masters.xml.rels','visio/masters')
  if (masterList) for (const m of children(parseXml(masterList),'Master')) {
    const file = files.get(mr.get(child(m,'Rel')?.attrs['r:id'] ?? '') ?? '')
    if (file) masters.set(m.attrs.ID, parseXml(file))
  }
  const entries = children(parseXml(pages), 'Page'); if (!entries.length || entries.length > 50) throw new Error('large')
  return entries.map((entry,index) => {
    const xml = files.get(rels.get(child(entry,'Rel')?.attrs['r:id'] ?? '') ?? ''); if (!xml) throw new Error('invalid')
    const doc = parseXml(xml), sheet = child(entry,'PageSheet'), height = cell(sheet,'PageHeight',11.69)
    const page: DiagramPage = { name: entry.attrs.Name ?? `Page ${index+1}`, width: cell(sheet,'PageWidth',16.54)*72, height: height*72, shapes: [], edges: [], warnings: ['appearance'], notes: [] }
    const seen = new Set<string>(), parents = new Map<string,string>(), pending: { node: XmlNode; id: string; matrix: Matrix; effective: XmlNode }[] = []
    const visit = (list: XmlNode | undefined, matrix: Matrix, master?: XmlNode, parent?: string) => {
      for (const shape of list ? children(list,'Shape') : []) {
        const id = shape.attrs.ID; if (!id || seen.has(id)) throw new Error('invalid'); seen.add(id)
        if (seen.size > 4000) throw new Error('large')
        if (shape.attrs.Del === '1') continue
        if (parent) parents.set(id,parent)
        const def = shape.attrs.Master ? masters.get(shape.attrs.Master) : master
        const base = def ? descendants(def,'Shape').find(s => s.attrs.ID === shape.attrs.MasterShape) ?? descendants(def,'Shape')[0] : undefined
        if (shape.attrs.Master && !def) page.warnings.push('masters')
        const merged: XmlNode = { ...shape, children: [...shape.children, ...(base?.children.filter(b => !shape.children.some(s => s.name === b.name && (b.name !== 'Cell' || s.attrs.N === b.attrs.N))) ?? [])] }
        const w = cell(merged,'Width',1), h = cell(merged,'Height',.5), angle = cell(merged,'Angle'), sx = cell(merged,'FlipX') ? -1 : 1, sy = cell(merged,'FlipY') ? -1 : 1
        const local: Matrix = [Math.cos(angle)*sx,Math.sin(angle)*sx,-Math.sin(angle)*sy,Math.cos(angle)*sy,cell(merged,'PinX'),cell(merged,'PinY')]
        const offset = point(local,-cell(merged,'LocPinX',w/2),-cell(merged,'LocPinY',h/2)); local[4]=offset.x;local[5]=offset.y
        const transform = mul(matrix,local), nested = child(shape,'Shapes')
        if (nested) { page.warnings.push('groups'); visit(nested,transform,def,id); continue }
        if (child(merged,'ForeignData')) page.warnings.push('images')
        if (children(merged,'Cell').some(c => c.attrs.F && !/^[-+\d.]+$/.test(c.attrs.F))) page.warnings.push('formulas')
        if (shape.attrs.OneD === '1' || children(merged,'Cell').some(c => c.attrs.N === 'BeginX')) { pending.push({node:shape,id,matrix,effective:merged}); continue }
        const pts = [point(transform,0,0),point(transform,w,0),point(transform,w,h),point(transform,0,h)], xs=pts.map(p=>p.x),ys=pts.map(p=>p.y)
        page.shapes.push({id,label:plainText(textOf(child(merged,'Text'))) || shape.attrs.Name || id,x:Math.min(...xs)*72,y:(height-Math.max(...ys))*72,w:Math.max(1,(Math.max(...xs)-Math.min(...xs))*72),h:Math.max(1,(Math.max(...ys)-Math.min(...ys))*72)})
      }
    }
    visit(child(doc,'Shapes'),[1,0,0,1,0,0])
    const connects = child(doc,'Connects'), kept = new Set(page.shapes.map(s=>s.id))
    const endpoint = (id: string, name: string): DiagramEnd | undefined => {
      const c = connects && children(connects,'Connect').find(c=>c.attrs.FromSheet===id && c.attrs.FromCell===name)
      if (!c || !kept.has(c.attrs.ToSheet)) return undefined
      return {shape:c.attrs.ToSheet,...(c.attrs.ToCell?.startsWith('Connections.')?{port:c.attrs.ToCell}: {})}
    }
    for (const line of pending) {
      const a=point(line.matrix,cell(line.effective,'BeginX'),cell(line.effective,'BeginY')),b=point(line.matrix,cell(line.effective,'EndX'),cell(line.effective,'EndY'))
      const reverse=cell(line.effective,'BeginArrow')>0 && cell(line.effective,'EndArrow')===0
      const source=endpoint(line.id,reverse?'EndX':'BeginX'),target=endpoint(line.id,reverse?'BeginX':'EndX')
      page.edges.push({id:line.id,label:plainText(textOf(child(line.effective,'Text'))),source,target,points:(reverse?[b,a]:[a,b]).map(p=>({x:p.x*72,y:(height-p.y)*72})),directed:cell(line.effective,'BeginArrow')>0||cell(line.effective,'EndArrow')>0,color:'#666666'})
      if(!source||!target)page.warnings.push('dangling')
    }
    if(parents.size)page.warnings.push('groups')
    return finish(page)
  })
}

export function readDiagram(bytes: Uint8Array, name: string): DiagramPage[] {
  if(bytes.length>10_000_000)throw new Error('large')
  const pages=/\.vsdx$/i.test(name)?readVisio(bytes):readDrawio(new TextDecoder('utf-8',{fatal:true}).decode(bytes))
  if(pages.reduce((n,p)=>n+p.shapes.length+p.edges.length,0)>4000)throw new Error('large')
  return pages
}

/** Export visuel éditable, sans prétendre remplacer le .avd et ses données techniques. */
export function drawioXml(p: Project): string {
  const x=xmlEscape, pages:string[]=[]
  for(const sheet of p.sheets??[]) {
    const eqs=Object.values(p.equipment).filter(e=>e.sheetId===sheet.id), notes=Object.values(p.annotations??{}).filter(a=>a.sheetId===sheet.id)
    if(!eqs.length&&!notes.length)continue
    const cells=['<mxCell id="0"/><mxCell id="1" parent="0"/>'],used=new Map<string,Set<string>>()
    for(const l of Object.values(p.links))for(const end of [l.source,l.target]){if(!used.has(end.equipmentId))used.set(end.equipmentId,new Set());used.get(end.equipmentId)!.add(end.portId)}
    const ports=new Map<string,string>(),positions=new Map<string,Point>(),key=(eq:string,port:string)=>JSON.stringify([eq,port])
    for(const [ei,e] of eqs.entries()){
      const id=`eq${ei}`,shown=portsToDisplay(e.ports,used.get(e.id)??new Set(),e.portsExpanded),ins=shown.filter(q=>q.direction==='in'),outs=shown.filter(q=>q.direction!=='in'),h=60+Math.max(ins.length,outs.length)*22
      cells.push(`<mxCell id="${x(id)}" value="${x(`${e.name}\n${e.manufacturer??''} ${e.model}`.trim())}" avdRole="equipment" avdFamily="${e.family}" vertex="1" parent="1" style="rounded=1;whiteSpace=wrap;html=0;verticalAlign=top;spacingTop=8;"><mxGeometry x="${e.position.x}" y="${e.position.y}" width="260" height="${h}" as="geometry"/></mxCell>`)
      for(const [side,list] of [ins,outs].entries())for(const [i,q] of list.entries()){
        const pid=`p${ports.size}`;ports.set(key(e.id,q.id),pid);positions.set(pid,{x:e.position.x+(side?260:0),y:e.position.y+50+i*22})
        cells.push(`<mxCell id="${x(pid)}" value="${x(q.name)}" avdRole="port" avdSignal="${q.signal}" avdDirection="${q.direction}" avdConnector="${x(q.connector)}" vertex="1" parent="${x(id)}" style="ellipse;html=0;fillColor=${SIGNAL_STYLE[q.signal].color};labelPosition=${side?'left':'right'};align=${side?'right':'left'};"><mxGeometry x="${side}" y="${(50+i*22)/h}" width="8" height="8" relative="1" as="geometry"><mxPoint x="-4" y="-4" as="offset"/></mxGeometry></mxCell>`)
      }
    }
    for(const [li,l] of Object.values(p.links).entries()){
      let a=ports.get(key(l.source.equipmentId,l.source.portId)),b=ports.get(key(l.target.equipmentId,l.target.portId))
      if(!a&&!b)continue
      if(!a||!b){
        const local=a??b!,other=a?l.target:l.source,e=p.equipment[other.equipmentId],at=positions.get(local)!,ref=`ref${li}`
        const label=`${l.label} → ${p.sheets?.find(s=>s.id===e?.sheetId)?.name??'?'} · ${e?.name??'?'} / ${e?.ports.find(q=>q.id===other.portId)?.name??'?'}`
        cells.push(`<mxCell id="${ref}" value="${x(label)}" avdRole="annotation" vertex="1" parent="1" style="text;html=0;whiteSpace=wrap;"><mxGeometry x="${at.x+(a?70:-220)}" y="${at.y-12}" width="160" height="45" as="geometry"/></mxCell>`)
        if(!a)a=ref;else b=ref
      }
      const signal=p.equipment[l.source.equipmentId]?.ports.find(q=>q.id===l.source.portId)?.signal??p.equipment[l.target.equipmentId]?.ports.find(q=>q.id===l.target.portId)?.signal
      cells.push(`<mxCell id="l${li}" value="${x(l.label)}" edge="1" source="${x(a!)}" target="${x(b!)}" parent="1" style="edgeStyle=orthogonalEdgeStyle;rounded=0;html=0;endArrow=none;strokeColor=${signal?SIGNAL_STYLE[signal].color:'#666666'};"><mxGeometry relative="1" as="geometry"/></mxCell>`)
    }
    for(const [ni,n] of notes.entries())cells.push(`<mxCell id="note${ni}" value="${x(n.text)}" avdRole="annotation" vertex="1" parent="1" style="${n.kind==='frame'?'fillColor=none;':'text;'}html=0;whiteSpace=wrap;"><mxGeometry x="${n.position.x}" y="${n.position.y}" width="${n.size.w}" height="${n.size.h}" as="geometry"/></mxCell>`)
    pages.push(`<diagram id="${x(sheet.id)}" name="${x(sheet.name)}"><mxGraphModel page="1" pageWidth="1123" pageHeight="794"><root>${cells.join('')}</root></mxGraphModel></diagram>`)
  }
  if(!pages.length)throw new Error('empty')
  const xml=`<?xml version="1.0" encoding="UTF-8"?><mxfile host="AV Diagram" compressed="false">${pages.join('')}</mxfile>`
  if(xml.length>10_000_000)throw new Error('large')
  return xml
}
