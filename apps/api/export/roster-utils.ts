import { classifyRank, formatRankAbbrev, rankWeight } from './rank-utils'

/**
 * Command-group tier shared by every unit level that has one (company,
 * platoon, squad, battalion): commander (0) / political commander (1) /
 * deputy commander (2) / deputy political commander (3). Returns undefined
 * when `position` isn't one of those four so callers can layer their own
 * per-level ordering on top for everyone else.
 */
function commanderTier(position: string): number | undefined {
	const p = position.trim().toLowerCase()

	if (
		['ct', 'dt', 'bt', 'at'].includes(p) ||
		p.startsWith('at ') ||
		p.startsWith('kđt') ||
		p.startsWith('btch')
	) {
		return 0
	}
	if (p === 'ctv') {
		return 1
	}
	if (p.startsWith('phó ct') || p.startsWith('phó dt') || p === "pct'") {
		return 2
	}
	if (p.startsWith('ctvp')) {
		return 3
	}

	return undefined
}

/**
 * Company/platoon/squad ordering, lowest tier prints first:
 *   0-3. command group (see commanderTier)
 *   4. everyone else (QNCN and regular members alike, ranked by seniority)
 *   5. medic (Y tá) — always last of its group
 *
 * `positionPriorities` (rows from the `positions` table, level='company'
 * or 'platoon') can override any of the above for a specific position
 * text; unseeded positions fall back to the hardcoded scheme, same
 * fallback pattern as battalionTier.
 */
function companyTier(
	level: string,
	position: string,
	positionPriorities: ReadonlyMap<string, number>
): number {
	const p = position.trim().toLowerCase()

	const seeded = positionPriorities.get(`${level}:${p}`)
	if (seeded !== undefined) {
		return seeded
	}

	const commander = commanderTier(position)
	if (commander !== undefined) {
		return commander
	}

	if (p === 'y tá') {
		return 5
	}

	return 4
}

// Battalion HQ role order after the command group, most senior staff role
// first, medic second-to-last, cook ("NQ") last. Each entry lists the
// position-text variants (lowercased) observed for that role — position
// text is free-form, so this isn't an exhaustive grammar.
const BATTALION_ROLE_ORDER: string[][] = [
	['tlts'],
	['tltt'],
	['tlhc', 'trợ lý hc'],
	['y sĩ'],
	['nvxm-xd', 'nvxm', 'nv xm-xd'],
	['nvqk', 'nv qk', 'nv q khí'],
	['nvna'],
	['y tá'],
	['nq']
]

/**
 * Battalion ordering, lowest tier prints first. Primarily driven by the
 * `positions` table (level='battalion'): `positionPriorities` is keyed by
 * `battalion:<lowercased-trimmed position text>` -> priority, built from
 * that table by the caller. Positions with no matching row (not yet
 * seeded) fall back to the command group (see commanderTier) and, failing
 * that, BATTALION_ROLE_ORDER, so an un-seeded position still prints
 * somewhere sane instead of silently sorting to the wrong spot.
 */
function battalionTier(
	position: string,
	positionPriorities: ReadonlyMap<string, number>
): number {
	const p = position.trim().toLowerCase()

	const seeded = positionPriorities.get(`battalion:${p}`)
	if (seeded !== undefined) {
		return seeded
	}

	const commander = commanderTier(position)
	if (commander !== undefined) {
		return commander
	}

	const idx = BATTALION_ROLE_ORDER.findIndex((aliases) => aliases.includes(p))
	return idx === -1 ? 4 + BATTALION_ROLE_ORDER.length : 4 + idx
}

/**
 * Department-and-above ordering (regiment, brigade, division, corps, and
 * any department-level unit), lowest tier prints first:
 *   0. commander/leadership (everyone not caught by the tiers below)
 *   1. "Trợ lý" (TL./Trợ lý prefix)
 *   2. "Nhân viên" (NV./Nhân viên prefix) or QNCN
 *   3. HSQ or CS/BS
 * Duty title decides tiers 1-2 (a QNCN-ranked "Trợ lý" still sorts as a
 * Trợ lý); classifyTrooper decides tier 3. Ties within every tier fall back
 * to rank, highest first.
 */
