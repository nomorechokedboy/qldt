import { positionName } from '@/lib/position-name'
import type { Student } from '@/types'
import i18n from '@/i18n'

export interface StudentExportField {
	key: string
	label: string
	getValue: (student: Student) => string
}

function joinChildren(list?: { fullName?: string; dob?: string }[]): string {
	if (!list || list.length === 0) return ''
	return list
		.map((c) => [c.fullName, c.dob].filter(Boolean).join(' - '))
		.join(', ')
}

export const studentExportFields: StudentExportField[] = [
	{
		key: 'fullName',
		get label() {
			return i18n.t('table:columns.fullName')
		},
		getValue: (s) => s.fullName ?? ''
	},
	{
		key: 'dob',
		get label() {
			return i18n.t('table:columns.dob')
		},
		getValue: (s) => s.dob ?? ''
	},
	{
		key: 'rank',
		get label() {
			return i18n.t('table:columns.rank')
		},
		getValue: (s) => s.rank ?? ''
	},
	{
		key: 'position',
		get label() {
			return i18n.t('table:columns.position')
		},
		getValue: (s) => positionName(s) ?? ''
	},
	{
		key: 'previousUnit',
		get label() {
			return i18n.t('table:columns.previousUnit')
		},
		getValue: (s) => s.previousUnit ?? ''
	},
	{
		key: 'previousPosition',
		get label() {
			return i18n.t('table:columns.previousPosition')
		},
		getValue: (s) => s.previousPosition ?? ''
	},
	{
		key: 'birthPlace',
		get label() {
			return i18n.t('table:columns.birthPlace')
		},
		getValue: (s) => s.birthPlace ?? ''
	},
	{
		key: 'address',
		get label() {
			return i18n.t('table:columns.address')
		},
		getValue: (s) => s.address ?? ''
	},
	{
		key: 'enlistmentPeriod',
		get label() {
			return i18n.t('table:columns.enlistmentPeriod')
		},
		getValue: (s) => s.enlistmentPeriod ?? ''
	},
	{
		key: 'ethnic',
		get label() {
			return i18n.t('table:columns.ethnic')
		},
		getValue: (s) => s.ethnic ?? ''
	},
	{
		key: 'religion',
		get label() {
			return i18n.t('table:columns.religion')
		},
		getValue: (s) => s.religion ?? ''
	},
	{
		key: 'educationLevel',
		get label() {
			return i18n.t('table:columns.education')
		},
		getValue: (s) => s.educationLevel ?? ''
	},
	{
		key: 'schoolName',
		get label() {
			return i18n.t('table:columns.schoolName')
		},
		getValue: (s) => s.schoolName ?? ''
	},
	{
		key: 'major',
		get label() {
			return i18n.t('table:columns.major')
		},
		getValue: (s) => s.major ?? ''
	},
	{
		key: 'isGraduated',
		get label() {
			return i18n.t('table:columns.graduated')
		},
		getValue: (s) =>
			s.isGraduated
				? i18n.t('table:values.yes')
				: i18n.t('table:values.no')
	},
	{
		key: 'phone',
		get label() {
			return i18n.t('table:columns.phone')
		},
		getValue: (s) => s.phone ?? ''
	},
	{
		key: 'policyBeneficiaryGroup',
		get label() {
			return i18n.t('table:columns.policyGroup')
		},
		getValue: (s) => s.policyBeneficiaryGroup ?? ''
	},
	{
		key: 'politicalOrg',
		get label() {
			return i18n.t('table:columns.politicalOrg')
		},
		getValue: (s) =>
			s.politicalOrg === 'cpv'
				? i18n.t('table:values.cpvMember')
				: i18n.t('table:values.hcyuMember')
	},
	{
		key: 'politicalOrgOfficialDate',
		get label() {
			return i18n.t('table:columns.hcyuDate')
		},
		getValue: (s) => s.politicalOrgOfficialDate ?? ''
	},
	{
		key: 'cpvId',
		get label() {
			return i18n.t('table:columns.cpvId')
		},
		getValue: (s) => s.cpvId ?? ''
	},
	{
		key: 'cpvOfficialAt',
		get label() {
			return i18n.t('table:columns.cpvDate')
		},
		getValue: (s) => s.cpvOfficialAt ?? ''
	},
	{
		key: 'shortcoming',
		get label() {
			return i18n.t('table:columns.shortcoming')
		},
		getValue: (s) => s.shortcoming ?? ''
	},
	{
		key: 'talent',
		get label() {
			return i18n.t('table:columns.talent')
		},
		getValue: (s) => s.talent ?? ''
	},
	{
		key: 'fatherName',
		get label() {
			return i18n.t('table:columns.fatherName')
		},
		getValue: (s) => s.fatherName ?? ''
	},
	{
		key: 'fatherJob',
		get label() {
			return i18n.t('table:columns.fatherJob')
		},
		getValue: (s) => s.fatherJob ?? ''
	},
	{
		key: 'fatherPhoneNumber',
		get label() {
			return i18n.t('table:columns.fatherPhone')
		},
		getValue: (s) => s.fatherPhoneNumber ?? ''
	},
	{
		key: 'motherName',
		get label() {
			return i18n.t('table:columns.motherName')
		},
		getValue: (s) => s.motherName ?? ''
	},
	{
		key: 'motherJob',
		get label() {
			return i18n.t('table:columns.motherJob')
		},
		getValue: (s) => s.motherJob ?? ''
	},
	{
		key: 'motherPhoneNumber',
		get label() {
			return i18n.t('table:columns.motherPhone')
		},
		getValue: (s) => s.motherPhoneNumber ?? ''
	},
	{
		key: 'isMarried',
		get label() {
			return i18n.t('table:columns.married')
		},
		getValue: (s) =>
			s.isMarried ? i18n.t('table:values.yes') : i18n.t('table:values.no')
	},
	{
		key: 'spouseName',
		get label() {
			return i18n.t('table:columns.spouseName')
		},
		getValue: (s) => s.spouseName ?? ''
	},
	{
		key: 'spouseJob',
		get label() {
			return i18n.t('table:columns.spouseJob')
		},
		getValue: (s) => s.spouseJob ?? ''
	},
	{
		key: 'spousePhoneNumber',
		get label() {
			return i18n.t('table:columns.spousePhone')
		},
		getValue: (s) => s.spousePhoneNumber ?? ''
	},
	{
		key: 'familySize',
		get label() {
			return i18n.t('table:columns.familySize')
		},
		getValue: (s) =>
			s.familySize !== undefined ? String(s.familySize) : ''
	},
	{
		key: 'familyBackground',
		get label() {
			return i18n.t('table:columns.familyBackground')
		},
		getValue: (s) => s.familyBackground ?? ''
	},
	{
		key: 'achievement',
		get label() {
			return i18n.t('table:columns.achievement')
		},
		getValue: (s) => s.achievement ?? ''
	},
	{
		key: 'disciplinaryHistory',
		get label() {
			return i18n.t('table:columns.discipline')
		},
		getValue: (s) => s.disciplinaryHistory ?? ''
	},
	{
		key: 'childrenInfos',
		get label() {
			return i18n.t('table:columns.children')
		},
		getValue: (s) => joinChildren(s.childrenInfos)
	},
	{
		key: 'studentId',
		get label() {
			return i18n.t('table:columns.studentId')
		},
		getValue: (s) => s.studentId ?? ''
	},
	{
		key: 'status',
		get label() {
			return i18n.t('table:columns.status')
		},
		getValue: (s) =>
			s.status === 'confirmed'
				? i18n.t('table:values.confirmed')
				: i18n.t('table:values.pending')
	},
	{
		key: 'unit',
		get label() {
			return i18n.t('table:columns.unit')
		},
		getValue: (s) => s.unit?.name ?? ''
	}
]

export function buildStudentExportRow(
	student: Student,
	selectedKeys?: string[]
): Record<string, string> {
	const fields = selectedKeys
		? studentExportFields.filter((f) => selectedKeys.includes(f.key))
		: studentExportFields

	return Object.fromEntries(
		fields.map((field) => [field.label, field.getValue(student)])
	)
}
