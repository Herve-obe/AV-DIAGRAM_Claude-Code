import { parseCad } from './cad'
self.onmessage = (e: MessageEvent<{ text: string; name: string; unit?: number }>) => {
  try { self.postMessage({ result: parseCad(e.data.text, e.data.name, e.data.unit) }) }
  catch (error) { self.postMessage({ error: error instanceof Error ? error.message : 'invalid' }) }
}