function departmentTier(
	position: string,
	rank: string,
	positionCategories: ReadonlyMap<string, string>
): number {
	const p = position.trim().toLowerCase()
	const isTL = p.startsWith('tl') || p.startsWith('trợ lý')
	const isNV = p.startsWith('nv') || p.startsWith('nhân viên')
	const category = classifyTrooper(position, rank, positionCategories)

	if (isTL) {
		return 1
	}
	if (isNV || category === 'QNCN') {
		return 2
	}
	if (category === 'HSQ' || category === 'CS') {
		return 3
	}

	return 0
}

function positionTier(
	level: string,
	position: string,
	rank: string,
	positionPriorities: ReadonlyMap<string, number>,
	positionCategories: ReadonlyMap<string, string>
): number {
	switch (level) {
		case 'battalion':
			return battalionTier(position, positionPriorities)
		case 'company':
		case 'platoon':
		case 'squad':
			return companyTier(level, position, positionPriorities)
		default:
			return departmentTier(position, rank, positionCategories)
	}
}

function compareRosterStudents(
	level: string,
	positionPriorities: ReadonlyMap<string, number>,
	positionCategories: ReadonlyMap<string, string>,
	a: Pick<RosterStudent, 'position' | 'rank'>,
	b: Pick<RosterStudent, 'position' | 'rank'>
): number {
	const tierDiff =
		positionTier(
			level,
			a.position,
			a.rank,
			positionPriorities,
			positionCategories
		) -
		positionTier(
			level,
			b.position,
			b.rank,
			positionPriorities,
			positionCategories
		)
	if (tierDiff !== 0) {
		return tierDiff
	}

	return rankWeight(b.rank) - rankWeight(a.rank)
}

export interface RosterHeaderRow {
	type: 'header'
	name: string
	count: number
}

export interface RosterMemberRow {
	type: 'member'
	stt: number
	fullName: string
	rank: string
	position: string
	enlistmentPeriod: string
	note: string
}

export type RosterRow = RosterHeaderRow | RosterMemberRow

export interface RosterSummary {
	total: number
	sq: number
	qncn: number
	hsq: number
	// Named `bs` for the docx template's data key; represents CS/BS
	// (chiến sĩ/binh sĩ), the un-derived fallback category.
	bs: number
}

export interface RosterUnitNode {
	id: number
	name: string
	parentId: number | null | undefined
	level: string
}

export interface RosterStudent {
	fullName: string
	rank: string
	position: string
	enlistmentPeriod: string
	unitId: number | null | undefined
}

// A row from the `positions` table (level-scoped position-priority
// overrides), used to sort a unit's members instead of the hardcoded
// per-level heuristics — see battalionTier. `category` is the position's
// troop-category override (currently only meaningful value: 'HSQ') used by
// classifyTrooper for members whose rank alone doesn't decide SQ/QNCN.
export interface RosterPosition {
	level: string
	code: string
	priority: number
	category?: string | null
}

/**
 * Builds the shared `unitId -> unit level` lookup used by battalionTier /
 * companyTier / positionTier to know which per-level sort rules apply to a
 * given student.
 */
function buildUnitLevelMap(
	rootUnit: RosterUnitNode,
	units: RosterUnitNode[]
): Map<number, string> {
	const unitLevelById = new Map<number, string>([
		[rootUnit.id, rootUnit.level]
	])
	for (const u of units) {
		unitLevelById.set(u.id, u.level)
	}

	return unitLevelById
}

/**
 * Builds the `code` -> category lookup from `positions` rows that carry a
 * troop-category override. Keyed by code alone (not level-scoped like
 * `positionPriorities`): a position's troop-category meaning (e.g. "at ..."
 * or "kđt" being HSQ) holds regardless of which unit/level it's held at.
 */
export function buildPositionCategories(
	positions: RosterPosition[]
): ReadonlyMap<string, string> {
	const categories = new Map<string, string>()
	for (const p of positions) {
		if (!p.category) {
			continue
		}
		categories.set(p.code.trim().toLowerCase(), p.category)
	}

	return categories
}

/**
 * Classifies a trooper into SQ / QNCN / HSQ / CS:
 *   - SQ/QNCN are derived from rank text (see classifyRank).
 *   - Everyone else is HSQ only if their current duty position is one of the
 *     schooled/trained positions seeded in the `positions` table with
 *     category='HSQ' (e.g. "at ...", "kđt", "y tá", "QKV", "BQV", "NVBV"),
 *     regardless of which unit/level holds that position.
 *   - Everyone else falls back to CS/BS.
 *   - A blank rank means the trooper isn't counted in any bucket (matches
 *     legacy classifyRank behavior).
 */
