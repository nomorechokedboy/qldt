import {
	familyInfoSchema,
	militaryInfoSchema,
	parentInfoSchema,
	personalInfoValidationSchema
} from '@/components/student-form-schema'

export const STEPS = [
	{
		id: 'personal',
		fields: [
			'fullName',
			'unitId',
			'birthPlace',
			'address',
			'ethnic',
			'religion',
			'educationLevel',
			'schoolName',
			'major',
			'phone',
			'dob',
			'avatar',
			'studentId'
		],
		validationSchema: personalInfoValidationSchema
	},
	{
		id: 'other',
		fields: [
			'rank',
			'positionId',
			'enlistmentPeriod',
			'policyBeneficiaryGroup',
			'previousUnit',
			'previousPosition',
			'politicalOrg',
			'politicalOrgOfficialDate',
			'cpvId',
			'cpvOfficialAt',
			'talent',
			'shortcoming',
			'achievement',
			'disciplinaryHistory',
			'contactPerson',
			'relatedDocumentations'
		],
		validationSchema: militaryInfoSchema
	},
	{
		id: 'parent',
		fields: [
			'familySize',
			'familyBirthOrder',
			'familyBackground',
			'fatherName',
			'fatherDob',
			'fatherJob',
			'fatherPhoneNumber',
			'motherName',
			'motherDob',
			'motherJob',
			'motherPhoneNumber',
			'siblings'
		],
		validationSchema: parentInfoSchema
	},
	{
		id: 'family',
		fields: [
			'spouseName',
			'spouseDob',
			'spouseJob',
			'spousePhoneNumber',
			'childrenInfos'
		],
		validationSchema: familyInfoSchema
	}
] as const
