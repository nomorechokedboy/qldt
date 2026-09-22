import { test as base, expect, type Page } from '@playwright/test'
import { appendFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { overlayScript } from './overlay'
import { PACED, pacePage } from './pace'

export const TMP_DIR = path.resolve(import.meta.dirname, '../.tmp')
export const VIDEO_DIR = path.resolve(import.meta.dirname, '../videos')
// Written by the first-run chapter once the admin has logged in; every later
// chapter starts from it, so each recording opens on the signed-in app.
export const ADMIN_STATE = path.join(TMP_DIR, 'admin-state.json')

export const ADMIN = {
	displayName: 'Nguyễn Văn Quản',
	username: 'admin',
	password: 'Admin@12345'
}

// How long a caption stays readable before the flow moves on.
const readingTime = (text: string) =>
	PACED ? Math.min(3200, 700 + text.length * 32) : 0

export class Story {
	constructor(private readonly page: Page) {}

	// Full-screen title card that opens a chapter's recording.
	async chapter(title: string, subtitle?: string) {
		await this.page.evaluate(([h, s]) => window.__e2e?.title(h, s), [
			title,
			subtitle
		] as const)
		await this.page.waitForTimeout(PACED ? 2600 : 0)
		await this.page.evaluate(() => window.__e2e?.title(''))
		await this.page.waitForTimeout(PACED ? 500 : 0)
	}

	// Caption for what is about to happen, then time to read it. Also a named
	// step in the test report.
	async step<T>(text: string, body: () => Promise<T>): Promise<T> {
		return base.step(text, async () => {
			const started = Date.now()
			await this.page.evaluate((c) => window.__e2e?.caption(c), text)
			await this.page.waitForTimeout(readingTime(text))
			const result = await body()
			await this.page.waitForTimeout(PACED ? 700 : 0)
			// How long each step takes on the recording, for tuning the pace.
			mkdirSync(TMP_DIR, { recursive: true })
			appendFileSync(
				path.join(TMP_DIR, 'step-times.log'),
				`${((Date.now() - started) / 1000).toFixed(1)}s\t${text}\n`
			)
			return result
		})
	}

	async pause(ms = 1000) {
		await this.page.waitForTimeout(ms)
	}
}

declare global {
	interface Window {
		__e2e?: {
			caption(text?: string): void
			title(heading?: string, sub?: string): void
		}
	}
}

const slug = (file: string) => path.basename(file).replace(/\.spec\.ts$/, '')

export const test = base.extend<{ story: Story }>({
	page: async ({ page }, use, testInfo) => {
		await page.addInitScript({ content: overlayScript })
		pacePage(page)
		await use(page)

		// Leave a beat on the final screen, then keep the recording under the
		// chapter's own name.
		await page.waitForTimeout(PACED ? 1500 : 0)
		await page.close()
		mkdirSync(VIDEO_DIR, { recursive: true })
		await page
			.video()
			?.saveAs(path.join(VIDEO_DIR, `${slug(testInfo.file)}.webm`))
	},
	story: async ({ page }, use) => {
		await use(new Story(page))
	}
})

export { expect }
