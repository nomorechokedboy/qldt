import i18n from '@/i18n'
import { useAppForm } from '@/hooks/use-app-form'
import usePatchStudentInfo from '@/hooks/usePatchStudentInfo'
import useUploadFiles from '@/hooks/useUploadFiles'
import { toastApiError } from '@/lib/api-error'
import type { Student } from '@/types'
import {
	dateFormatError,
	invalidDateFields,
	toFormValues,
	toPatchPayload
} from './form-values'

export default function useStudentEditForm(
	student: Student,
	onSaved?: () => void
) {
	const { handlePatchStudentInfo, isPending } = usePatchStudentInfo(student)
	const { mutateAsync: uploadFiles } = useUploadFiles()

	const form = useAppForm({
		defaultValues: toFormValues(student),
		validators: {
			onSubmit: ({ value }) => {
				const invalid = invalidDateFields(value)
				if (invalid.length === 0) return undefined

				return {
					fields: Object.fromEntries(
						invalid.map((name) => [name, dateFormatError()])
					)
				}
			}
		},
		onSubmit: async ({ value }) => {
			try {
				let avatar: string | undefined
				if (value.avatarFile !== null) {
					const formData = new FormData()
					formData.append('avatarImg', value.avatarFile)
					avatar = (await uploadFiles(formData)).uris[0]
				}

				await handlePatchStudentInfo(toPatchPayload(value, avatar))
				onSaved?.()
			} catch (err) {
				console.error('UpdateStudentInfo err: ', err)
				toastApiError(i18n.t('student:editForm.saveFailed'), err)
			}
		}
	})

	return { form, isPending }
}
