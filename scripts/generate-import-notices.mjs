// Notices reproductibles des deux lecteurs et de leurs dépendances npm installées.
import fs from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('../',import.meta.url)), seen = new Set(), notices = []
async function visit(name, from) {
  const req = createRequire(path.join(from,'package.json'))
  let folder
  try { folder = path.dirname(req.resolve(`${name}/package.json`)) }
  catch {
    let at = from
    for (;;) { const candidate = path.join(at,'node_modules',name); try { await fs.access(path.join(candidate,'package.json')); folder = candidate; break } catch { /* rechercher au niveau parent */ } const parent = path.dirname(at); if (parent === at) throw Error(`Dépendance introuvable : ${name}`); at = parent }
  }
  const p = JSON.parse(await fs.readFile(path.join(folder,'package.json'),'utf8')), key = `${p.name}@${p.version}`
  if (seen.has(key)) return; seen.add(key)
  const names = await fs.readdir(folder)
  let files = names.filter(f => /^(license|licence|copying|notice)(\.|$|-)/i.test(f))
  if (!files.length) files = names.filter(f => /^readme(\.|$)/i.test(f))
  let body = ''
  for (const file of files) { const stat = await fs.stat(path.join(folder,file)); if (stat.isFile()) body += `\n${file}\n${await fs.readFile(path.join(folder,file),'utf8')}\n` }
  if (!body) throw Error(`Notice à examiner : ${key}`)
  notices.push(`\n${'='.repeat(72)}\n${key}\nLicence déclarée : ${typeof p.license === 'string' ? p.license : JSON.stringify(p.license ?? p.licenses ?? '(voir texte)')}\n${body}`)
  for (const dependency of Object.keys(p.dependencies ?? {}).sort()) await visit(dependency,folder)
}
for (const name of ['dxf-parser','exceljs']) await visit(name,root)
await fs.mkdir(path.join(root,'docs','third-party'),{recursive:true})
await fs.writeFile(path.join(root,'docs','third-party','import-licenses.txt'),`AV Diagram — lecteurs DXF / XLSX\nVersions résolues par package-lock.json. Notices des dépendances npm installées de dxf-parser et exceljs ; certaines ne sont utilisées que par leur distribution Node, pas par la version navigateur embarquée.\n${notices.sort().join('\n')}`)
console.log(`${notices.length} notices`)
