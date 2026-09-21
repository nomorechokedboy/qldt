import type { ColumnDef } from '@tanstack/react-table'
import type { TFunction } from 'i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDbTimestamp } from '@/lib/utils'
import type { ExtraRowAction, ProposalRow } from './proposal-adapter'
import { STATUS_BADGE_VARIANT, statusLabel } from './status'

type GetColumnsOptions<TRow extends ProposalRow> = {
	t: TFunction<'proposals'>
	// What differs between kinds; sits between the creation date and the
	// requester.
	middleColumns: ColumnDef<TRow>[]
	requestedByLabel: string
	extraAction?: ExtraRowAction<TRow> | null
	currentUserId?: number
	canApprove: boolean
	canReject: boolean
	isApproving: boolean
	isCancelling: boolean
	onView: (row: TRow) => void
	onApprove: (id: number) => void
	onReject: (id: number) => void
	onCancel: (id: number) => void
}

export function getProposalColumns<TRow extends ProposalRow>({
	t,
	middleColumns,
	requestedByLabel,
	extraAction,
	currentUserId,
	canApprove,
	canReject,
	isApproving,
	isCancelling,
	onView,
	onApprove,
	onReject,
	onCancel
}: GetColumnsOptions<TRow>): ColumnDef<TRow>[] {
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
		...middleColumns,
		{
			id: 'requestedBy.displayName',
			accessorFn: (row) => row.requestedBy?.displayName ?? '',
			header: requestedByLabel,
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
						{extraAction?.isVisible(proposal) && (
							<Button
								variant='ghost'
								size='sm'
								disabled={extraAction.isPending}
								onClick={() => extraAction.run(proposal.id)}
							>
								{extraAction.label}
							</Button>
						)}
					</div>
				)
			}
		}
	]
}

// The columns most kinds put in the middle: the unit, what is asked for, and
// how many troopers it covers.
export function unitTargetTrooperColumns<TRow extends ProposalRow>(
	t: TFunction<'proposals'>,
	targetColumn: ColumnDef<TRow>
): ColumnDef<TRow>[] {
	return [
		{
			id: 'unit.name',
			accessorFn: (row) => row.unit?.name ?? '',
			header: t('common.unit'),
			cell: ({ row }) => row.original.unit?.name ?? '—'
		},
		targetColumn,
		{
			id: 'troopers',
			accessorFn: (row) => row.troopers?.length ?? 0,
			header: t('common.trooperCount'),
			cell: ({ row }) => (
				<span className='text-sm'>
					{row.original.troopers?.length ?? 0}
				</span>
			)
		}
	]
}
