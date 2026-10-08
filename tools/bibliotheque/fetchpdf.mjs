// Usage : node fetchpdf.mjs URL fichier.pdf -> télécharge via Chromium (en-têtes de navigateur)
import { spkiArgs } from './proxyca.mjs'
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs'
import { writeFileSync, readFileSync } from 'node:fs'
const [url, out] = process.argv.slice(2)
const browser = await chromium.launch({ proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined, args: spkiArgs() })
const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36' })
const res = await ctx.request.get(url, { timeout: 180000 })
console.log(res.status(), res.headers()['content-type'])
if (res.ok()) writeFileSync(out, await res.body())
await browser.close()
