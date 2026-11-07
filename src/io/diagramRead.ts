import type { DiagramPage } from './diagramExchange'

export function readDiagramFile(bytes: Uint8Array, name: string): Promise<DiagramPage[]> {
  return new Promise((resolve,reject)=>{
    if(bytes.length>10_000_000)return reject(new Error('large'))
    const worker=new Worker(new URL('./diagram.worker.ts',import.meta.url),{type:'module'})
    const timer=setTimeout(()=>{worker.terminate();reject(new Error('timeout'))},15_000)
    const close=()=>{clearTimeout(timer);worker.terminate()}
    worker.onmessage=(e:MessageEvent<{pages?:DiagramPage[];error?:string}>)=>{close();if(e.data.pages)resolve(e.data.pages);else reject(new Error(e.data.error??'invalid'))}
    worker.onerror=()=>{close();reject(new Error('invalid'))}
    worker.postMessage({bytes,name})
  })
}
