import type { Locator, Page } from '@playwright/test'

// Playwright acts instantly: the pointer teleports and text appears whole.
// On a recording that is too fast to follow, so on a paced page every
// locator action first glides the pointer to its target, lingers a moment,
// and text is typed one key at a time.

const GLIDE_MS = 800 // the cursor's own transition (support/overlay.ts) is ~650ms
const SETTLE_MS = 300 // rest on the target before acting
const AFTER_TYPING_MS = 400
const KEY_DELAY_MS = 90
const LONG_TEXT_KEY_DELAY_MS = 40 // keeps a paragraph from taking a minute

const TEXT_INPUTS = new Set([
	'text',
	'password',
	'email',
	'number',
	'search',
	'tel',
	'url',
	'textarea'
])

const paced = new WeakSet<Page>()
const INSTALLED = Symbol.for('qldt-e2e.paced')

type Options = Record<string, unknown> | undefined
type Action = (this: Locator, ...args: unknown[]) => Promise<unknown>

// Move the pointer over the element, then rest there. Failures are left to
// the real action, which reports them with Playwright's own message.
async function glideTo(locator: Locator) {
	try {
		await locator.scrollIntoViewIfNeeded()
		const box = await locator.boundingBox()
		if (!box) return
		const page = locator.page()
		await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {
			steps: 10
		})
		await page.waitForTimeout(GLIDE_MS + SETTLE_MS)
	} catch {
		// fall through
	}
}

export function pacePage(page: Page) {
	paced.add(page)
	const proto = Object.getPrototypeOf(page.locator('html')) as Record<
		string | symbol,
		Action
	>
	if (proto[INSTALLED]) return
	proto[INSTALLED] = (() => {}) as unknown as Action

	for (const name of [
		'click',
		'dblclick',
		'hover',
		'check',
		'uncheck',
		'selectOption'
	]) {
		const original = proto[name]
		proto[name] = async function (this: Locator, ...args: unknown[]) {
			if (paced.has(this.page())) await glideTo(this)
			return original.apply(this, args)
		}
	}

	const originalFill = proto.fill
	proto.fill = async function (this: Locator, ...args: unknown[]) {
		const [value, options] = args as [string, Options]
		const type = paced.has(this.page())
			? await this.evaluate((el) =>
					el instanceof HTMLTextAreaElement
						? 'textarea'
						: el instanceof HTMLInputElement
							? el.type
							: 'other'
				).catch(() => 'other')
			: 'other'
		if (!TEXT_INPUTS.has(type) || value === '') {
			return originalFill.call(this, value, options)
		}

		await glideTo(this)
		await originalFill.call(this, '', options) // focuses and clears
		await this.pressSequentially(value, {
			delay: value.length > 40 ? LONG_TEXT_KEY_DELAY_MS : KEY_DELAY_MS
		})
		// Typing can be altered by input masks; end with what fill would give.
		if ((await this.inputValue()) !== value) {
			await originalFill.call(this, value, options)
		}
		await this.page().waitForTimeout(AFTER_TYPING_MS)
	}
}
