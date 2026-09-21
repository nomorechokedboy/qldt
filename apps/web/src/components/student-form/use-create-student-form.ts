import { CreateStudent } from '@/api'
import { StudentFormSchema } from '@/components/student-form-schema'
import type { StudentFormSchemaType } from '@/components/student-form-schema'
import { withIsoDates } from '@/components/student-form-dates'
import { useAppForm } from '@/hooks/use-app-form'
import useUploadFiles from '@/hooks/useUploadFiles'
import { toastApiError } from '@/lib/api-error'
import type { ContactPerson, Student, StudentBody } from '@/types'
import { useMutation } from '@tanstack/react-query'
import i18n from '@/i18n'
import { toast } from 'sonner'
import { validateAndSetErrors } from './validation'

const emptyValues = {
	fullName: '',
	birthPlace: '',
	address: '',
	dob: '',
	rank: '',
	previousUnit: '',
	previousPosition: '',
	activityStatus: 'serving',
	positionId: undefined,
	ethnic: '',
	religion: '',
	enlistmentPeriod: '',
	politicalOrg: 'hcyu',
	politicalOrgOfficialDate: '',
	cpvId: '',
	educationLevel: '',
	schoolName: '',
	major: '',
	isGraduated: false,
	talent: '',
	shortcoming: '',
	policyBeneficiaryGroup: '',
	fatherName: '',
	fatherDob: '',
	fatherJob: '',
	fatherPhoneNumber: '',
	motherName: '',
	motherDob: '',
	motherJob: '',
	motherPhoneNumber: '',
	isMarried: false,
	spouseName: '',
	spouseJob: '',
	spouseDob: '',
	spousePhoneNumber: '',
	childrenInfos: [],
	familySize: 0,
	familyBackground: '',
	familyBirthOrder: '',
	achievement: '',
	disciplinaryHistory: '',
	phone: '',
	unitId: undefined,
	cpvOfficialAt: '',
	avatar: null as File | null,
	siblings: [],
	contactPerson: {} as ContactPerson,
	relatedDocumentations: '',
	studentId: ''
} as StudentFormSchemaType

export default function useCreateStudentForm({
	onSuccess,
	onCreated
}: {
	onSuccess: (
		data: Student[],
		variables: StudentBody,
		context: unknown
	) => unknown
	onCreated: () => void
}) {
	const { mutateAsync } = useMutation({
		mutationFn: CreateStudent,
		onSuccess,
		onError: (error) => {
			console.error('Failed to create student:', error)
		}
	})
	const { mutateAsync: uploadFiles } = useUploadFiles()

	return useAppForm({
		defaultValues: emptyValues,
		onSubmit: async ({ value: { avatar, ...value }, formApi }) => {
			try {
				const parsed = StudentFormSchema.safeParse(formApi.state.values)
				if (!validateAndSetErrors(formApi, parsed)) return

				value.unitId =
					value.unitId !== undefined
						? Number(value.unitId)
						: undefined
				value.positionId = Number(value.positionId)
				value.familySize = Number(value.familySize)
				if (value.spouseName !== '') value.isMarried = true

				let avatarUri: string | undefined
				if (avatar !== null) {
					const formData = new FormData()
					formData.append('avatarImg', avatar)
					avatarUri = (await uploadFiles(formData)).uris[0]
				}

				await mutateAsync({ ...withIsoDates(value), avatar: avatarUri })
				toast.success(i18n.t('student:wizard.created'))
				formApi.reset()
				onCreated()
			} catch (err) {
				console.error(err)
				toastApiError(i18n.t('student:wizard.createFailed'), err)
			}
		},
		validators: { onSubmit: StudentFormSchema }
	})
}
