import type { ColumnDef } from '@tanstack/react-table'
import { materialConditionLabels } from '@/data/material-categories'
import { MaterialStockRowActions } from './material-stock-row-actions'
import type { MaterialStock, Room } from '@/types'

export function buildMaterialStockColumns(
	roomOptions: Room[],
	onChanged?: () => void
): ColumnDef<MaterialStock>[] {
	return [
		{
			id: 'materialType',
			header: 'Loại vật tư',
			accessorFn: (row) => row.materialType?.name ?? '',
			cell: ({ row }) => row.original.materialType?.name ?? '—'
		},
		{
			id: 'unit',
			header: 'Đơn vị',
			accessorFn: (row) => row.unit?.name ?? '',
			cell: ({ row }) => row.original.unit?.name ?? '—'
		},
		{
			id: 'room',
			header: 'Phòng',
			accessorFn: (row) => row.room?.name ?? 'Không thuộc phòng cụ thể',
			cell: ({ row }) =>
				row.original.room?.name ?? (
					<span className='text-muted-foreground'>
						Không thuộc phòng cụ thể
					</span>
				),
			filterFn: (row, id, value) => value.includes(row.getValue(id))
		},
		{
			accessorKey: 'quantity',
			header: 'Số lượng',
			cell: ({ row }) =>
				`${row.original.quantity} ${row.original.materialType?.unitOfMeasure}`
		},
		{
			accessorKey: 'condition',
			header: 'Tình trạng',
			cell: ({ row }) => {
				const condition = row.getValue('condition') as string | null
				if (condition === null || condition === undefined) {
					return '—'
				}
				return materialConditionLabels[condition] ?? condition
			},
			filterFn: (row, id, value) => value.includes(row.getValue(id))
		},
		{
			id: 'actions',
			cell: ({ row }) => (
				<MaterialStockRowActions
					data={row.original}
					roomOptions={roomOptions}
					onChanged={onChanged}
				/>
			)
		}
	]
}
