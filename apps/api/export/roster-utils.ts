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
 *   2. "Nhân viên" (NV./Nhân viên prefix) or QNCN rank
 *   3. HSQ/BS rank
 * Duty title decides tiers 1-2 (a QNCN-ranked "Trợ lý" still sorts as a
 * Trợ lý); rank alone decides tier 3. Ties within every tier fall back to
 * rank, highest first.
 */
function departmentTier(position: string, rank: string): number {
	const p = position.trim().toLowerCase()
	const isTL = p.startsWith('tl') || p.startsWith('trợ lý')
	const isNV = p.startsWith('nv') || p.startsWith('nhân viên')
	const category = classifyRank(rank)

	if (isTL) {
		return 1
	}
	if (isNV || category === 'QNCN') {
		return 2
	}
	if (category === 'HSQ' || category === 'BS') {
		return 3
	}

	return 0
}

function positionTier(
	level: string,
	position: string,
	rank: string,
	positionPriorities: ReadonlyMap<string, number>
): number {
	switch (level) {
		case 'battalion':
			return battalionTier(position, positionPriorities)
		case 'company':
		case 'platoon':
		case 'squad':
			return companyTier(level, position, positionPriorities)
		default:
			return departmentTier(position, rank)
	}
}

function compareRosterStudents(
	level: string,
	positionPriorities: ReadonlyMap<string, number>,
	a: Pick<RosterStudent, 'position' | 'rank'>,
	b: Pick<RosterStudent, 'position' | 'rank'>
): number {
	const tierDiff =
		positionTier(level, a.position, a.rank, positionPriorities) -
		positionTier(level, b.position, b.rank, positionPriorities)
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
	bs: number
}

export interface RosterUnitNode {
	id: number
	name: string
	parentId: number | null | undefined
	level: string
}

export interface RosterClassNode {
	id: number
	name: string
	unitId: number
}

export interface RosterStudent {
	fullName: string
	rank: string
	position: string
	enlistmentPeriod: string
	unitId: number | null | undefined
	classId: number | null | undefined
}

// A row from the `positions` table (level-scoped position-priority
// overrides), used to sort a unit's members instead of the hardcoded
// per-level heuristics — see battalionTier.
export interface RosterPosition {
	level: string
	code: string
	priority: number
}

export function buildRosterSummary(
	students: Pick<RosterStudent, 'rank'>[]
): RosterSummary {
	const summary: RosterSummary = {
		total: students.length,
		sq: 0,
		qncn: 0,
		hsq: 0,
		bs: 0
	}

	for (const s of students) {
		switch (classifyRank(s.rank)) {
			case 'SQ':
				summary.sq++
				break
			case 'QNCN':
				summary.qncn++
				break
			case 'HSQ':
				summary.hsq++
				break
			case 'BS':
				summary.bs++
				break
		}
	}

	return summary
}

/**
 * Flattens a unit subtree (units + their classes/squads + their students)
 * into an ordered list of header/member rows for a single-table docx
 * template: {FOR row}{IF row.type=='header'}...{IF row.type=='member'}...
 * — docx-templates can't dynamically merge cells per iteration, so the
 * template itself carries two row shapes (merged header row, 6-cell member
 * row) and this function decides, per row, which one applies.
 */
export function buildRosterRows(
	rootUnit: RosterUnitNode,
	units: RosterUnitNode[],
	classes: RosterClassNode[],
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

	const classesByUnit = new Map<number, RosterClassNode[]>()
	for (const c of classes) {
		const list = classesByUnit.get(c.unitId) ?? []
		list.push(c)
		classesByUnit.set(c.unitId, list)
	}

	const studentsByUnit = new Map<number, RosterStudent[]>()
	const studentsByClass = new Map<number, RosterStudent[]>()
	for (const s of students) {
		if (s.classId !== null && s.classId !== undefined) {
			const list = studentsByClass.get(s.classId) ?? []
			list.push(s)
			studentsByClass.set(s.classId, list)
		} else if (s.unitId !== null && s.unitId !== undefined) {
			const list = studentsByUnit.get(s.unitId) ?? []
			list.push(s)
			studentsByUnit.set(s.unitId, list)
		}
	}

	const unitLevelById = new Map<number, string>([
		[rootUnit.id, rootUnit.level]
	])
	for (const u of units) {
		unitLevelById.set(u.id, u.level)
	}

	for (const [unitId, list] of studentsByUnit) {
		const level = unitLevelById.get(unitId) ?? 'company'
		list.sort((a, b) =>
			compareRosterStudents(level, positionPriorities, a, b)
		)
	}
	// Squad members are always ordered by the company/platoon/squad scheme
	// (squad leader first, then members by rank) regardless of the parent
	// unit's own level.
	for (const list of studentsByClass.values()) {
		list.sort((a, b) =>
			compareRosterStudents('squad', positionPriorities, a, b)
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

		for (const cls of classesByUnit.get(unit.id) ?? []) {
			count += (studentsByClass.get(cls.id) ?? []).length
		}

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

		for (const cls of classesByUnit.get(unit.id) ?? []) {
			const members = studentsByClass.get(cls.id) ?? []
			rows.push({ type: 'header', name: cls.name, count: members.length })
			for (const s of members) {
				rows.push(toMemberRow(s))
			}
		}

		for (const child of childUnitsByParent.get(unit.id) ?? []) {
			walkUnit(child)
		}
	}

	walkUnit(rootUnit)

	return rows
}
