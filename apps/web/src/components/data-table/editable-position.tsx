import useUpdateStudent from '@/hooks/useUpdateStudent'
import type { Student } from '@/types'
import type { CellContext } from '@tanstack/react-table'
import ToggleInput from '@/components/toggle-input'
import { Badge } from '@/components/ui/badge'
import usePositionsData from '@/hooks/usePositionsData'
import { queryClient } from '@/integrations/tanstack-query/root-provider'
import { toast } from 'sonner'
import { unitLevelLabels, unitLevelOrder } from '@/data/unit-levels'

export type EditablePositionProps = CellContext<Student, unknown> & {
	className?: string
}

export default function EditablePosition({
	className,
	row
}: EditablePositionProps) {
	const { data: positions } = usePositionsData()
	const { mutateAsync, isPending } = useUpdateStudent({
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['students'] })
		}
	})

	const positionOptions = [...(positions ?? [])]
		.sort((a, b) => {
			const levelDiff =
				unitLevelOrder.indexOf(a.level as never) -
				unitLevelOrder.indexOf(b.level as never)
			if (levelDiff !== 0) return levelDiff

			const groupDiff = (a.group ?? '').localeCompare(b.group ?? '')
			if (groupDiff !== 0) return groupDiff

			return a.priority - b.priority
		})
		.map((p) => ({
			label: p.name,
			value: String(p.id),
			group: p.group ?? unitLevelLabels[p.level as never] ?? p.level
		}))

	const handleSave = async (value: string) => {
		try {
			await mutateAsync({
				data: [{ id: row.original.id, positionId: Number(value) }]
			})
			toast.success('Cập nhật thông tin quân nhân thành công')
		} catch (err) {
			console.error(err)
			toast.error('Cập nhật thông tin quân nhân thất bại!')
		}
	}

	return (
		<ToggleInput
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
				<Badge className='bg-blue-500 font-bold'>
					{row.original.position}
				</Badge>
			}
		/>
	)
}
