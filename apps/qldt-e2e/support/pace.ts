import type { Locator, Page } from '@playwright/test'

// Playwright fills a field in an instant and moves on, which is too fast to
// follow on a recording. On a paced page, every input field is followed by a
// short rest so the viewer can read what was entered before the next one.

export const AFTER_INPUT_MS = 3000

// Pacing is for the final recording. While a chapter is being written it runs
// at full speed; `E2E_PACE=1` switches the rests, the caption reading time and
// slowMo on.
export const PACED = process.env.E2E_PACE === '1'

// A pause after an input, for the viewer. Specs call it after picking from a
// custom list, which is an input the wrapped actions cannot recognise.
export const rest = async (page: Page) => {
	if (PACED) await page.waitForTimeout(AFTER_INPUT_MS)
}

const paced = new WeakSet<Page>()
const INSTALLED = Symbol.for('qldt-e2e.paced')

type Action = (this: Locator, ...args: unknown[]) => Promise<unknown>

export function pacePage(page: Page) {
	if (!PACED) return
	paced.add(page)
	const proto = Object.getPrototypeOf(page.locator('html')) as Record<
		string | symbol,
		Action
	>
	if (proto[INSTALLED]) return
	proto[INSTALLED] = (() => {}) as unknown as Action

	for (const name of [
		'fill',
		'pressSequentially',
		'selectOption',
		'check',
		'uncheck'
	]) {
		const original = proto[name]
		proto[name] = async function (this: Locator, ...args: unknown[]) {
			const result = await original.apply(this, args)
			if (paced.has(this.page())) await rest(this.page())
			return result
		}
	}
}
