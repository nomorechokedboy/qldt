import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
	materialAssetStatusLabels,
	materialConditionLabels
} from '@/data/material-categories'
import { getMediaUri } from '@/lib/utils'
import type { MaterialAsset, Room, Student } from '@/types'
import type { ColumnDef } from '@tanstack/react-table'
import { MaterialAssetRowActions } from './material-asset-row-actions'

export function buildMaterialAssetColumns(
	roomOptions: Room[],
	studentOptions: Student[],
	onChanged?: () => void
): ColumnDef<MaterialAsset>[] {
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
			id: 'images',
			header: 'Hình ảnh',
			cell: ({ row }) => {
				const images = row.original.images
				if (!images || images.length === 0) return '—'
				return (
					<img
						src={getMediaUri(images[0])}
						alt=''
						className='size-10 rounded-md object-cover'
					/>
				)
			},
			enableSorting: false
		},
		{
			accessorKey: 'serialNumber',
			header: 'Số sê-ri'
		},
		{
			id: 'materialType',
			header: 'Loại khí tài',
			accessorFn: (row) => row.materialType?.name ?? '',
			cell: ({ row }) => row.original.materialType?.name ?? '—'
		},
		{
			id: 'room',
			header: 'Vị trí',
			accessorFn: (row) => row.room?.name ?? 'Chưa có vị trí cụ thể',
			cell: ({ row }) =>
				row.original.room?.name ?? (
					<span className='text-muted-foreground'>
						Chưa có vị trí cụ thể
					</span>
				),
			filterFn: (row, id, value) => value.includes(row.getValue(id))
		},
		{
			id: 'assignedTrooper',
			header: 'Cấp phát cho',
			accessorFn: (row) => row.assignedTrooper?.fullName ?? '',
			cell: ({ row }) =>
				row.original.assignedTrooper?.fullName ?? (
					<span className='text-muted-foreground'>Chưa cấp phát</span>
				)
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
			}
		},
		{
			accessorKey: 'status',
			header: 'Trạng thái',
			cell: ({ row }) => {
				const status = row.getValue('status') as string
				return (
					<Badge variant='secondary'>
						{materialAssetStatusLabels[status]}
					</Badge>
				)
			},
			filterFn: (row, id, value) => value.includes(row.getValue(id))
		},
		{
			id: 'actions',
			cell: ({ row }) => (
				<MaterialAssetRowActions
					data={row.original}
					roomOptions={roomOptions}
					studentOptions={studentOptions}
					onChanged={onChanged}
				/>
			)
		}
	]
}
