import usePatchStudent from '@/hooks/usePatchStudent'
import type { Student } from '@/types'
import type { CellContext } from '@tanstack/react-table'
import ToggleInput from '@/components/toggle-input'
import { Badge } from '@/components/ui/badge'
import { soldierPositionOptions } from '@/data/ethnics'
import usePositionsData from '@/hooks/usePositionsData'

const LEVEL_LABELS: Record<string, string> = {
	battalion: 'Tiểu đoàn',
	company: 'Đại đội',
	platoon: 'Trung đội',
	squad: 'Tiểu đội',
	department: 'Phòng, ban'
}

export type EditablePositionProps = CellContext<Student, unknown> & {
	className?: string
}

export default function EditablePosition({
	className,
	column,
	row
}: EditablePositionProps) {
	const { handlePatchStudentData, isPending } = usePatchStudent(row, column)
	const { data: positions } = usePositionsData()

	const positionOptions = [
		...[...(positions ?? [])]
			.sort(
				(a, b) =>
					a.level.localeCompare(b.level) || a.priority - b.priority
			)
			.map((p) => ({
				label: p.name,
				value: p.code,
				group: LEVEL_LABELS[p.level] ?? p.level
			})),
		...soldierPositionOptions
	]

	return (
		<ToggleInput
			type='combobox'
			options={positionOptions}
			className={`font-medium min-w-32 ${className}`}
			onSave={handlePatchStudentData}
			initialValue={row.getValue(column.id)}
			isLoading={isPending}
			placeholder={
				<Badge className='bg-blue-500 font-bold'>
					{row.getValue(column.id)}
				</Badge>
			}
		/>
	)
}
