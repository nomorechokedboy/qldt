import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDbTimestamp } from '@/lib/utils'
import type { rank_promotion_proposals } from '@/api/client'

export type RankPromotionProposalRow =
	rank_promotion_proposals.RankPromotionProposalResp

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

type GetColumnsOptions = {
	currentUserId?: number
	canApprove: boolean
	canReject: boolean
	isApproving: boolean
	isCancelling: boolean
	onView: (row: RankPromotionProposalRow) => void
	onApprove: (id: number) => void
	onReject: (id: number) => void
	onCancel: (id: number) => void
}

export function getRankPromotionProposalColumns({
	currentUserId,
	canApprove,
	canReject,
	isApproving,
	isCancelling,
	onView,
	onApprove,
	onReject,
	onCancel
}: GetColumnsOptions): ColumnDef<RankPromotionProposalRow>[] {
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
			id: 'unit.name',
			accessorFn: (row) => row.unit?.name ?? '',
			header: 'Đơn vị',
			cell: ({ row }) => row.original.unit?.name ?? '—'
		},
		{
			id: 'targetRank',
			accessorKey: 'targetRank',
			header: 'Quân hàm đề xuất',
			cell: ({ row }) => row.original.targetRank
		},
		{
			id: 'troopers',
			accessorFn: (row) => row.troopers?.length ?? 0,
			header: 'Số quân nhân',
			cell: ({ row }) => (
				<span className='text-sm'>
					{row.original.troopers?.length ?? 0}
				</span>
			)
		},
		{
			id: 'requestedBy.displayName',
			accessorFn: (row) => row.requestedBy?.displayName ?? '',
			header: 'Người đề xuất',
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
				const proposal = row.original
				const isRequester = currentUserId === proposal.requestedBy?.id
				const isPending = proposal.status === 'pending'

				return (
					<div className='flex justify-end gap-1'>
						<Button
							variant='ghost'
							size='sm'
							onClick={() => onView(proposal)}
						>
							Xem
						</Button>
						{isPending && canApprove && proposal.canDecide && (
							<Button
								variant='ghost'
								size='sm'
								disabled={isApproving}
								onClick={() => onApprove(proposal.id)}
							>
								Duyệt
							</Button>
						)}
						{isPending && canReject && proposal.canDecide && (
							<Button
								variant='ghost'
								size='sm'
								onClick={() => onReject(proposal.id)}
							>
								Từ chối
							</Button>
						)}
						{isPending && isRequester && (
							<Button
								variant='ghost'
								size='sm'
								disabled={isCancelling}
								onClick={() => onCancel(proposal.id)}
							>
								Hủy
							</Button>
						)}
					</div>
				)
			}
		}
	]
}
