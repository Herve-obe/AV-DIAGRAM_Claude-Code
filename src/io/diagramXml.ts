import { SaxesParser } from 'saxes'
import { Inflate, Unzip, UnzipInflate } from 'fflate'

export interface XmlNode { name: string; attrs: Record<string, string>; children: XmlNode[]; text: string }
export const child = (n: XmlNode, name: string) => n.children.find(x => x.name === name)
export const children = (n: XmlNode, name: string) => n.children.filter(x => x.name === name)
export const descendants = (n: XmlNode, name: string): XmlNode[] => n.children.flatMap(c => [...(c.name === name ? [c] : []), ...descendants(c, name)])
export const textOf = (n: XmlNode | undefined): string => n ? n.text + n.children.map(textOf).join('') : ''
export const xmlEscape = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]!)
export const plainText = (s: string) => s.replace(/<(?:br\s*\/?|\/div|\/p)>/gi, '\n').replace(/<[^>]*>/g, '').replace(/&(?:nbsp|amp|lt|gt|quot|apos);/g, c => ({ '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'" })[c]!).trim().slice(0, 2000)

/** XML de données uniquement : aucune DTD, entité externe, image ou URL n'est résolue. */
export function parseXml(xml: string): XmlNode {
  if (xml.length > 10_000_000) throw new Error('large')
  const root: XmlNode = { name: '', attrs: {}, children: [], text: '' }, stack = [root]
  let count = 0
  const p = new SaxesParser({ xmlns: false })
  p.on('doctype', () => { throw new Error('unsafe') })
  p.on('error', () => { throw new Error('invalid') })
  p.on('opentag', tag => {
    if (++count > 50_000 || stack.length > 64 || Object.values(tag.attributes).some(v => v.length > 100_000)) throw new Error('large')
    const node: XmlNode = { name: tag.name.split(':').pop()!, attrs: tag.attributes, children: [], text: '' }
    stack.at(-1)!.children.push(node); stack.push(node)
  })
  const text = (s: string) => { stack.at(-1)!.text += s }
  p.on('text', text); p.on('cdata', text); p.on('closetag', () => { stack.pop() })
  p.write(xml).close()
  if (root.children.length !== 1) throw new Error('invalid')
  return root.children[0]
}

export function inflatedPage(data: Uint8Array): string {
  const parts: Uint8Array[] = []; let size = 0
  const stream = new Inflate(chunk => { size += chunk.length; if (size > 10_000_000) throw new Error('large'); parts.push(chunk) })
  for (let i = 0; i < data.length; i += 1024) stream.push(data.subarray(i, i + 1024), i + 1024 >= data.length)
  const out = new Uint8Array(size); let at = 0
  for (const part of parts) { out.set(part, at); at += part.length }
  return new TextDecoder('utf-8', { fatal: true }).decode(out)
}

/** Décompression progressive bornée, y compris si les tailles annoncées du ZIP sont fausses. */
export function visioArchive(data: Uint8Array): Map<string, string> {
  if (data.length > 10_000_000) throw new Error('large')
  const result = new Map<string, string>(), seen = new Set<string>(); let size = 0, entries = 0, failure: Error | null = null
  const unzip = new Unzip(file => {
    if (++entries > 2000 || seen.has(file.name) || file.name.includes('..') || file.name.startsWith('/') || file.name.includes('\\')) throw new Error('invalid')
    seen.add(file.name)
    if (!/^visio\/(pages|masters)\/(?:_rels\/)?[\w.-]+\.(?:xml|rels)$/.test(file.name)) return
    if (file.originalSize !== undefined && file.originalSize > 10_000_000) { failure = new Error('large'); return }
    const parts: Uint8Array[] = []; let bytes = 0
    file.ondata = (error, chunk, final) => {
      if (failure) return
      if (error) { failure = new Error('invalid'); return }
      size += chunk.length; bytes += chunk.length
      if (size > 50_000_000 || bytes > 10_000_000) { failure = new Error('large'); file.terminate(); return }
      parts.push(chunk)
      if (final) { const out = new Uint8Array(bytes); let at = 0; for (const p of parts) { out.set(p, at); at += p.length }; result.set(file.name, new TextDecoder('utf-8', { fatal: true }).decode(out)) }
    }
    file.start()
  })
  unzip.register(UnzipInflate)
  for (let i = 0; i < data.length; i += 1024) { unzip.push(data.subarray(i, i + 1024), i + 1024 >= data.length); if (failure) throw failure }
  if (!result.size) throw new Error('invalid')
  return result
}
