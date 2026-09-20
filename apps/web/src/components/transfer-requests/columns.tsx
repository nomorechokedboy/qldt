import type { ColumnDef } from '@tanstack/react-table'
import type { TFunction } from 'i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDbTimestamp } from '@/lib/utils'
import type { transfer_requests } from '@/api/client'

export type TransferRequestRow = transfer_requests.TransferRequestResp

export const STATUS_VALUES = [
	'pending',
	'approved',
	'rejected',
	'cancelled'
] as const

export type ProposalStatus = (typeof STATUS_VALUES)[number]

export function statusLabel(t: TFunction<'proposals'>, status: string): string {
	return (STATUS_VALUES as readonly string[]).includes(status)
		? t(`status.${status as ProposalStatus}`)
		: status
}

export const STATUS_BADGE_VARIANT: Record<
	string,
	'default' | 'secondary' | 'destructive' | 'outline'
> = {
	pending: 'outline',
	approved: 'default',
	rejected: 'destructive',
	cancelled: 'secondary'
}

function resourceSummary(t: TFunction<'proposals'>, row: TransferRequestRow) {
	const parts: string[] = []
	if (row.troopers?.length)
		parts.push(t('transfer.trooperSummary', { count: row.troopers.length }))
	if (row.materialAssetItems?.length)
		parts.push(
			t('transfer.assetSummary', { count: row.materialAssetItems.length })
		)
	if (row.materialStockItems?.length)
		parts.push(
			t('transfer.stockSummary', { count: row.materialStockItems.length })
		)
	return parts.length > 0 ? parts.join(', ') : '—'
}

type GetColumnsOptions = {
	t: TFunction<'proposals'>
	currentUserId?: number
	canApprove: boolean
	canReject: boolean
	isApproving: boolean
	isCancelling: boolean
	isExportingHandover: boolean
	onView: (row: TransferRequestRow) => void
	onApprove: (id: number) => void
	onReject: (id: number) => void
	onCancel: (id: number) => void
	onExportHandover: (id: number) => void
}

export function getTransferRequestColumns({
	t,
	currentUserId,
	canApprove,
	canReject,
	isApproving,
	isCancelling,
	isExportingHandover,
	onView,
	onApprove,
	onReject,
	onCancel,
	onExportHandover
}: GetColumnsOptions): ColumnDef<TransferRequestRow>[] {
	return [
		{
			id: 'createdAt',
			accessorKey: 'createdAt',
			header: t('common.createdAt'),
			cell: ({ row }) => (
				<span className='whitespace-nowrap text-sm'>
					{formatDbTimestamp(row.original.createdAt)}
				</span>
			)
		},
		{
			id: 'sourceUnit.name',
			accessorFn: (row) => row.sourceUnit?.name ?? '',
			header: t('transfer.source'),
			cell: ({ row }) => row.original.sourceUnit?.name ?? '—'
		},
		{
			id: 'destinationUnit.name',
			accessorFn: (row) => row.destinationUnit?.name ?? '',
			header: t('transfer.destination'),
			cell: ({ row }) => row.original.destinationUnit?.name ?? '—'
		},
		{
			id: 'resourceSummary',
			header: t('transfer.resources'),
			cell: ({ row }) => (
				<span className='text-sm'>
					{resourceSummary(t, row.original)}
				</span>
			)
		},
		{
			id: 'requestedBy.displayName',
			accessorFn: (row) => row.requestedBy?.displayName ?? '',
			header: t('transfer.requestedBy'),
			cell: ({ row }) => row.original.requestedBy?.displayName ?? '—'
		},
		{
			id: 'approver.displayName',
			accessorFn: (row) => row.approver?.displayName ?? '',
			header: t('common.approver'),
			cell: ({ row }) => row.original.approver?.displayName ?? '—'
		},
		{
			id: 'status',
			accessorKey: 'status',
			header: t('status.label'),
			cell: ({ row }) => (
				<Badge
					variant={
						STATUS_BADGE_VARIANT[row.original.status] ?? 'secondary'
					}
				>
					{statusLabel(t, row.original.status)}
				</Badge>
			)
		},
		{
			id: 'actions',
			header: () => (
				<div className='text-right'>{t('common.actions')}</div>
			),
			enableSorting: false,
			enableHiding: false,
			cell: ({ row }) => {
				const request = row.original
				const isRequester = currentUserId === request.requestedBy?.id
				const isPending = request.status === 'pending'
				const hasMaterialItems =
					!!request.materialAssetItems?.length ||
					!!request.materialStockItems?.length

				return (
					<div className='flex justify-end gap-1'>
						<Button
							variant='ghost'
							size='sm'
							onClick={() => onView(request)}
						>
							{t('common.view')}
						</Button>
						{isPending && canApprove && request.canDecide && (
							<Button
								variant='ghost'
								size='sm'
								disabled={isApproving}
								onClick={() => onApprove(request.id)}
							>
								{t('common.approve')}
							</Button>
						)}
						{isPending && canReject && request.canDecide && (
							<Button
								variant='ghost'
								size='sm'
								onClick={() => onReject(request.id)}
							>
								{t('common.reject')}
							</Button>
						)}
						{isPending && isRequester && (
							<Button
								variant='ghost'
								size='sm'
								disabled={isCancelling}
								onClick={() => onCancel(request.id)}
							>
								{t('common.cancel')}
							</Button>
						)}
						{request.status === 'approved' && hasMaterialItems && (
							<Button
								variant='ghost'
								size='sm'
								disabled={isExportingHandover}
								onClick={() => onExportHandover(request.id)}
							>
								{t('transfer.exportHandover')}
							</Button>
						)}
					</div>
				)
			}
		}
	]
}
