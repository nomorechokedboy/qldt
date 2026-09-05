import type { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { PositionRowActions } from './position-row-actions'
import type { Position } from '@/types'

export function buildPositionColumns(
	onChanged?: () => void
): ColumnDef<Position>[] {
	return [
		{
			id: 'select',
			header: ({ table }) => (
				<Checkbox
					checked={
						table.getIsAllPageRowsSelected() ||
						(table.getIsSomePageRowsSelected() && 'indeterminate')
					}
					onCheckedChange={(value) =>
						table.toggleAllPageRowsSelected(!!value)
					}
					aria-label='Select all'
					className='translate-y-[2px]'
				/>
			),
			cell: ({ row }) => (
				<Checkbox
					checked={row.getIsSelected()}
					onCheckedChange={(value) => row.toggleSelected(!!value)}
					aria-label='Select row'
					className='translate-y-[2px]'
				/>
			),
			enableSorting: false,
			enableHiding: false
		},
		{
			accessorKey: 'priority',
			header: 'Ưu tiên',
			cell: ({ row }) => (
				<Badge variant='secondary'>{row.getValue('priority')}</Badge>
			)
		},
		{
			accessorKey: 'code',
			header: 'Mã chức vụ'
		},
		{
			accessorKey: 'name',
			header: 'Tên chức vụ'
		},
		{
			accessorKey: 'group',
			header: 'Nhóm',
			cell: ({ row }) => row.getValue('group') ?? '—'
		},
		{
			id: 'actions',
			cell: ({ row }) => (
				<PositionRowActions data={row.original} onChanged={onChanged} />
			)
		}
	]
}
