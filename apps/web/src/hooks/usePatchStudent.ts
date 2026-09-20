import type { Student } from '@/types'
import type { Column, Row } from '@tanstack/react-table'
import { toast } from 'sonner'
import i18n from '@/i18n'
import useUpdateStudent from './useUpdateStudent'
import { queryClient } from '@/integrations/tanstack-query/root-provider'

export default function usePatchStudent(
	row: Row<Student>,
	column: Column<Student>
) {
	const handleSuccess = () => {
		queryClient.invalidateQueries({ queryKey: ['students'] })
	}
	const { mutateAsync, isPending } = useUpdateStudent({
		onSuccess: handleSuccess
	})
	const handlePatchStudentData = async (value: string) => {
		try {
			await mutateAsync({
				data: [
					{
						id: row.original.id,
						[column.id]: value
					}
				]
			})
			toast.success(i18n.t('table:cells.updateSuccess'))
		} catch (err) {
			console.error(err)
			toast.error(i18n.t('table:cells.updateFailed'))
		}
	}

	return { handlePatchStudentData, isPending }
}