export function classifyTrooper(
	position: string,
	rank: string,
	positionCategories: ReadonlyMap<string, string>
): RosterSummaryCategory | undefined {
	if (!rank.trim()) {
		return undefined
	}

	const rankCategory = classifyRank(rank)
	if (rankCategory !== undefined) {
		return rankCategory
	}

	const category = positionCategories.get(position.trim().toLowerCase())
	if (category === 'HSQ') {
		return 'HSQ'
	}

	return 'CS'
}

type RosterSummaryCategory = 'SQ' | 'QNCN' | 'HSQ' | 'CS'

export function buildRosterSummary(
	students: Pick<RosterStudent, 'rank' | 'position'>[],
	positions: RosterPosition[] = []
): RosterSummary {
	const positionCategories = buildPositionCategories(positions)

	const summary: RosterSummary = {
		total: students.length,
		sq: 0,
		qncn: 0,
		hsq: 0,
		bs: 0
	}

	for (const s of students) {
		switch (classifyTrooper(s.position, s.rank, positionCategories)) {
			case 'SQ':
				summary.sq++
				break
			case 'QNCN':
				summary.qncn++
				break
			case 'HSQ':
				summary.hsq++
				break
			case 'CS':
				summary.bs++
				break
		}
	}

	return summary
}

/**
 * Flattens a unit subtree (units, down to squads, + their students) into an
 * ordered list of header/member rows for a single-table docx template:
 * {FOR row}{IF row.type=='header'}...{IF row.type=='member'}... —
 * docx-templates can't dynamically merge cells per iteration, so the
 * template itself carries two row shapes (merged header row, 6-cell member
 * row) and this function decides, per row, which one applies.
 */
export function buildRosterRows(
	rootUnit: RosterUnitNode,
	units: RosterUnitNode[],
	students: RosterStudent[],
	positions: RosterPosition[] = []
): RosterRow[] {
	const positionPriorities = new Map<string, number>()
	for (const p of positions) {
		positionPriorities.set(
			`${p.level}:${p.code.trim().toLowerCase()}`,
			p.priority
		)
	}
	const positionCategories = buildPositionCategories(positions)

	const childUnitsByParent = new Map<number, RosterUnitNode[]>()
	for (const u of units) {
		if (
			u.id === rootUnit.id ||
			u.parentId === null ||
			u.parentId === undefined
		) {
			continue
		}
		const list = childUnitsByParent.get(u.parentId) ?? []
		list.push(u)
		childUnitsByParent.set(u.parentId, list)
	}

	const studentsByUnit = new Map<number, RosterStudent[]>()
	for (const s of students) {
		if (s.unitId !== null && s.unitId !== undefined) {
			const list = studentsByUnit.get(s.unitId) ?? []
			list.push(s)
			studentsByUnit.set(s.unitId, list)
		}
	}

	const unitLevelById = buildUnitLevelMap(rootUnit, units)

	for (const [unitId, list] of studentsByUnit) {
		const level = unitLevelById.get(unitId) ?? 'company'
		list.sort((a, b) =>
			compareRosterStudents(
				level,
				positionPriorities,
				positionCategories,
				a,
				b
			)
		)
	}

	const rows: RosterRow[] = []
	let stt = 0

	function toMemberRow(s: RosterStudent): RosterMemberRow {
		stt += 1
		return {
			type: 'member',
			stt,
			fullName: s.fullName,
			rank: formatRankAbbrev(s.rank),
			position: s.position,
			enlistmentPeriod: s.enlistmentPeriod,
			note: ''
		}
	}

	function countUnitMembers(unit: RosterUnitNode): number {
		let count = (studentsByUnit.get(unit.id) ?? []).length

		for (const child of childUnitsByParent.get(unit.id) ?? []) {
			count += countUnitMembers(child)
		}

		return count
	}

	function walkUnit(unit: RosterUnitNode): void {
		rows.push({
			type: 'header',
			name: unit.name,
			count: countUnitMembers(unit)
		})

		for (const s of studentsByUnit.get(unit.id) ?? []) {
			rows.push(toMemberRow(s))
		}

		for (const child of childUnitsByParent.get(unit.id) ?? []) {
			walkUnit(child)
		}
	}

	walkUnit(rootUnit)

	return rows
}
