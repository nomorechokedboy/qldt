import type { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { PositionRowActions } from './position-row-actions'
import type { Position } from '@/types'
import i18n from '@/i18n'

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
			header: () => i18n.t('admin:positions.columns.priority'),
			cell: ({ row }) => (
				<Badge variant='secondary'>{row.getValue('priority')}</Badge>
			)
		},
		{
			accessorKey: 'code',
			header: () => i18n.t('admin:positions.columns.code')
		},
		{
			accessorKey: 'name',
			header: () => i18n.t('admin:positions.columns.name')
		},
		{
			id: 'actions',
			cell: ({ row }) => (
				<PositionRowActions data={row.original} onChanged={onChanged} />
			)
		}
	]
}
