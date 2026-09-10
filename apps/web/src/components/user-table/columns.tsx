import type { ColumnDef } from '@tanstack/react-table'
import type { User } from '@/types'
import { Badge } from '@/components/ui/badge'
import { formatDbTimestamp } from '@/lib/utils'
import { DataTableColumnHeader } from '../data-table/data-table-column-header'
import { DataTableRowActions } from './data-user-table-row-actions'
import UserLockIndicator from './user-lock-indicator'
import { Shield, Award, Briefcase } from 'lucide-react'

// Helper function to format a DB timestamp to DD/MM/YYYY, converted from the
// stored UTC value to Vietnam time (see formatDbTimestamp in lib/utils.ts).
function formatDate(isoDate: string): string {
	if (!isoDate) return 'N/A'
	return formatDbTimestamp(isoDate, 'DD/MM/YYYY')
}

// Helper component for empty data cells
const EmptyCell = () => (
	<Badge variant='secondary' className='bg-gray-200 text-gray-600'>
		Chưa có thông tin
	</Badge>
)

export const baseUsersColumns: ColumnDef<User>[] = [
	{
		id: 'displayName',
		accessorFn: (row) => row.displayName,
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title='Họ và tên' />
		),
		cell: ({ row }) => (
			<div className='flex items-center gap-2 min-w-40'>
				<span className='font-medium'>{row.original.displayName}</span>
				{row.original.isSuperUser && (
					<Badge variant='default' className='bg-blue-600'>
						<Shield className='w-3 h-3' />
					</Badge>
				)}
			</div>
		),
		meta: {
			label: 'Họ và tên'
		}
	},
	{
		id: 'username',
		accessorFn: (row) => row.username,
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title='Tên tài khoản' />
		),
		cell: ({ row }) => (
			<div className='min-w-32 flex items-center gap-2'>
				{row.original.username || <EmptyCell />}
			</div>
		),
		meta: {
			label: 'Tên tài khoản'
		}
	},
	{
		id: 'unit.name',
		accessorFn: (row) => row.unit?.name || null,
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title='Đơn vị' />
		),
		cell: ({ row }) => (
			<div className='min-w-36'>
				{row.original.unit?.name || <EmptyCell />}
			</div>
		),
		meta: {
			label: 'Đơn vị'
		}
	},
	{
		id: 'rank',
		accessorFn: (row) => row.rank || null,
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title='Cấp bậc' />
		),
		cell: ({ row }) => (
			<div className='min-w-28'>
				{row.original.rank ? (
					<div className='flex items-center gap-2'>
						<Award className='w-4 h-4 text-amber-600' />
						<span>{row.original.rank}</span>
					</div>
				) : (
					<EmptyCell />
				)}
			</div>
		),
		meta: {
			label: 'Cấp bậc'
		}
	},
	{
		id: 'position',
		accessorFn: (row) => row.position || null,
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title='Chức vụ' />
		),
		cell: ({ row }) => (
			<div className='min-w-36'>
				{row.original.position ? (
					<div className='flex items-center gap-2'>
						<Briefcase className='w-4 h-4 text-blue-600' />
						<span>{row.original.position}</span>
					</div>
				) : (
					<EmptyCell />
				)}
			</div>
		),
		meta: {
			label: 'Chức vụ'
		}
	},
	{
		id: 'createdAt',
		accessorKey: 'createdAt',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title='Ngày tạo' />
		),
		cell: ({ row }) => (
			<div className='min-w-28 text-gray-600'>
				{row.original.createdAt ? (
					formatDate(row.original.createdAt)
				) : (
					<EmptyCell />
				)}
			</div>
		),
		meta: {
			label: 'Ngày tạo'
		}
	},
	{
		id: 'actions',
		cell: ({ row }) => (
			<div className='flex items-center gap-4'>
				<DataTableRowActions row={row} />
				{row.original.username && (
					<UserLockIndicator username={row.original.username} />
				)}
			</div>
		)
	}
]

// Alternative column set without actions (for battalion view)
export const battalionStudentColumnsWithoutAction: ColumnDef<User>[] = [
	{
		id: 'displayName',
		accessorFn: (row) => row.displayName,
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title='Họ và tên' />
		),
		cell: ({ row }) => (
			<div className='flex items-center gap-2'>
				<span className='font-medium'>{row.original.displayName}</span>
				{row.original.isSuperUser && (
					<Badge variant='default' className='bg-blue-600'>
						<Shield className='w-3 h-3' />
					</Badge>
				)}
			</div>
		),
		meta: {
			label: 'Họ và tên'
		}
	},
	{
		id: 'username',
		accessorFn: (row) => row.username,
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title='Tên tài khoản' />
		),
		meta: {
			label: 'Tên tài khoản'
		}
	},
	{
		id: 'unit.name',
		accessorFn: (row) => row.unit?.name || null,
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title='Đơn vị' />
		),
		meta: {
			label: 'Đơn vị'
		}
	},
	{
		id: 'rank',
		accessorFn: (row) => row.rank || null,
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title='Cấp bậc' />
		),
		cell: ({ row }) => (
			<div className='flex items-center gap-2'>
				{row.original.rank && (
					<Award className='w-4 h-4 text-amber-600' />
				)}
				<span>{row.original.rank || '-'}</span>
			</div>
		),
		meta: {
			label: 'Cấp bậc'
		}
	},
	{
		id: 'position',
		accessorFn: (row) => row.position || null,
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title='Chức vụ' />
		),
		cell: ({ row }) => (
			<div className='flex items-center gap-2'>
				{row.original.position && (
					<Briefcase className='w-4 h-4 text-blue-600' />
				)}
				<span>{row.original.position || '-'}</span>
			</div>
		),
		meta: {
			label: 'Chức vụ'
		}
	},
	{
		id: 'createdAt',
		accessorKey: 'createdAt',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title='Ngày tạo' />
		),
		cell: ({ row }) => (
			<div className='text-gray-600'>
				{row.original.createdAt
					? formatDate(row.original.createdAt)
					: '-'}
			</div>
		),
		meta: {
			label: 'Ngày tạo'
		}
	},
	{
		id: 'actions',
		header: 'Thao tác',
		cell: ({ row }) => (
			<button
				onClick={() => console.log('Edit:', row.original.id)}
				className='px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors'
			>
				Sửa
			</button>
		),
		meta: {
			label: 'Thao tác'
		}
	}
]
