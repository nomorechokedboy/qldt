import { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import * as sqlite from 'drizzle-orm/sqlite-core'
import { baseSchema } from './base'

// `level` mirrors units.ts's UnitLevelName values ('battalion', 'company',
// ...) but is stored as plain text instead of importing that type/enum —
// referencing units.ts's inferred types from here trips Encore's
// client-gen analyzer over a circular type inference (see the same note
// in schema/users.ts).
//
// `code` is the exact, lowercased-and-trimmed position string this row
// matches (e.g. "dt", "phó dt", "trợ lý hc") — position text is free-form
// and varies by data entry, so the same logical role can have multiple
// rows (same level + priority, different code).
export const positions = sqlite.sqliteTable(
	'positions',
	{
		...baseSchema,

		level: sqlite.text().notNull(),
		code: sqlite.text().notNull(),
		name: sqlite.text().notNull(),
		priority: sqlite.int().notNull()
	},
	(t) => [sqlite.unique('positions_level_code_unique').on(t.level, t.code)]
)

export type PositionDB = InferSelectModel<typeof positions>

export type PositionParam = InferInsertModel<typeof positions>
