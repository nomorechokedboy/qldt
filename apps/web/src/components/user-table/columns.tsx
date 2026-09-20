import type { ColumnDef } from '@tanstack/react-table'
import type { User } from '@/types'
import { Badge } from '@/components/ui/badge'
import { formatDbTimestamp } from '@/lib/utils'
import { DataTableColumnHeader } from '../data-table/data-table-column-header'
import { DataTableRowActions } from './data-user-table-row-actions'
import UserLockIndicator from './user-lock-indicator'
import { Shield, Award, Briefcase } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import i18n from '@/i18n'

// Helper function to format a DB timestamp to DD/MM/YYYY, converted from the
// stored UTC value to Vietnam time (see formatDbTimestamp in lib/utils.ts).
function formatDate(isoDate: string): string {
	if (!isoDate) return 'N/A'
	return formatDbTimestamp(isoDate, 'DD/MM/YYYY')
}

// Helper component for empty data cells
const EmptyCell = () => {
	const { t } = useTranslation('admin')
	return <Badge variant='secondary'>{t('common.notProvided')}</Badge>
}

export const baseUsersColumns: ColumnDef<User>[] = [
	{
		id: 'displayName',
		accessorFn: (row) => row.displayName,
		header: ({ column }) => (
			<DataTableColumnHeader
				column={column}
				title={i18n.t('admin:users.columns.displayName')}
			/>
		),
		cell: ({ row }) => (
			<div className='flex items-center gap-2 min-w-40'>
				<span className='font-medium'>{row.original.displayName}</span>
				{row.original.isSuperUser && (
					<Badge variant='default'>
						<Shield className='w-3 h-3' />
					</Badge>
				)}
			</div>
		),
		meta: {
			get label() {
				return i18n.t('admin:users.columns.displayName')
			}
		}
	},
	{
		id: 'username',
		accessorFn: (row) => row.username,
		header: ({ column }) => (
			<DataTableColumnHeader
				column={column}
				title={i18n.t('admin:users.columns.username')}
			/>
		),
		cell: ({ row }) => (
			<div className='min-w-32 flex items-center gap-2'>
				{row.original.username || <EmptyCell />}
			</div>
		),
		meta: {
			get label() {
				return i18n.t('admin:users.columns.username')
			}
		}
	},
	{
		id: 'unit.name',
		accessorFn: (row) => row.unit?.name || null,
		header: ({ column }) => (
			<DataTableColumnHeader
				column={column}
				title={i18n.t('admin:users.columns.unit')}
			/>
		),
		cell: ({ row }) => (
			<div className='min-w-36'>
				{row.original.unit?.name || <EmptyCell />}
			</div>
		),
		meta: {
			get label() {
				return i18n.t('admin:users.columns.unit')
			}
		}
	},
	{
		id: 'rank',
		accessorFn: (row) => row.rank || null,
		header: ({ column }) => (
			<DataTableColumnHeader
				column={column}
				title={i18n.t('admin:users.columns.rank')}
			/>
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
			get label() {
				return i18n.t('admin:users.columns.rank')
			}
		}
	},
	{
		id: 'position',
		accessorFn: (row) => row.position || null,
		header: ({ column }) => (
			<DataTableColumnHeader
				column={column}
				title={i18n.t('admin:users.columns.position')}
			/>
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
			get label() {
				return i18n.t('admin:users.columns.position')
			}
		}
	},
	{
		id: 'createdAt',
		accessorKey: 'createdAt',
		header: ({ column }) => (
			<DataTableColumnHeader
				column={column}
				title={i18n.t('admin:users.columns.createdAt')}
			/>
		),
		cell: ({ row }) => (
			<div className='min-w-28 text-muted-foreground'>
				{row.original.createdAt ? (
					formatDate(row.original.createdAt)
				) : (
					<EmptyCell />
				)}
			</div>
		),
		meta: {
			get label() {
				return i18n.t('admin:users.columns.createdAt')
			}
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
			<DataTableColumnHeader
				column={column}
				title={i18n.t('admin:users.columns.displayName')}
			/>
		),
		cell: ({ row }) => (
			<div className='flex items-center gap-2'>
				<span className='font-medium'>{row.original.displayName}</span>
				{row.original.isSuperUser && (
					<Badge variant='default'>
						<Shield className='w-3 h-3' />
					</Badge>
				)}
			</div>
		),
		meta: {
			get label() {
				return i18n.t('admin:users.columns.displayName')
			}
		}
	},
	{
		id: 'username',
		accessorFn: (row) => row.username,
		header: ({ column }) => (
			<DataTableColumnHeader
				column={column}
				title={i18n.t('admin:users.columns.username')}
			/>
		),
		meta: {
			get label() {
				return i18n.t('admin:users.columns.username')
			}
		}
	},
	{
		id: 'unit.name',
		accessorFn: (row) => row.unit?.name || null,
		header: ({ column }) => (
			<DataTableColumnHeader
				column={column}
				title={i18n.t('admin:users.columns.unit')}
			/>
		),
		meta: {
			get label() {
				return i18n.t('admin:users.columns.unit')
			}
		}
	},
	{
		id: 'rank',
		accessorFn: (row) => row.rank || null,
		header: ({ column }) => (
			<DataTableColumnHeader
				column={column}
				title={i18n.t('admin:users.columns.rank')}
			/>
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
			get label() {
				return i18n.t('admin:users.columns.rank')
			}
		}
	},
	{
		id: 'position',
		accessorFn: (row) => row.position || null,
		header: ({ column }) => (
			<DataTableColumnHeader
				column={column}
				title={i18n.t('admin:users.columns.position')}
			/>
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
			get label() {
				return i18n.t('admin:users.columns.position')
			}
		}
	},
	{
		id: 'createdAt',
		accessorKey: 'createdAt',
		header: ({ column }) => (
			<DataTableColumnHeader
				column={column}
				title={i18n.t('admin:users.columns.createdAt')}
			/>
		),
		cell: ({ row }) => (
			<div className='text-muted-foreground'>
				{row.original.createdAt
					? formatDate(row.original.createdAt)
					: '-'}
			</div>
		),
		meta: {
			get label() {
				return i18n.t('admin:users.columns.createdAt')
			}
		}
	},
	{
		id: 'actions',
		header: () => i18n.t('admin:users.columns.actions'),
		cell: ({ row }) => (
			<button
				onClick={() => console.log('Edit:', row.original.id)}
				className='px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors'
			>
				{i18n.t('admin:common.edit')}
			</button>
		),
		meta: {
			get label() {
				return i18n.t('admin:users.columns.actions')
			}
		}
	}
]
