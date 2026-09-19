import * as XLSX from 'xlsx'
import { parseSpreadsheetBuffer } from './read-spreadsheet'

// Builds an uploaded template the way Excel would save it: Vietnamese header
// row, hidden API header row, then data rows.
export function readTemplate(headers: string[], dataRows: unknown[][]) {
	const sheet = XLSX.utils.aoa_to_sheet([headers, headers, ...dataRows])
	const workbook = XLSX.utils.book_new()
	XLSX.utils.book_append_sheet(workbook, sheet, 'Mẫu Import')
	const bytes = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
	return parseSpreadsheetBuffer(new Uint8Array(bytes))
}
