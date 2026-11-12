import { isTauri } from '@tauri-apps/api/core'

export async function pickFile(extensions: string[], limit = 10_000_000): Promise<{ name: string; data: Uint8Array } | null> {
  if (isTauri()) {
    const { open } = await import('@tauri-apps/plugin-dialog')
    const { readFile, stat } = await import('@tauri-apps/plugin-fs')
    const path = await open({ multiple: false, directory: false, filters: [{ name: extensions.map(s => s.toUpperCase()).join(', '), extensions }] })
    if (!path) return null
    if ((await stat(path)).size > limit) throw new Error('large')
    const data = await readFile(path)
    if (data.byteLength > limit) throw new Error('large')
    return { name: path.split(/[\\/]/).pop() ?? 'import', data }
  }
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'; input.accept = extensions.map(s => `.${s}`).join(','); input.hidden = true
    let done = false, reading = false
    const finish = (file: { name: string; data: Uint8Array } | null, error?: unknown) => { if (done) return; done = true; window.removeEventListener('focus', focused); input.remove(); if (error) reject(error); else resolve(file) }
    const focused = () => setTimeout(() => { if (!reading && !input.files?.length) finish(null) }, 500)
    input.oncancel = () => finish(null)
    input.onchange = async () => {
      const file = input.files?.[0]; if (!file) return finish(null)
      reading = true
      if (file.size > limit) return finish(null, new Error('large'))
      try { finish({ name: file.name, data: new Uint8Array(await file.arrayBuffer()) }) } catch (e) { finish(null, e) }
    }
    document.body.append(input); window.addEventListener('focus', focused); input.click()
  })
}

export function cadText(data: Uint8Array): string {
  const header = new TextDecoder('windows-1252').decode(data.subarray(0, 16_000))
  if (/^AC10\d\d|AutoCAD Binary DXF/.test(header)) throw new Error('binary')
  const codePage = /\$DWGCODEPAGE\s+\d+\s+ANSI_(\d+)/.exec(header)?.[1]
  const modern = /\$ACADVER\s+\d+\s+AC10(?:2[1-9]|[3-9]\d)/.test(header)
  try { return new TextDecoder('utf-8', { fatal: true }).decode(data) }
  catch {
    if (modern) throw new Error('encoding')
    if (codePage && !/^125[0-8]$/.test(codePage)) throw new Error('encoding')
    return new TextDecoder(codePage ? `windows-${codePage}` : 'windows-1252').decode(data)
  }
}
