import { createClient } from '@libsql/client/node'
import { drizzle } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as schema from '../schema'

const dirs: string[] = []

// Real sqlite database with the production schema and migrations. A file
// rather than ':memory:' because libsql opens a fresh, empty database for
// every transaction on an in-memory connection.
//
// Use from a test as:
//   vi.mock('../database', async () => ({
//     default: await (await import('../test-utils/test-db')).createTestDb()
//   }))
export async function createTestDb() {
	const dir = mkdtempSync(join(tmpdir(), 'qldt-test-'))
	dirs.push(dir)

	const orm = drizzle({
		schema,
		client: createClient({ url: `file:${join(dir, 'test.db')}` })
	})
	await migrate(orm, { migrationsFolder: './migrations' })

	return orm
}

export function cleanupTestDbs() {
	for (const dir of dirs.splice(0)) {
		rmSync(dir, { recursive: true, force: true })
	}
}
