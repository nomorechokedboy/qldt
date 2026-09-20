import type { ColumnDef } from '@tanstack/react-table'
import type { TFunction } from 'i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDbTimestamp } from '@/lib/utils'
import type { rank_promotion_proposals } from '@/api/client'

export type RankPromotionProposalRow =
	rank_promotion_proposals.RankPromotionProposalResp

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

type GetColumnsOptions = {
	t: TFunction<'proposals'>
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
	t,
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
			header: t('common.createdAt'),
			cell: ({ row }) => (
				<span className='whitespace-nowrap text-sm'>
					{formatDbTimestamp(row.original.createdAt)}
				</span>
			)
		},
		{
			id: 'unit.name',
			accessorFn: (row) => row.unit?.name ?? '',
			header: t('common.unit'),
			cell: ({ row }) => row.original.unit?.name ?? '—'
		},
		{
			id: 'targetRank',
			accessorKey: 'targetRank',
			header: t('rank.targetRank'),
			cell: ({ row }) => row.original.targetRank
		},
		{
			id: 'troopers',
			accessorFn: (row) => row.troopers?.length ?? 0,
			header: t('common.trooperCount'),
			cell: ({ row }) => (
				<span className='text-sm'>
					{row.original.troopers?.length ?? 0}
				</span>
			)
		},
		{
			id: 'requestedBy.displayName',
			accessorFn: (row) => row.requestedBy?.displayName ?? '',
			header: t('common.requestedBy'),
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
							{t('common.view')}
						</Button>
						{isPending && canApprove && proposal.canDecide && (
							<Button
								variant='ghost'
								size='sm'
								disabled={isApproving}
								onClick={() => onApprove(proposal.id)}
							>
								{t('common.approve')}
							</Button>
						)}
						{isPending && canReject && proposal.canDecide && (
							<Button
								variant='ghost'
								size='sm'
								onClick={() => onReject(proposal.id)}
							>
								{t('common.reject')}
							</Button>
						)}
						{isPending && isRequester && (
							<Button
								variant='ghost'
								size='sm'
								disabled={isCancelling}
								onClick={() => onCancel(proposal.id)}
							>
								{t('common.cancel')}
							</Button>
						)}
					</div>
				)
			}
		}
	]
}
