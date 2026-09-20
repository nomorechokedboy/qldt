import i18n from '@/i18n'
import dayjs from 'dayjs'
import * as z from 'zod'
import customParseFormat from 'dayjs/plugin/customParseFormat'

dayjs.extend(customParseFormat)

// Zod calls `error` while parsing, so messages follow the language in use at
// that moment instead of the one the module was loaded in.
const msg = (key: string) => ({
	error: () => i18n.t(key as never) as string
})

const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/

const optionalDate = z
	.string()
	.trim()
	.refine(
		(val) => val === '' || dateRegex.test(val),
		msg('student:validation.dateFormat')
	)
	.refine(
		(val) => val === '' || dayjs(val, 'DD/MM/YYYY', true).isValid(),
		msg('student:validation.invalidDate')
	)
	.optional()

const isoDateSchema = z
	.string()
	.regex(
		/^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/,
		msg('student:validation.dateFormat')
	)
	.refine(
		(s) => dayjs(s, 'DD/MM/YYYY', true).isValid(),
		msg('student:validation.invalidDate')
	)
	.transform((s) => dayjs(s, 'DD/MM/YYYY').toISOString())

const toOptionalNumber = (val: unknown) => {
	if (val === undefined || val === null || val === '' || val === 0) {
		return undefined
	}

	if (typeof val === 'string') {
		return Number.parseInt(val)
	}

	return val
}

export const personalInfoSchema = z.object({
	avatar: z
		.file()
		.mime(['image/png', 'image/webp', 'image/jpeg', 'image/svg+xml'])
		.max(2_000_000)
		.nullable(),
	fullName: z.string().nonempty(msg('student:validation.fullNameRequired')),
	unitId: z.preprocess(toOptionalNumber, z.number().min(1)),
	birthPlace: z.string().optional(),
	address: z.string().optional(),
	ethnic: z.string().nonempty(msg('student:validation.ethnicRequired')),
	religion: z.string().nonempty(msg('student:validation.religionRequired')),
	educationLevel: z
		.string()
		.nonempty(msg('student:validation.educationRequired')),
	schoolName: z.string().optional(),
	major: z.string().optional(),
	phone: z.string().optional(),
	dob: isoDateSchema,
	studentId: z.string()
})

export const militaryInfoSchema = z.object({
	rank: z.string(),
	positionId: z.preprocess(
		toOptionalNumber,
		z.number().min(1, msg('student:validation.positionRequired'))
	),
	enlistmentPeriod: z.string().optional(),
	policyBeneficiaryGroup: z.string().optional(),
	previousUnit: z.string().optional(),
	previousPosition: z.string().optional(),
	activityStatus: z.string().optional().default('serving'),
	politicalOrg: z.string(),
	politicalOrgOfficialDate: optionalDate,
	cpvId: z.string().optional(),
	cpvOfficialAt: optionalDate.nullish(),
	talent: z.string().optional(),
	shortcoming: z.string().optional(),
	achievement: z.string().optional(),
	disciplinaryHistory: z.string().optional(),
	contactPerson: z
		.object({
			name: z.string().optional(),
			phoneNumber: z.string().optional(),
			address: z.string().optional()
		})
		.optional()
		.default({}),
	relatedDocumentations: z.string().optional().default('')
})

export const ChildrenInfoSchema = z.object({
	fullName: z.string().nonempty(msg('student:validation.nameRequired')),
	dob: isoDateSchema
})

export const parentInfoSchema = z.object({
	familySize: z.coerce.number().optional(),
	familyBirthOrder: z.string().optional(),
	familyBackground: z.string().optional(),
	fatherName: z.string().optional(),
	fatherDob: optionalDate,
	fatherJob: z.string().optional(),
	fatherPhoneNumber: z.string().optional(),
	motherName: z.string().optional(),
	motherDob: optionalDate,
	motherJob: z.string().optional(),
	motherPhoneNumber: z.string().optional(),
	siblings: z.array(ChildrenInfoSchema).optional()
})

export const familyInfoSchema = z.object({
	spouseName: z.string().optional(),
	spouseDob: optionalDate,
	spouseJob: z.string().optional(),
	spousePhoneNumber: z.string().optional(),
	childrenInfos: z.array(ChildrenInfoSchema).optional(),
	isMarried: z.boolean().default(false)
})

export const personalInfoValidationSchema = personalInfoSchema

export const StudentFormSchema = personalInfoSchema
	.extend(militaryInfoSchema.shape)
	.extend(parentInfoSchema.shape)
	.extend(familyInfoSchema.shape)

export type StudentFormSchemaType = z.infer<typeof StudentFormSchema>
