import { expect, it } from 'vitest'
import { routeAll, type Point, type Rect, type RouteRequest } from './routing'

const swap = (p: Point) => ({x:p.y,y:p.x})
it('ordonne les voies haut/bas comme les voies gauche/droite, y compris les coudes manuels', () => {
  const boxes: Rect[] = [{x:0,y:0,w:100,h:300},{x:500,y:0,w:100,h:300}]
  const req: RouteRequest[] = [0,1,2,3].map(i => ({id:String(i),source:{x:100,y:20 + i * 60,side:'right'},target:{x:500,y:20 + i * 25,side:'left'}}))
  const horizontal = routeAll(boxes,req)
  const transposed = routeAll(boxes.map(b => ({x:b.y,y:b.x,w:b.h,h:b.w})),req.map(r => ({id:r.id,source:{...swap(r.source),side:'bottom'},target:{...swap(r.target),side:'top'}})))
  for (const r of req) expect(transposed.get(r.id)).toEqual(horizontal.get(r.id)!.map(swap))
  const manual = routeAll([],[{id:'y',source:{x:20,y:0,side:'bottom'},target:{x:180,y:400,side:'top'},bendY:150}]).get('y')!
  expect(manual).toEqual([{x:20,y:0},{x:20,y:150},{x:180,y:150},{x:180,y:400}])
})
it('conserve des segments orthogonaux et les sorties de ports pour les seize orientations', () => {
  const sides = ['left','right','top','bottom'] as const
  for (const source of sides) for (const target of sides) {
    const route = routeAll([],[{id:'r',source:{x:-200,y:-100,side:source},target:{x:350,y:400,side:target}}]).get('r')!
    expect(route[0]).toEqual({x:-200,y:-100})
    expect(route.at(-1)).toEqual({x:350,y:400})
    for (let i = 1; i < route.length; i++) expect(route[i].x === route[i-1].x || route[i].y === route[i-1].y).toBe(true)
  }
})
it('déplace un coude haut/bas même lorsque les appareils sont côte à côte, en contournant les blocs', () => {
  const boxes = [{x:0,y:0,w:100,h:100},{x:300,y:0,w:100,h:100}]
  const pts = routeAll(boxes,[{id:'r',source:{x:50,y:100,side:'bottom'},target:{x:350,y:0,side:'top'},bendY:200}]).get('r')!
  expect(pts.some((a,i) => i && a.y === 200 && pts[i - 1].y === 200 && a.x !== pts[i - 1].x)).toBe(true)
  for (let i=1;i<pts.length;i++) for (const r of boxes) {
    const a=pts[i-1],b=pts[i]
    expect(Math.min(a.x,b.x) < r.x + r.w && Math.max(a.x,b.x) > r.x && Math.min(a.y,b.y) < r.y + r.h && Math.max(a.y,b.y) > r.y).toBe(false)
  }
})
