import { useTranslation } from 'react-i18next'
import useUpdateStudent from '@/hooks/useUpdateStudent'
import type { Student } from '@/types'
import type { CellContext } from '@tanstack/react-table'
import ToggleInput from '@/components/toggle-input'
import { Badge } from '@/components/ui/badge'
import usePositionOptions from '@/hooks/usePositionOptions'
import { queryClient } from '@/integrations/tanstack-query/root-provider'
import { positionName } from '@/lib/position-name'
import { toast } from 'sonner'
import { toastApiError } from '@/lib/api-error'

export type EditablePositionProps = CellContext<Student, unknown> & {
	className?: string
	readOnly?: boolean
}

export default function EditablePosition({
	className,
	readOnly,
	row
}: EditablePositionProps) {
	const { t } = useTranslation('table')
	const { mutateAsync, isPending } = useUpdateStudent({
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['students'] })
		}
	})

	const positionOptions = usePositionOptions()

	const handleSave = async (value: string) => {
		try {
			await mutateAsync({
				data: [{ id: row.original.id, positionId: Number(value) }]
			})
			toast.success(t('cells.updateSuccess'))
		} catch (err) {
			console.error(err)
			toastApiError(t('cells.updateFailed'), err)
		}
	}

	return (
		<ToggleInput
			readOnly={readOnly}
			type='combobox'
			options={positionOptions}
			className={`font-medium min-w-32 ${className}`}
			onSave={handleSave}
			initialValue={
				row.original.positionId !== undefined &&
				row.original.positionId !== null
					? String(row.original.positionId)
					: undefined
			}
			isLoading={isPending}
			placeholder={
				<Badge className='font-bold'>
					{positionName(row.original)}
				</Badge>
			}
		/>
	)
}
