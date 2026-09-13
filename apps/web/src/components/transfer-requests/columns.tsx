import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDbTimestamp } from '@/lib/utils'
import type { transfer_requests } from '@/api/client'

export type TransferRequestRow = transfer_requests.TransferRequestResp

export const STATUS_LABELS: Record<string, string> = {
	pending: 'Chờ duyệt',
	approved: 'Đã duyệt',
	rejected: 'Đã từ chối',
	cancelled: 'Đã hủy'
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

function resourceSummary(row: TransferRequestRow) {
	const parts: string[] = []
	if (row.troopers?.length) parts.push(`${row.troopers.length} quân nhân`)
	if (row.materialAssetItems?.length)
		parts.push(`${row.materialAssetItems.length} khí tài`)
	if (row.materialStockItems?.length)
		parts.push(`${row.materialStockItems.length} vật tư`)
	return parts.length > 0 ? parts.join(', ') : '—'
}

type GetColumnsOptions = {
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
			header: 'Thời gian',
			cell: ({ row }) => (
				<span className='whitespace-nowrap text-sm'>
					{formatDbTimestamp(row.original.createdAt)}
				</span>
			)
		},
		{
			id: 'sourceUnit.name',
			accessorFn: (row) => row.sourceUnit?.name ?? '',
			header: 'Nguồn',
			cell: ({ row }) => row.original.sourceUnit?.name ?? '—'
		},
		{
			id: 'destinationUnit.name',
			accessorFn: (row) => row.destinationUnit?.name ?? '',
			header: 'Đích',
			cell: ({ row }) => row.original.destinationUnit?.name ?? '—'
		},
		{
			id: 'resourceSummary',
			header: 'Nguồn lực',
			cell: ({ row }) => (
				<span className='text-sm'>{resourceSummary(row.original)}</span>
			)
		},
		{
			id: 'requestedBy.displayName',
			accessorFn: (row) => row.requestedBy?.displayName ?? '',
			header: 'Người yêu cầu',
			cell: ({ row }) => row.original.requestedBy?.displayName ?? '—'
		},
		{
			id: 'approver.displayName',
			accessorFn: (row) => row.approver?.displayName ?? '',
			header: 'Người phê duyệt',
			cell: ({ row }) => row.original.approver?.displayName ?? '—'
		},
		{
			id: 'status',
			accessorKey: 'status',
			header: 'Trạng thái',
			cell: ({ row }) => (
				<Badge
					variant={
						STATUS_BADGE_VARIANT[row.original.status] ?? 'secondary'
					}
				>
					{STATUS_LABELS[row.original.status] ?? row.original.status}
				</Badge>
			)
		},
		{
			id: 'actions',
			header: () => <div className='text-right'>Thao tác</div>,
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
							Xem
						</Button>
						{isPending && canApprove && request.canDecide && (
							<Button
								variant='ghost'
								size='sm'
								disabled={isApproving}
								onClick={() => onApprove(request.id)}
							>
								Duyệt
							</Button>
						)}
						{isPending && canReject && request.canDecide && (
							<Button
								variant='ghost'
								size='sm'
								onClick={() => onReject(request.id)}
							>
								Từ chối
							</Button>
						)}
						{isPending && isRequester && (
							<Button
								variant='ghost'
								size='sm'
								disabled={isCancelling}
								onClick={() => onCancel(request.id)}
							>
								Hủy
							</Button>
						)}
						{request.status === 'approved' && hasMaterialItems && (
							<Button
								variant='ghost'
								size='sm'
								disabled={isExportingHandover}
								onClick={() => onExportHandover(request.id)}
							>
								Xuất biên bản
							</Button>
						)}
					</div>
				)
			}
		}
	]
}
