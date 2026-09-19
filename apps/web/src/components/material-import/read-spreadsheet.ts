import * as XLSX from 'xlsx'

export interface SheetRows {
	headers: string[]
	dataRows: unknown[][]
}

export class SpreadsheetReadError extends Error {}

export function isSupportedSpreadsheet(file: File) {
	return (
		file.type === 'text/csv' ||
		file.name.endsWith('.csv') ||
		file.type === 'application/vnd.ms-excel' ||
		file.type ===
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
		file.name.endsWith('.xlsx') ||
		file.name.endsWith('.xls')
	)
}

// Row 2 holds the API column names; everything from row 3 on is data, minus
// rows the user left completely blank.
export function parseSpreadsheetBuffer(data: Uint8Array): SheetRows {
	const workbook = XLSX.read(data, { type: 'array' })
	const worksheet = workbook.Sheets[workbook.SheetNames[0]]

	const jsonData = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
		defval: '',
		header: 1
	})
	const dataRows = jsonData
		.slice(2)
		.filter((row) => row.some((cell) => cell !== '' && cell != null))

	return { headers: jsonData[1] as string[], dataRows }
}

export function readSpreadsheetFile(file: File): Promise<SheetRows> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader()

		reader.onload = (e) => {
			try {
				resolve(
					parseSpreadsheetBuffer(
						new Uint8Array(e.target?.result as ArrayBuffer)
					)
				)
			} catch (error) {
				reject(error)
			}
		}
		reader.onerror = (error) => {
			console.error('FileReader error:', error)
			reject(new SpreadsheetReadError('FileReader failed'))
		}

		reader.readAsArrayBuffer(file)
	})
}
