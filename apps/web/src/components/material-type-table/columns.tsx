import type { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { materialCategoryLabels } from '@/data/material-categories'
import { MaterialTypeRowActions } from './material-type-row-actions'
import type { MaterialType } from '@/types'

export function buildMaterialTypeColumns(
	onChanged?: () => void
): ColumnDef<MaterialType>[] {
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
			accessorKey: 'name',
			header: 'Tên vật tư'
		},
		{
			accessorKey: 'category',
			header: 'Phân loại',
			cell: ({ row }) => {
				const category = row.getValue(
					'category'
				) as MaterialType['category']
				return (
					<Badge variant='secondary'>
						{materialCategoryLabels[category]}
					</Badge>
				)
			},
			filterFn: (row, id, value) => value.includes(row.getValue(id))
		},
		{
			accessorKey: 'unitOfMeasure',
			header: 'Đơn vị tính',
			cell: ({ row }) => row.getValue('unitOfMeasure') ?? '—'
		},
		{
			accessorKey: 'isSerialized',
			header: 'Loại quản lý',
			cell: ({ row }) =>
				row.getValue('isSerialized') ? (
					<Badge>Theo số sê-ri</Badge>
				) : (
					<Badge variant='outline'>Theo số lượng</Badge>
				)
		},
		{
			id: 'actions',
			cell: ({ row }) => (
				<MaterialTypeRowActions
					data={row.original}
					onChanged={onChanged}
				/>
			)
		}
	]
}
