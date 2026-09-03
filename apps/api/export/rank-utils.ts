export type RankCategory = 'SQ' | 'QNCN' | 'HSQ' | 'BS'

// Full-text rank label -> abbreviated code used on printed roster reports
// (matches the "Cấp bậc" column format of the source military template).
const RANK_ABBREVIATIONS: Record<string, string> = {
	'binh nhất': 'B1',
	'binh nhì': 'B2',
	'hạ sĩ': 'H1',
	'trung sĩ': 'H2',
	'thượng sĩ': 'H3',
	'thiếu úy': '1/',
	'trung úy': '2/',
	'thượng úy': '3/',
	'đại úy': '4/',
	'thiếu tá': '1//',
	'trung tá': '2//',
	'thượng tá': '3//',
	'đại tá': '4//',
	'thiếu úy chuyên nghiệp': '1/ CN',
	'trung úy chuyên nghiệp': '2/ CN',
	'thượng úy chuyên nghiệp': '3/ CN',
	'đại úy chuyên nghiệp': '4/ CN',
	'thiếu tá chuyên nghiệp': '1// CN',
	'trung tá chuyên nghiệp': '2// CN',
	'thượng tá chuyên nghiệp': '3// CN'
}

/**
 * Converts a full-text rank (e.g. "Đại úy") to its printed abbreviation
 * (e.g. "4/"). Falls back to the original text when unrecognized, so
 * inconsistently-cased legacy data still renders instead of disappearing.
 */
export function formatRankAbbrev(rank: string): string {
	const key = rank.trim().toLowerCase()
	return RANK_ABBREVIATIONS[key] ?? rank
}

/**
 * Classifies a full-text rank into the four headcount buckets used on
 * roster summary lines. "chuyên nghiệp" must be checked before "úy"/"tá"
 * since QNCN rank labels (e.g. "Thiếu úy chuyên nghiệp") contain both.
 */
export function classifyRank(rank: string): RankCategory | undefined {
	const value = rank.trim().toLowerCase()

	if (!value) {
		return undefined
	}
	if (value.includes('chuyên nghiệp')) {
		return 'QNCN'
	}
	if (value.includes('úy') || value.includes('tá')) {
		return 'SQ'
	}
	if (['hạ sĩ', 'trung sĩ', 'thượng sĩ'].includes(value)) {
		return 'HSQ'
	}
	if (['binh nhất', 'binh nhì'].includes(value)) {
		return 'BS'
	}

	return undefined
}

// Base grades ordered lowest to highest; a "chuyên nghiệp" (QNCN) rank shares
// its base grade's tier since the two tracks (officer/professional-soldier)
// run in parallel, not below one another.
const RANK_ORDER = [
	'binh nhì',
	'binh nhất',
	'hạ sĩ',
	'trung sĩ',
	'thượng sĩ',
	'thiếu úy',
	'trung úy',
	'thượng úy',
	'đại úy',
	'thiếu tá',
	'trung tá',
	'thượng tá',
	'đại tá'
]

/**
 * Numeric weight for sorting a roster by seniority, highest rank first.
 * Unrecognized ranks sort last (weight -1) rather than crashing the sort.
 */
export function rankWeight(rank: string): number {
	const value = rank
		.trim()
		.toLowerCase()
		.replace(/\s*chuyên nghiệp$/, '')
	return RANK_ORDER.indexOf(value)
}
