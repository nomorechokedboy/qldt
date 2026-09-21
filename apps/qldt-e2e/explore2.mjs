// usage: node explore2.mjs <script.mjs>  — script default-exports async (page, shot) => {}
import { chromium } from '@playwright/test'
const mod = await import(process.argv[2])
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 1600, height: 900 }, storageState: '.tmp/admin-state.json', locale: 'vi-VN' })
const page = await ctx.newPage()
page.setDefaultTimeout(8000)
page.on('pageerror', (e) => console.log('PAGEERROR', e.message))
let n = 0
const shot = async (label = '') => { const f = `${process.env.OUT}/s${++n}.png`; await page.screenshot({ path: f }); console.log('shot', f, label) }
const aria = async (sel = 'body') => console.log(await page.locator(sel).ariaSnapshot())
try { await mod.default(page, shot, aria) } catch (e) { console.log('ERR', e.message.slice(0, 600)); await shot('error') }
await b.close()
