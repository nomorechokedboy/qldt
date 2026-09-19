import { toast } from 'sonner'
import { useAppForm } from '@/hooks/use-app-form'
import usePatchStudentInfo from '@/hooks/usePatchStudentInfo'
import useUploadFiles from '@/hooks/useUploadFiles'
import { getErrorMessage } from '@/lib/utils'
import type { Student } from '@/types'
import {
	DATE_FORMAT_ERROR,
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
						invalid.map((name) => [name, DATE_FORMAT_ERROR])
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
				toast.error(
					getErrorMessage(
						err,
						'Chỉnh sửa thông tin quân nhân không thành công!'
					)
				)
			}
		}
	})

	return { form, isPending }
}
