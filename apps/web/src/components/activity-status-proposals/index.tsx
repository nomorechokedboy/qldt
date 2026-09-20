import RefreshButton from '@/components/refresh-button'
import { useMemo, useState } from 'react'
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
import { activityStatusLabels } from '@/data/activity-statuses'
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
	STATUS_LABELS,
	type ActivityStatusProposalRow
} from './columns'
import CreateActivityStatusProposalForm from './create-proposal-form'
import RejectDialog from './reject-dialog'

const ITEM_STATUS_LABELS: Record<string, string> = {
	pending: 'Chờ duyệt',
	approved: 'Thành công',
	failed: 'Thất bại'
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
		if (!confirm('Bạn có chắc muốn duyệt đề xuất chế độ này?')) return
		try {
			await approveMutation.mutateAsync(id)
			toast.success('Đã duyệt đề xuất chế độ')
		} catch (err) {
			toast.error(getErrorMessage(err, 'Duyệt đề xuất thất bại!'))
		}
	}

	const handleCancel = async (id: number) => {
		if (!confirm('Bạn có chắc muốn hủy đề xuất chế độ này?')) return
		try {
			await cancelMutation.mutateAsync(id)
			toast.success('Đã hủy đề xuất chế độ')
		} catch (err) {
			toast.error(getErrorMessage(err, 'Hủy đề xuất thất bại!'))
		}
	}

	const columns = useMemo(
		() =>
			getActivityStatusProposalColumns({
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
						<SelectValue placeholder='Trạng thái' />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value='all'>Tất cả trạng thái</SelectItem>
						{Object.entries(STATUS_LABELS).map(([value, label]) => (
							<SelectItem key={value} value={value}>
								{label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<RefreshButton onRefresh={() => refetch()} />
				<CreateActivityStatusProposalForm onSuccess={() => refetch()} />
			</div>

			{isLoading ? (
				<DataTableSkeleton columns={7} rows={8} />
			) : (
				<DataTable
					columns={columns}
					data={data ?? []}
					toolbarVisible={false}
					placeholder='Không có đề xuất chế độ nào'
					getRowId={(row) => String(row.id)}
				/>
			)}

			<Sheet
				open={selected !== null}
				onOpenChange={(open) => !open && setSelected(null)}
			>
				<SheetContent className='w-full overflow-y-auto sm:max-w-xl'>
					<SheetHeader>
						<SheetTitle>Chi tiết đề xuất chế độ</SheetTitle>
					</SheetHeader>
					{selected && (
						<div className='space-y-4 px-4 pb-4'>
							<div className='grid grid-cols-2 gap-2 text-sm'>
								<span className='text-muted-foreground'>
									Đơn vị
								</span>
								<span>{selected.unit?.name ?? '—'}</span>
								<span className='text-muted-foreground'>
									Chế độ đề xuất
								</span>
								<span>
									{activityStatusLabels[
										selected.targetActivityStatus as keyof typeof activityStatusLabels
									] ?? selected.targetActivityStatus}
								</span>
								<span className='text-muted-foreground'>
									Người đề xuất
								</span>
								<span>
									{selected.requestedBy?.displayName ?? '—'}
								</span>
								<span className='text-muted-foreground'>
									Người phê duyệt
								</span>
								<span>
									{selected.approver?.displayName ?? '—'}
								</span>
								<span className='text-muted-foreground'>
									Trạng thái
								</span>
								<span>
									<Badge
										variant={
											STATUS_BADGE_VARIANT[
												selected.status
											] ?? 'secondary'
										}
									>
										{STATUS_LABELS[selected.status] ??
											selected.status}
									</Badge>
								</span>
								{isRangedTarget(
									selected.targetActivityStatus
								) ? (
									<>
										<span className='text-muted-foreground'>
											Từ ngày
										</span>
										<span>{selected.startDate ?? '—'}</span>
										<span className='text-muted-foreground'>
											Đến ngày
										</span>
										<span>{selected.endDate ?? '—'}</span>
									</>
								) : (
									<>
										<span className='text-muted-foreground'>
											Ngày hiệu lực
										</span>
										<span>
											{selected.effectiveDate ?? '—'}
										</span>
									</>
								)}
								{selected.note && (
									<>
										<span className='text-muted-foreground'>
											Ghi chú
										</span>
										<span>{selected.note}</span>
									</>
								)}
								{selected.rejectionReason && (
									<>
										<span className='text-muted-foreground'>
											Lý do từ chối
										</span>
										<span>{selected.rejectionReason}</span>
									</>
								)}
							</div>

							{!!selected.troopers?.length && (
								<div>
									<h4 className='mb-1 text-sm font-medium'>
										Quân nhân
									</h4>
									<ul className='space-y-1 text-sm'>
										{selected.troopers.map((t) => {
											const dates = resolveDates(
												selected.targetActivityStatus,
												selected,
												t
											)
											return (
												<li
													key={t.id}
													className='flex flex-col gap-1 rounded-md border p-2'
												>
													<div className='flex items-center justify-between'>
														<span>
															{t.student
																?.fullName ??
																`#${t.id}`}
														</span>
														<span className='flex items-center gap-2'>
															<Badge variant='outline'>
																{ITEM_STATUS_LABELS[
																	t.itemStatus
																] ??
																	t.itemStatus}
															</Badge>
															{t.failureReason && (
																<span className='text-xs text-destructive'>
																	{
																		t.failureReason
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
																Ngày hiệu lực:{' '}
																{dates.effectiveDate ??
																	'—'}
															</span>
														)}
														{t.appliedAt && (
															<span>
																Đã áp dụng:{' '}
																{formatDbTimestamp(
																	t.appliedAt
																)}
															</span>
														)}
														{t.revertedAt && (
															<span>
																Đã khôi phục:{' '}
																{formatDbTimestamp(
																	t.revertedAt
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
