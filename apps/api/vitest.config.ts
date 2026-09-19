import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { defineConfig } from 'vitest/config'

// Some tests import modules that pull in the real ./database, which opens
// DATABASE_URI and migrates it on import. Point it at a throwaway file so
// tests never touch the developer's data/local.db and don't need a data dir.
const scratchDir = mkdtempSync(join(tmpdir(), 'qldt-vitest-'))

export default defineConfig({
	test: {
		env: {
			DATABASE_URI: `file:${join(scratchDir, 'app.db')}`
		}
	}
})
