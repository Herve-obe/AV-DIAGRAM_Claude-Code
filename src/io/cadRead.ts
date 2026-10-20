import type { CadImport } from './cad'

export function readCad(text: string, name: string, unit?: number): Promise<CadImport> {
  return new Promise((resolve, reject) => {
    if (text.length > 10_000_000) return reject(new Error('large'))
    const worker = new Worker(new URL('./cad.worker.ts', import.meta.url), { type: 'module' })
    const timer = setTimeout(() => { worker.terminate(); reject(new Error('timeout')) }, 15_000)
    const close = () => { clearTimeout(timer); worker.terminate() }
    worker.onmessage = (e: MessageEvent<{ result?: CadImport; error?: string }>) => { close(); if (e.data.result) resolve(e.data.result); else reject(new Error(e.data.error || 'invalid')) }
    worker.onerror = () => { close(); reject(new Error('invalid')) }
    worker.postMessage({ text, name, unit })
  })
}
