import type { Student } from '@/types'
import { toast } from 'sonner'
import i18n from '@/i18n'
import useUpdateStudent from './useUpdateStudent'
import { queryClient } from '@/integrations/tanstack-query/root-provider'

export default function usePatchStudentInfo(_student: Student) {
	const handleSuccess = () => {
		queryClient.invalidateQueries({ queryKey: ['students'] })
		queryClient.invalidateQueries({ queryKey: ['unitTroopers'] })
	}
	const { mutateAsync, isPending } = useUpdateStudent({
		onSuccess: handleSuccess
	})
	const handlePatchStudentInfo = async (_student: Student) => {
		try {
			await mutateAsync({
				data: [_student]
			})
			toast.success(i18n.t('table:cells.updateSuccess'))
		} catch (err) {
			console.error(err)
			toast.error(i18n.t('table:cells.updateFailed'))
		}
	}

	return { handlePatchStudentInfo, isPending }
}
