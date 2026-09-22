import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// The app reads uploads with SheetJS; the e2e package borrows the copy that
// apps/web already depends on rather than pinning its own.
const requireFromWeb = createRequire(
	path.resolve(
		path.dirname(fileURLToPath(import.meta.url)),
		'../../web/package.json'
	)
)
const XLSX = requireFromWeb('xlsx') as typeof import('xlsx')

// Column order of the import template: the second row of the sheet holds these
// API names and is what the importer reads; the first row is only for people.
export const TROOPER_COLUMNS = [
	'fullName',
	'studentId',
	'birthPlaceProvinceName',
	'birthPlaceWardName',
	'birthPlaceDetail',
	'addressProvinceName',
	'addressWardName',
	'addressDetail',
	'dob',
	'phone',
	'unitId',
	'rank',
	'positionId',
	'ethnic',
	'religion',
	'enlistmentPeriod',
	'activityStatus',
	'politicalOrg',
	'politicalOrgOfficialDate',
	'cpvId',
	'educationLevel',
	'schoolName',
	'major',
	'isGraduated',
	'talent',
	'shortcoming',
	'policyBeneficiaryGroup',
	'fatherName',
	'fatherDob',
	'fatherPhoneNumber',
	'fatherJob',
	'motherName',
	'motherDob',
	'motherPhoneNumber',
	'motherJob',
	'isMarried',
	'spouseName',
	'spouseDob',
	'spouseJob',
	'spousePhoneNumber',
	'familySize',
	'familyBackground',
	'familyBirthOrder',
	'achievement',
	'disciplinaryHistory'
] as const

export type TrooperColumn = (typeof TROOPER_COLUMNS)[number]
export type TrooperRow = Partial<Record<TrooperColumn, string>>

// An .xlsx laid out like the app's template: a header for people, the API
// header, then one line per trooper.
export function trooperWorkbook(rows: TrooperRow[]): Buffer {
	const sheet = XLSX.utils.aoa_to_sheet([
		[...TROOPER_COLUMNS],
		[...TROOPER_COLUMNS],
		...rows.map((row) => TROOPER_COLUMNS.map((c) => row[c] ?? ''))
	])
	const book = XLSX.utils.book_new()
	XLSX.utils.book_append_sheet(book, sheet, 'Mẫu Import')
	return XLSX.write(book, { type: 'buffer', bookType: 'xlsx' }) as Buffer
}
