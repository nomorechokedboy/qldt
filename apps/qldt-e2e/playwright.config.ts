import { defineConfig } from '@playwright/test'
import path from 'node:path'

const API_PORT = 4100
const WEB_PORT = 4173
const API_URL = `http://localhost:${API_PORT}`
const WEB_URL = `http://localhost:${WEB_PORT}`
const TMP = path.resolve(import.meta.dirname, '.tmp')
const DB_FILE = path.join(TMP, 'e2e.db')
const WEB_DIST = path.join(TMP, 'web-dist')

// E2E_SNAPSHOT=<name> starts from the database a previous run saved with
// `pnpm snapshot <name>`, so a later chapter can be developed without
// replaying the ones before it.
const restoreSnapshot = process.env.E2E_SNAPSHOT
	? `cp -f ${TMP}/snapshots/${process.env.E2E_SNAPSHOT}/e2e.db* ${TMP}/ && `
	: ''

// E2E_SKIP_BUILD=1 reuses the previous build while iterating on the tests.
const buildStep = process.env.E2E_SKIP_BUILD
	? ''
	: `pnpm exec vite build --outDir ${WEB_DIST} --emptyOutDir &&`

// The recording is the deliverable, so it is 1080p and the browser is sized
// to match (a video of a smaller viewport would be scaled and blurry).
const VIEWPORT = { width: 1920, height: 1080 }

export default defineConfig({
	testDir: './tests',
	// Chapters build on each other's data, in file order.
	fullyParallel: false,
	workers: 1,
	maxFailures: 1,
	retries: 0,
	timeout: 10 * 60_000,
	expect: { timeout: 15_000 },
	reporter: [['list'], ['html', { open: 'never' }]],
	outputDir: 'test-results',
	use: {
		baseURL: WEB_URL,
		viewport: VIEWPORT,
		actionTimeout: 20_000,
		locale: 'vi-VN',
		timezoneId: 'Asia/Ho_Chi_Minh',
		// Encoding 1080p video lags a full-speed run and closing the page waits
		// for it to catch up, so video is only recorded on the paced run.
		video:
			process.env.E2E_PACE === '1'
				? { mode: 'on', size: VIEWPORT }
				: 'off',
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure',
		// Slow enough that a viewer can follow the pointer; the rest after each
		// input field lives in support/pace.ts.
		launchOptions: { slowMo: process.env.E2E_PACE === '1' ? 180 : 0 }
	},
	projects: [{ name: 'story', use: { browserName: 'chromium' } }],
	webServer: [
		{
			// A private backend on an empty database: the first-run chapters
			// only make sense from nothing, and this never touches local data.
			command: `mkdir -p ${TMP} && rm -f ${DB_FILE}* && ${restoreSnapshot}encore run --port ${API_PORT} --browser never`,
			cwd: '../api',
			env: { DATABASE_URI: DB_FILE, S3_DEFAULT_BUCKET: 'e2e-bucket' },
			url: `${API_URL}/units/check-init-root`,
			reuseExistingServer: false,
			stdout: 'ignore',
			stderr: 'pipe',
			timeout: 240_000
		},
		{
			// A production build against that backend: no dev-server module
			// reloads in the middle of a recording.
			command: `${buildStep} pnpm exec vite preview --outDir ${WEB_DIST} --port ${WEB_PORT} --strictPort`,
			cwd: '../web',
			env: { VITE_API_URL: API_URL },
			url: WEB_URL,
			reuseExistingServer: false,
			stdout: 'ignore',
			stderr: 'pipe',
			timeout: 420_000
		}
	]
})
