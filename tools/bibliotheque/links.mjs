// Usage : node links.mjs URL [attente_ms] [motif_href] -> liens de la page dont l'adresse contient le motif (défaut : techspecs)
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
const url = process.argv[2]
const wait = Number(process.argv[3] ?? 4000)
const filter = process.argv[4] ?? 'techspecs'
const dir = new URL('./cache-links/', import.meta.url).pathname
mkdirSync(dir, { recursive: true })
const file = dir + createHash('md5').update(url + filter).digest('hex') + '.txt'
if (existsSync(file) && readFileSync(file, 'utf8').length > 500) { process.stdout.write(readFileSync(file, 'utf8')); process.exit(0) }
// Confiance limitée à la clé de l'autorité du proxy de l'environnement (/root/.ccr/agent-proxy-ca.crt)
const browser = await chromium.launch({
  proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined,
  args: ['--ignore-certificate-errors-spki-list=KnP1OnzHv/y42eRQmbGwoYTHcSJF448m6CU5mdngwKk='],
})
const page = await browser.newPage({ userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36' })
try {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 })
  await page.waitForTimeout(wait)
  const text = await page.evaluate((sel) => [...document.querySelectorAll("a[href*='" + sel + "']")].map((a) => a.href + " | " + a.innerText.trim().replace(/\s+/g, " ")).join("\n"), filter)
  writeFileSync(file, text)
  process.stdout.write(text)
} catch (e) { console.error('échec', e.message) }
await browser.close()
