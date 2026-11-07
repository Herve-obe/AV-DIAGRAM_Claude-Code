import type { WorkbookRead } from './xlsx'
export function readXlsx(bytes: Uint8Array): Promise<WorkbookRead> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./xlsx.worker.ts', import.meta.url), { type: 'module' })
    const timer = setTimeout(() => { worker.terminate(); reject(new Error('timeout')) }, 15_000)
    const close = () => { clearTimeout(timer); worker.terminate() }
    worker.onmessage = (e: MessageEvent<{ result?: WorkbookRead; error?: string }>) => { close(); if (e.data.result) resolve(e.data.result); else reject(new Error(e.data.error || 'invalid')) }
    worker.onerror = () => { close(); reject(new Error('invalid')) }; worker.postMessage(bytes)
  })
}
