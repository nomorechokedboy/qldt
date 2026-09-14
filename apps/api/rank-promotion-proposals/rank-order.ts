// Explicit seniority order per rank group, junior-first. Kept separate from
// apps/web/src/data/ranks.ts's `rankOptions` (a display list for the student
// edit form's dropdown, not guaranteed to be seniority-ordered) so a
// promotion's forward-only validation never depends on that array's display
// order. The rank *values* (strings) must stay in sync with rankOptions.
export const RANK_GROUPS = {
	'HSQ-BS': ['Binh nhì', 'Binh nhất', 'Hạ sĩ', 'Trung sĩ', 'Thượng sĩ'],
	SQ: [
		'Thiếu úy',
		'Trung úy',
		'Thượng úy',
		'Đại úy',
		'Thiếu tá',
		'Trung tá',
		'Thượng tá',
		'Đại tá'
	],
	QNCN: [
		'Thiếu úy chuyên nghiệp',
		'Trung úy chuyên nghiệp',
		'Thượng úy chuyên nghiệp',
		'Đại úy chuyên nghiệp',
		'Thiếu tá chuyên nghiệp',
		'Trung tá chuyên nghiệp',
		'Thượng tá chuyên nghiệp'
	]
} as const

export type RankGroup = keyof typeof RANK_GROUPS

export function isKnownRank(rank: string): boolean {
	return Object.values(RANK_GROUPS).some((ranks) =>
		(ranks as readonly string[]).includes(rank)
	)
}

export function rankGroupOf(rank: string): RankGroup | undefined {
	return (Object.keys(RANK_GROUPS) as RankGroup[]).find((group) =>
		(RANK_GROUPS[group] as readonly string[]).includes(rank)
	)
}

function rankOrdinal(rank: string): number | undefined {
	const group = rankGroupOf(rank)
	if (group === undefined) return undefined
	return (RANK_GROUPS[group] as readonly string[]).indexOf(rank)
}

// Whether `target` is exactly one rank senior to `current`, within the same
// group. Cross-group moves (e.g. enlisted -> officer commissioning) are a
// different real-world process than a routine promotion and are rejected
// here, same as an unknown rank, a same-or-junior target, or skipping a
// rank - a promotion proposal only ever moves a trooper up to the next
// rank.
export function isDirectPromotion(current: string, target: string): boolean {
	const currentGroup = rankGroupOf(current)
	const targetGroup = rankGroupOf(target)
	if (currentGroup === undefined || currentGroup !== targetGroup) return false
	return rankOrdinal(target)! - rankOrdinal(current)! === 1
}
