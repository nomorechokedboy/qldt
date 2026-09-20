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
import { activityStatusLabel } from '@/data/activity-statuses'
import useAuth from '@/hooks/useAuth'
import useActivityStatusProposals from '@/hooks/useActivityStatusProposals'
import {
	useApproveActivityStatusProposal,
	useCancelActivityStatusProposal
} from '@/hooks/useActivityStatusProposalActions'
import { formatDbTimestamp, getErrorMessage } from '@/lib/utils'
import type { activity_status_proposals } from '@/api/client'
import {
	getActivityStatusProposalColumns,
	STATUS_BADGE_VARIANT,
	STATUS_VALUES,
	statusLabel,
	type ActivityStatusProposalRow
} from './columns'
import CreateActivityStatusProposalForm from './create-proposal-form'
import RejectDialog from './reject-dialog'

const ITEM_STATUSES = ['pending', 'approved', 'failed'] as const

function itemStatusLabel(t: TFunction<'proposals'>, status: string): string {
	return (ITEM_STATUSES as readonly string[]).includes(status)
		? t(`itemStatus.${status as (typeof ITEM_STATUSES)[number]}`)
		: status
}

// 'discharged' is a one-off transition (single effectiveDate); the other 3
// target statuses are ranged (startDate → endDate, reverting to 'serving'
// once endDate is reached). Mirrors isRangedTargetActivityStatus on the
// backend.
const isRangedTarget = (target: string) => target !== 'discharged'

function resolveDates(
	target: string,
	header: {
		effectiveDate: string | null
		startDate: string | null
		endDate: string | null
	},
	override?: {
		effectiveDate: string | null
		startDate: string | null
		endDate: string | null
	}
): {
	effectiveDate: string | null
	startDate: string | null
	endDate: string | null
} {
	if (!isRangedTarget(target)) {
		return {
			effectiveDate: override?.effectiveDate ?? header.effectiveDate,
			startDate: null,
			endDate: null
		}
	}
	return {
		effectiveDate: null,
		startDate: override?.startDate ?? header.startDate,
		endDate: override?.endDate ?? header.endDate
	}
}

export default function ActivityStatusProposalsTab() {
	const { t } = useTranslation('proposals')
	const [status, setStatus] = useState<string>('')
	const [selected, setSelected] = useState<ActivityStatusProposalRow | null>(
		null
	)
	const [rejectingId, setRejectingId] = useState<number | null>(null)

	const { user, hasPermission } = useAuth()

	const { data, isLoading, error, refetch } = useActivityStatusProposals({
		status: (status ||
			undefined) as activity_status_proposals.GetActivityStatusProposalsQuery['status']
	})

	const approveMutation = useApproveActivityStatusProposal()
	const cancelMutation = useCancelActivityStatusProposal()

	const canApprove = hasPermission('activity_status_proposals:approve')
	const canReject = hasPermission('activity_status_proposals:reject')

	const handleApprove = async (id: number) => {
		if (!confirm(t('activity.confirmApprove'))) return
		try {
			await approveMutation.mutateAsync(id)
			toast.success(t('activity.approved'))
		} catch (err) {
			toast.error(getErrorMessage(err, t('activity.approveFailed')))
		}
	}

	const handleCancel = async (id: number) => {
		if (!confirm(t('activity.confirmCancel'))) return
		try {
			await cancelMutation.mutateAsync(id)
			toast.success(t('activity.cancelled'))
		} catch (err) {
			toast.error(getErrorMessage(err, t('activity.cancelFailed')))
		}
	}

	const columns = useMemo(
		() =>
			getActivityStatusProposalColumns({
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
					<CreateActivityStatusProposalForm
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
					placeholder={t('activity.emptyTable')}
					getRowId={(row) => String(row.id)}
				/>
			)}

			<Sheet
				open={selected !== null}
				onOpenChange={(open) => !open && setSelected(null)}
			>
				<SheetContent className='w-full overflow-y-auto sm:max-w-xl'>
					<SheetHeader>
						<SheetTitle>{t('activity.detailTitle')}</SheetTitle>
					</SheetHeader>
					{selected && (
						<div className='space-y-4 px-4 pb-4'>
							<div className='grid grid-cols-2 gap-2 text-sm'>
								<span className='text-muted-foreground'>
									{t('common.unit')}
								</span>
								<span>{selected.unit?.name ?? '—'}</span>
								<span className='text-muted-foreground'>
									{t('activity.targetStatus')}
								</span>
								<span>
									{activityStatusLabel(
										selected.targetActivityStatus
									)}
								</span>
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
								{isRangedTarget(
									selected.targetActivityStatus
								) ? (
									<>
										<span className='text-muted-foreground'>
											{t('activity.startDate')}
										</span>
										<span>{selected.startDate ?? '—'}</span>
										<span className='text-muted-foreground'>
											{t('activity.endDate')}
										</span>
										<span>{selected.endDate ?? '—'}</span>
									</>
								) : (
									<>
										<span className='text-muted-foreground'>
											{t('common.effectiveDate')}
										</span>
										<span>
											{selected.effectiveDate ?? '—'}
										</span>
									</>
								)}
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
											const dates = resolveDates(
												selected.targetActivityStatus,
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
														{isRangedTarget(
															selected.targetActivityStatus
														) ? (
															<span>
																{dates.startDate ??
																	'—'}{' '}
																→{' '}
																{dates.endDate ??
																	'—'}
															</span>
														) : (
															<span>
																{t(
																	'common.itemEffectiveDate',
																	{
																		date:
																			dates.effectiveDate ??
																			'—'
																	}
																)}
															</span>
														)}
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
														{trooper.revertedAt && (
															<span>
																{t(
																	'activity.itemRevertedAt',
																	{
																		date: formatDbTimestamp(
																			trooper.revertedAt
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
