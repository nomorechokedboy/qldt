// Explicit seniority order per rank group, junior-first. Mirrors
// apps/api/rank-promotion-proposals/rank-order.ts. Kept separate from
// rankOptions in ranks.ts (a display list for the student edit form's
// dropdown, not guaranteed to be seniority-ordered — its HSQ-BS group lists
// Binh nhất before Binh nhì) so promotion eligibility filtering never
// depends on that array's display order. The rank *values* (strings) must
// stay in sync with rankOptions and with the backend's RANK_GROUPS.
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

// Whether `target` is a strictly more senior rank than `current`, within the
// same group. Mirrors isForwardPromotion on the backend — used here to
// filter which troopers are eligible to be shown for a given target rank
// (cross-group moves, unknown ranks, and same-or-junior targets are never
// eligible).
export function isForwardPromotion(
	current: string | null | undefined,
	target: string
): boolean {
	if (!current) return false
	const currentGroup = rankGroupOf(current)
	const targetGroup = rankGroupOf(target)
	if (currentGroup === undefined || currentGroup !== targetGroup) return false
	return rankOrdinal(target)! > rankOrdinal(current)!
}

// Whether `current` is exactly one step junior to `target` — the trooper
// picker only offers the immediate next rank up, not every rank below it
// (e.g. picking "Hạ sĩ" shows Binh nhất troopers, not Binh nhì ones too).
export function isDirectPromotion(
	current: string | null | undefined,
	target: string
): boolean {
	if (!current) return false
	const currentGroup = rankGroupOf(current)
	const targetGroup = rankGroupOf(target)
	if (currentGroup === undefined || currentGroup !== targetGroup) return false
	return rankOrdinal(target)! - rankOrdinal(current)! === 1
}
