import { readDiagram } from './diagramExchange'
self.onmessage=(e:MessageEvent<{bytes:Uint8Array;name:string}>)=>{
  try{self.postMessage({pages:readDiagram(e.data.bytes,e.data.name)})}
  catch(error){self.postMessage({error:error instanceof Error?error.message:'invalid'})}
}
