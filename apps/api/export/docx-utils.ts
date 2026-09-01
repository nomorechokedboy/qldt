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
