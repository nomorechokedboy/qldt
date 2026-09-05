import * as sqlite from 'drizzle-orm/sqlite-core'
import { baseSchema } from './base'
import { AppError } from '../errors'
import { InferInsertModel, InferSelectModel, relations } from 'drizzle-orm'
import { users } from './users'

export class UnitLevel {
	// `value` is only a stable code for encoding/decoding the DB column.
	// It is assigned once per level and never reused or renumbered, so
	// existing rows always keep decoding correctly.
	//
	// Hierarchy order is NOT derived from `value` — it's derived from a
	// level's position in `values` below (see `rank`). That means a new
	// level can be inserted anywhere in the hierarchy just by placing it
	// at the right spot in `values`, with any unused `value`. No existing
	// level's `value` ever has to change.
	static readonly CORPS = new UnitLevel(-4, 'corps')
	static readonly DIVISION = new UnitLevel(-3, 'division')
	static readonly BRIGADE = new UnitLevel(-2, 'brigade')
	static readonly REGIMENT = new UnitLevel(-1, 'regiment')
	static readonly DEPARTMENT = new UnitLevel(4, 'department')
	static readonly BATTALION = new UnitLevel(0, 'battalion')
	static readonly COMPANY = new UnitLevel(1, 'company')
	static readonly PLATOON = new UnitLevel(2, 'platoon')
	static readonly SQUAD = new UnitLevel(3, 'squad')

	// Order here defines the hierarchy, largest unit first — insert new
	// levels wherever they belong in the chain of command.
	private static readonly values = [
		UnitLevel.CORPS,
		UnitLevel.DIVISION,
		UnitLevel.BRIGADE,
		UnitLevel.REGIMENT,
		UnitLevel.DEPARTMENT,
		UnitLevel.BATTALION,
		UnitLevel.COMPANY,
		UnitLevel.PLATOON,
		UnitLevel.SQUAD
	]

	private constructor(
		public readonly value: number,
		public readonly name: string
	) {}

	private get rank(): number {
		return UnitLevel.values.indexOf(this)
	}

	static fromValue(value: number): UnitLevel {
		const level = this.values.find((l) => l.value === value)
		if (!level) {
			throw AppError.invalidArgument(`Invalid unit level value: ${value}`)
		}
		return level
	}

	static fromName(name: string): UnitLevel {
		const level = this.values.find((l) => l.name === name)
		if (!level) {
			throw AppError.invalidArgument(`Invalid unit level name: ${name}`)
		}
		return level
	}

	static isLargerThan(a: UnitLevel, b: UnitLevel): boolean {
		return a.rank < b.rank
	}

	static isEqual(a: UnitLevel, b: UnitLevel): boolean {
		return a.rank === b.rank
	}

	toString(): string {
		return this.name
	}
}

export type UnitLevelName =
	| 'corps'
	| 'division'
	| 'brigade'
	| 'regiment'
	| 'battalion'
	| 'company'
	| 'platoon'
	| 'squad'
	| 'department'

const UnitLevelEnum = sqlite.customType<{
	data: string
	driverData: number
}>({
	dataType() {
		return 'integer'
	},
	toDriver(val: string): number {
		return UnitLevel.fromName(val).value
	},
	fromDriver(val: number): string {
		return UnitLevel.fromValue(val).name
	}
})

export const units = sqlite.sqliteTable(
	'units',
	{
		...baseSchema,

		alias: sqlite.text().notNull(),
		name: sqlite.text().notNull(),
		level: UnitLevelEnum('level').$type<UnitLevelName>().notNull(),

		parentId: sqlite.int(),

		// units.ts and users.ts reference each other (users.unitId -> units.id,
		// these columns -> users.id). An explicit AnySQLiteColumn return type
		// on the reference callback breaks TS's circular type inference
		// between the two modules (drizzle's documented pattern for
		// cross-table circular refs).
		commanderId: sqlite
			.int()
			.references((): sqlite.AnySQLiteColumn => users.id),
		deputyCommanderId: sqlite
			.int()
			.references((): sqlite.AnySQLiteColumn => users.id),
		politicalCommanderId: sqlite
			.int()
			.references((): sqlite.AnySQLiteColumn => users.id),
		deputyPoliticalCommanderId: sqlite
			.int()
			.references((): sqlite.AnySQLiteColumn => users.id)
	},
	(t) => [
		sqlite.foreignKey({
			columns: [t.parentId],
			foreignColumns: [t.id],
			name: 'parent_id_fk'
		}),
		sqlite.unique('units_alias_parent_unique').on(t.alias, t.parentId),
		sqlite.unique('units_name_parent_unique').on(t.name, t.parentId)
	]
)

export const unitsRelations = relations(units, ({ one, many }) => ({
	parent: one(units, {
		fields: [units.parentId],
		references: [units.id],
		relationName: 'parentChild'
	}),
	children: many(units, {
		relationName: 'parentChild'
	}),
	commanders: many(users),
	commander: one(users, {
		fields: [units.commanderId],
		references: [users.id],
		relationName: 'unitCommander'
	}),
	deputyCommander: one(users, {
		fields: [units.deputyCommanderId],
		references: [users.id],
		relationName: 'unitDeputyCommander'
	}),
	politicalCommander: one(users, {
		fields: [units.politicalCommanderId],
		references: [users.id],
		relationName: 'unitPoliticalCommander'
	}),
	deputyPoliticalCommander: one(users, {
		fields: [units.deputyPoliticalCommanderId],
		references: [users.id],
		relationName: 'unitDeputyPoliticalCommander'
	})
}))

export type UnitDB = InferSelectModel<typeof units>

export type UnitParams = InferInsertModel<typeof units>

type unit = Omit<UnitDB, 'parentId'>

export type Unit = unit & { parent?: Unit; children: Unit[] }

export type UnitQuery = {
	level?: UnitLevelName
	ids?: number[]
}

export type UpdateUnitMap = {
	id: number
	updatePayload: Partial<{
		alias: string
		name: string
		level: UnitLevelName
		parentId: number | null
		commanderId: number | null
		deputyCommanderId: number | null
		politicalCommanderId: number | null
		deputyPoliticalCommanderId: number | null
	}>
}[]
