import RefreshButton from '@/components/refresh-button'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { toast } from 'sonner'
import { DataTable } from '@/components/data-table'
import DataTableSkeleton from '@/components/data-table-skeleton'
import { ErrorState } from '@/components/error-state'
import { Badge } from '@/components/ui/badge'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select'
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle
} from '@/components/ui/sheet'
import useAuth from '@/hooks/useAuth'
import useRankPromotionProposals from '@/hooks/useRankPromotionProposals'
import {
	useApproveRankPromotionProposal,
	useCancelRankPromotionProposal
} from '@/hooks/useRankPromotionProposalActions'
import { formatDbTimestamp, getErrorMessage } from '@/lib/utils'
import type { rank_promotion_proposals } from '@/api/client'
import {
	getRankPromotionProposalColumns,
	STATUS_BADGE_VARIANT,
	STATUS_VALUES,
	statusLabel,
	type RankPromotionProposalRow
} from './columns'
import CreateRankPromotionProposalForm from './create-proposal-form'
import RejectDialog from './reject-dialog'

const ITEM_STATUSES = ['pending', 'approved', 'failed'] as const

function itemStatusLabel(t: TFunction<'proposals'>, status: string): string {
	return (ITEM_STATUSES as readonly string[]).includes(status)
		? t(`itemStatus.${status as (typeof ITEM_STATUSES)[number]}`)
		: status
}

function resolveRank(
	header: { targetRank: string },
	override?: { targetRank: string | null }
): string {
	return override?.targetRank ?? header.targetRank
}

function resolveDate(
	header: { effectiveDate: string | null },
	override?: { effectiveDate: string | null }
): string | null {
	return override?.effectiveDate ?? header.effectiveDate
}

