import { chromium } from '@playwright/test'
const routes = process.argv.slice(2)
const b = await chromium.launch()
const ctx = await b.newContext({ viewport: { width: 1600, height: 900 }, storageState: '.tmp/admin-state.json', locale: 'vi-VN' })
const page = await ctx.newPage()
for (const r of routes) {
  await page.goto('http://localhost:4173' + r)
  await page.waitForTimeout(2000)
  const name = r.replace(/\W+/g, '_') || 'root'
  await page.screenshot({ path: process.env.OUT + '/' + name + '.png' })
  console.log(r, '->', page.url(), '|', (await page.locator('h1,h2').allInnerTexts()).slice(0,4).join(' / '))
}
await b.close()
