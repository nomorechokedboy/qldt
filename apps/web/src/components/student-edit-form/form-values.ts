import i18n from '@/i18n'
import { toDdMmYyyy, toIsoDate } from '@/common'
import type { Student } from '@/types'

// The date inputs edit dd/mm/yyyy text while the API stores ISO dates.
export const DATE_FIELDS = [
	'dob',
	'fatherDob',
	'motherDob',
	'spouseDob',
	'politicalOrgOfficialDate',
	'cpvOfficialAt'
] as const

// Select and number inputs work on strings; these are numbers on the API.
type StringifiedField = 'unitId' | 'positionId' | 'familySize'

export type StudentFormValues = Omit<Student, StringifiedField> &
	Record<StringifiedField, string> & { avatarFile: File | null }

const DATE_PATTERN = /^\d{2}\/\d{2}\/\d{4}$/

export const dateFormatError = () => i18n.t('student:validation.editDateFormat')

const asText = (value: number | null | undefined) =>
	value === undefined || value === null ? '' : String(value)

export function toFormValues(student: Student): StudentFormValues {
	const dates = Object.fromEntries(
		DATE_FIELDS.map((name) => [name, toDdMmYyyy(student[name] ?? '')])
	)

	return {
		...student,
		...dates,
		rank: student.rank || 'Binh nhất',
		studentId: student.studentId || '',
		relatedDocumentations: student.relatedDocumentations || '',
		unitId: asText(student.unitId),
		positionId: asText(student.positionId),
		familySize: asText(student.familySize),
		contactPerson: student.contactPerson || {
			name: '',
			phoneNumber: '',
			address: ''
		},
		childrenInfos: student.childrenInfos || [],
		siblings: student.siblings || [],
		avatarFile: null
	}
}

export function invalidDateFields(values: StudentFormValues) {
	return DATE_FIELDS.filter((name) => {
		const text = values[name]
		return !!text && !DATE_PATTERN.test(text)
	})
}

const toNumber = (text: string) => (text === '' ? undefined : Number(text))

// `avatar` is the uploaded file's URI when a new picture was chosen.
export function toPatchPayload(
	{ avatarFile: _avatarFile, ...values }: StudentFormValues,
	avatar?: string
): Student {
	const dates = Object.fromEntries(
		DATE_FIELDS.map((name) => [name, toIsoDate(values[name])])
	)

	return {
		...values,
		...dates,
		// Cleared party-entry date is stored as NULL, like the create form.
		cpvOfficialAt: dates.cpvOfficialAt || null,
		unitId: toNumber(values.unitId),
		positionId: toNumber(values.positionId),
		familySize: toNumber(values.familySize),
		// The API returns null for no picture but refuses null on the way back,
		// so an absent picture is left out of the request.
		avatar: avatar ?? values.avatar ?? undefined
	} as Student
}