export default function RankPromotionProposalsTab() {
	const { t } = useTranslation('proposals')
	const [status, setStatus] = useState<string>('')
	const [selected, setSelected] = useState<RankPromotionProposalRow | null>(
		null
	)
	const [rejectingId, setRejectingId] = useState<number | null>(null)

	const { user, hasPermission } = useAuth()

	const { data, isLoading, error, refetch } = useRankPromotionProposals({
		status: (status ||
			undefined) as rank_promotion_proposals.GetRankPromotionProposalsQuery['status']
	})

	const approveMutation = useApproveRankPromotionProposal()
	const cancelMutation = useCancelRankPromotionProposal()

	const canApprove = hasPermission('rank_promotion_proposals:approve')
	const canReject = hasPermission('rank_promotion_proposals:reject')

	const handleApprove = async (id: number) => {
		if (!confirm(t('rank.confirmApprove'))) return
		try {
			await approveMutation.mutateAsync(id)
			toast.success(t('rank.approved'))
		} catch (err) {
			toast.error(getErrorMessage(err, t('rank.approveFailed')))
		}
	}

	const handleCancel = async (id: number) => {
		if (!confirm(t('rank.confirmCancel'))) return
		try {
			await cancelMutation.mutateAsync(id)
			toast.success(t('rank.cancelled'))
		} catch (err) {
			toast.error(getErrorMessage(err, t('rank.cancelFailed')))
		}
	}

	const columns = useMemo(
		() =>
			getRankPromotionProposalColumns({
				t,
				currentUserId: user?.id,
				canApprove,
				canReject,
				isApproving: approveMutation.isPending,
				isCancelling: cancelMutation.isPending,
				onView: setSelected,
				onApprove: handleApprove,
				onReject: setRejectingId,
				onCancel: handleCancel
			}),
		[
			t,
			user?.id,
			canApprove,
			canReject,
			approveMutation.isPending,
			cancelMutation.isPending
		]
	)

	if (error) {
		return <ErrorState error={error as Error} onRetry={() => refetch()} />
	}

	return (
		<div className='space-y-4'>
			<div className='flex flex-wrap items-center justify-between gap-2'>
				<Select
					value={status || 'all'}
					onValueChange={(v) => setStatus(v === 'all' ? '' : v)}
				>
					<SelectTrigger className='h-8 w-[180px]'>
						<SelectValue placeholder={t('status.label')} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value='all'>{t('status.all')}</SelectItem>
						{STATUS_VALUES.map((value) => (
							<SelectItem key={value} value={value}>
								{t(`status.${value}`)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<div className='flex items-center gap-3'>
					<CreateRankPromotionProposalForm
						onSuccess={() => refetch()}
					/>
					<RefreshButton onRefresh={() => refetch()} />
				</div>
			</div>

			{isLoading ? (
				<DataTableSkeleton columns={7} rows={8} />
			) : (
				<DataTable
					columns={columns}
					data={data ?? []}
					toolbarVisible={false}
					placeholder={t('rank.emptyTable')}
					getRowId={(row) => String(row.id)}
				/>
			)}

			<Sheet
				open={selected !== null}
				onOpenChange={(open) => !open && setSelected(null)}
			>
				<SheetContent className='w-full overflow-y-auto sm:max-w-xl'>
					<SheetHeader>
						<SheetTitle>{t('rank.detailTitle')}</SheetTitle>
					</SheetHeader>
					{selected && (
						<div className='space-y-4 px-4 pb-4'>
							<div className='grid grid-cols-2 gap-2 text-sm'>
								<span className='text-muted-foreground'>
									{t('common.unit')}
								</span>
								<span>{selected.unit?.name ?? '—'}</span>
								<span className='text-muted-foreground'>
									{t('rank.targetRank')}
								</span>
								<span>{selected.targetRank}</span>
								<span className='text-muted-foreground'>
									{t('common.requestedBy')}
								</span>
								<span>
									{selected.requestedBy?.displayName ?? '—'}
								</span>
								<span className='text-muted-foreground'>
									{t('common.approver')}
								</span>
								<span>
									{selected.approver?.displayName ?? '—'}
								</span>
								<span className='text-muted-foreground'>
									{t('status.label')}
								</span>
								<span>
									<Badge
										variant={
											STATUS_BADGE_VARIANT[
												selected.status
											] ?? 'secondary'
										}
									>
										{statusLabel(t, selected.status)}
									</Badge>
								</span>
								<span className='text-muted-foreground'>
									{t('common.effectiveDate')}
								</span>
								<span>{selected.effectiveDate ?? '—'}</span>
								{selected.note && (
									<>
										<span className='text-muted-foreground'>
											{t('common.note')}
										</span>
										<span>{selected.note}</span>
									</>
								)}
								{selected.rejectionReason && (
									<>
										<span className='text-muted-foreground'>
											{t('common.rejectionReason')}
										</span>
										<span>{selected.rejectionReason}</span>
									</>
								)}
							</div>

							{!!selected.troopers?.length && (
								<div>
									<h4 className='mb-1 text-sm font-medium'>
										{t('common.troopers')}
									</h4>
									<ul className='space-y-1 text-sm'>
										{selected.troopers.map((trooper) => {
											const rank = resolveRank(
												selected,
												trooper
											)
											const date = resolveDate(
												selected,
												trooper
											)
											return (
												<li
													key={trooper.id}
													className='flex flex-col gap-1 rounded-md border p-2'
												>
													<div className='flex items-center justify-between'>
														<span>
															{trooper.student
																?.fullName ??
																`#${trooper.id}`}
														</span>
														<span className='flex items-center gap-2'>
															<Badge variant='outline'>
																{itemStatusLabel(
																	t,
																	trooper.itemStatus
																)}
															</Badge>
															{trooper.failureReason && (
																<span className='text-xs text-destructive'>
																	{
																		trooper.failureReason
																	}
																</span>
															)}
														</span>
													</div>
													<div className='flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground'>
														<span>
															{t(
																'rank.itemRank',
																{ rank }
															)}
														</span>
														<span>
															{t(
																'common.itemEffectiveDate',
																{
																	date:
																		date ??
																		'—'
																}
															)}
														</span>
														{trooper.appliedAt && (
															<span>
																{t(
																	'common.itemAppliedAt',
																	{
																		date: formatDbTimestamp(
																			trooper.appliedAt
																		)
																	}
																)}
															</span>
														)}
													</div>
												</li>
											)
										})}
									</ul>
								</div>
							)}
						</div>
					)}
				</SheetContent>
			</Sheet>

			{rejectingId !== null && (
				<RejectDialog
					id={rejectingId}
					open={rejectingId !== null}
					onOpenChange={(open) => !open && setRejectingId(null)}
				/>
			)}
		</div>
	)
}
