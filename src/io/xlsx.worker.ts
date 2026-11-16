import { readWorkbook } from './xlsx'
self.onmessage = async (e: MessageEvent<Uint8Array>) => {
  try { self.postMessage({ result: await readWorkbook(e.data) }) }
  catch (error) { self.postMessage({ error: error instanceof Error ? error.message : 'invalid' }) }
}
