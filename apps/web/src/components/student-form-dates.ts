import { toIsoDate } from '@/common'

interface StudentDates {
	dob: string
	fatherDob?: string
	motherDob?: string
	spouseDob?: string
	politicalOrgOfficialDate?: string
	cpvOfficialAt?: string | null
}

// The date pickers edit dd/mm/yyyy text; the API stores ISO dates. An empty
// party-entry date is stored as NULL, the other optional dates as ''.
export function withIsoDates<T extends StudentDates>(value: T): T {
	return {
		...value,
		dob: toIsoDate(value.dob),
		fatherDob: toIsoDate(value.fatherDob),
		motherDob: toIsoDate(value.motherDob),
		spouseDob: toIsoDate(value.spouseDob),
		politicalOrgOfficialDate: toIsoDate(value.politicalOrgOfficialDate),
		cpvOfficialAt: toIsoDate(value.cpvOfficialAt) || null
	}
}
