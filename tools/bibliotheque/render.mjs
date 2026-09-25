// Usage : node render.mjs URL [attente_ms] -> texte visible de la page après exécution du JavaScript (mis en cache)
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
const url = process.argv[2]
const wait = Number(process.argv[3] ?? 4000)
const dir = new URL('./cache-render/', import.meta.url).pathname
mkdirSync(dir, { recursive: true })
const file = dir + createHash('md5').update(url).digest('hex') + '.txt'
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
  const text = await page.evaluate(() => document.body.innerText)
  writeFileSync(file, text)
  process.stdout.write(text)
} catch (e) { console.error('échec', e.message) }
await browser.close()
