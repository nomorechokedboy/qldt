export type UploadStatus = 'idle' | 'ready' | 'uploading' | 'success' | 'error'

export interface ImportRowError {
	row: number
	message: string
}

export interface ImportResults {
	successCount: number
	errorCount: number
	totalCount: number
	errors: ImportRowError[]
}

export interface ParsedRows<Row> {
	rows: Row[]
	errors: ImportRowError[]
}

// Sheet layout shared by every material template: row 1 is the Vietnamese
// header, row 2 the hidden API header, and data starts on row 3 (a sample
// row), which the parser reports as row 4 onwards - matching the row numbers
// shown in error messages.
const FIRST_DATA_ROW_NUMBER = 4

export const rowNumberFor = (index: number) => index + FIRST_DATA_ROW_NUMBER

export const rowIndexFor = (rowNumber: number) =>
	rowNumber - FIRST_DATA_ROW_NUMBER
