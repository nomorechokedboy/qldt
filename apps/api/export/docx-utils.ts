export function normalizeRowForDocx(
	row: Record<string, any>
): Record<string, any> {
	const normalized: Record<string, any> = {}

	for (const [col, rawValue] of Object.entries(row)) {
		let cellValue = rawValue

		if (cellValue === null || cellValue === undefined) {
			cellValue = ''
		} else if (typeof cellValue === 'boolean') {
			cellValue = cellValue ? 'Có' : 'Không'
		} else if (Array.isArray(cellValue)) {
			cellValue = cellValue.length > 0 ? cellValue.join(', ') : ''
		} else {
			cellValue = String(cellValue)
		}

		normalized[col] = cellValue
	}

	return normalized
}

export function deriveColumns(rows: Record<string, any>[]): string[] {
	return rows.length > 0 ? Object.keys(rows[0]) : []
}

/**
 * Recursively cleans raw record(s) for docx-templates without flattening
 * arrays/nested objects, so custom templates can nest {FOR} loops over
 * fields like childrenInfos/siblings instead of only seeing a joined string.
 */
export function normalizeRawForDocx(value: any): any {
	if (value === null || value === undefined) {
		return ''
	}

	if (typeof value === 'boolean') {
		return value ? 'Có' : 'Không'
	}

	if (Array.isArray(value)) {
		return value.map(normalizeRawForDocx)
	}

	if (typeof value === 'object') {
		const normalized: Record<string, any> = {}
		for (const [key, v] of Object.entries(value)) {
			normalized[key] = normalizeRawForDocx(v)
		}
		return normalized
	}

	return value
}
