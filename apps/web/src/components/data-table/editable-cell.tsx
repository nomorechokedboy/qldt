import { useTranslation } from 'react-i18next'
import usePatchStudent from '@/hooks/usePatchStudent'
import type { Student } from '@/types'
import type { CellContext } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import ToggleInput from '@/components/toggle-input'

export type EditableCellProps = CellContext<Student, unknown> & {
	className?: string
	readOnly?: boolean
}

export default function EditableCell({
	className,
	readOnly,
	column,
	row
}: EditableCellProps) {
	const { t } = useTranslation('table')
	const { handlePatchStudentData, isPending } = usePatchStudent(row, column)
	return (
		<ToggleInput
			readOnly={readOnly}
			type='text'
			className={`font-medium min-w-32 ${className}`}
			onSave={handlePatchStudentData}
			initialValue={row.getValue(column.id)}
			isLoading={isPending}
			placeholder={
				<Badge variant='secondary' className='font-bold'>
					{t('cells.empty')}
				</Badge>
			}
		/>
	)
}
