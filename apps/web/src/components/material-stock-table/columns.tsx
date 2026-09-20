import type { ColumnDef } from '@tanstack/react-table'
import { materialConditionLabels } from '@/data/material-categories'
import i18n from '@/i18n'
import { localizedHeader } from '@/lib/material-column-header'
import { MaterialStockRowActions } from './material-stock-row-actions'
import type { MaterialStock, Room } from '@/types'

export function buildMaterialStockColumns(
	roomOptions: Room[],
	onChanged?: () => void
): ColumnDef<MaterialStock>[] {
	return [
		{
			id: 'materialType',
			...localizedHeader('columns.stockType'),
			accessorFn: (row) => row.materialType?.name ?? '',
			cell: ({ row }) => row.original.materialType?.name ?? '—',
			filterFn: (row, id, value) => value.includes(row.getValue(id))
		},
		{
			id: 'unit',
			...localizedHeader('columns.unit'),
			accessorFn: (row) => row.unit?.name ?? '',
			cell: ({ row }) => row.original.unit?.name ?? '—',
			filterFn: (row, id, value) => value.includes(row.getValue(id))
		},
		{
			id: 'room',
			...localizedHeader('columns.room'),
			accessorFn: (row) =>
				row.room?.name ?? i18n.t('materials:shared.noSpecificRoom'),
			cell: ({ row }) =>
				row.original.room?.name ?? (
					<span className='text-muted-foreground'>
						{i18n.t('materials:shared.noSpecificRoom')}
					</span>
				),
			filterFn: (row, id, value) => value.includes(row.getValue(id))
		},
		{
			accessorKey: 'quantity',
			...localizedHeader('columns.quantity'),
			cell: ({ row }) =>
				`${row.original.quantity} ${row.original.materialType?.unitOfMeasure}`
		},
		{
			accessorKey: 'condition',
			...localizedHeader('columns.condition'),
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
