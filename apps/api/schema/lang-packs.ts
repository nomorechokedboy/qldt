import { InferSelectModel, sql } from 'drizzle-orm'
import * as sqlite from 'drizzle-orm/sqlite-core'

// A language pack is a sparse override of the web app's built-in catalog:
// { [namespace]: { [key]: string | nested keys } }.
export type LangPackTree = { [key: string]: string | LangPackTree }
export type LangPackData = Record<string, LangPackTree>

// One row per language; uploading a pack for a language replaces its row.
export const langPacks = sqlite.sqliteTable('lang_packs', {
	language: sqlite.text().primaryKey(),
	pack: sqlite.text({ mode: 'json' }).$type<LangPackData>().notNull(),
	updatedByUserId: sqlite.int('updated_by_user_id'),
	updatedAt: sqlite
		.text('updated_at')
		.default(sql`CURRENT_TIMESTAMP`)
		.$onUpdate(() => sql`CURRENT_TIMESTAMP`)
})

export type LangPackDB = InferSelectModel<typeof langPacks>
