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
	STATUS_LABELS,
	type RankPromotionProposalRow
} from './columns'
import CreateRankPromotionProposalForm from './create-proposal-form'
import RejectDialog from './reject-dialog'

const ITEM_STATUS_LABELS: Record<string, string> = {
	pending: 'Chờ duyệt',
	approved: 'Thành công',
	failed: 'Thất bại'
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
		if (!confirm('Bạn có chắc muốn duyệt đề xuất thăng quân hàm này?'))
			return
		try {
			await approveMutation.mutateAsync(id)
			toast.success('Đã duyệt đề xuất thăng quân hàm')
		} catch (err) {
			toast.error(getErrorMessage(err, 'Duyệt đề xuất thất bại!'))
		}
	}

	const handleCancel = async (id: number) => {
		if (!confirm('Bạn có chắc muốn hủy đề xuất thăng quân hàm này?')) return
		try {
			await cancelMutation.mutateAsync(id)
			toast.success('Đã hủy đề xuất thăng quân hàm')
		} catch (err) {
			toast.error(getErrorMessage(err, 'Hủy đề xuất thất bại!'))
		}
	}

	const columns = useMemo(
		() =>
			getRankPromotionProposalColumns({
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

				<CreateRankPromotionProposalForm onSuccess={() => refetch()} />
			</div>

			{isLoading ? (
				<DataTableSkeleton columns={7} rows={8} />
			) : (
				<DataTable
					columns={columns}
					data={data ?? []}
					toolbarVisible={false}
					placeholder='Không có đề xuất thăng quân hàm nào'
					getRowId={(row) => String(row.id)}
				/>
			)}

			<Sheet
				open={selected !== null}
				onOpenChange={(open) => !open && setSelected(null)}
			>
				<SheetContent className='w-full overflow-y-auto sm:max-w-xl'>
					<SheetHeader>
						<SheetTitle>Chi tiết đề xuất thăng quân hàm</SheetTitle>
					</SheetHeader>
					{selected && (
						<div className='space-y-4 px-4 pb-4'>
							<div className='grid grid-cols-2 gap-2 text-sm'>
								<span className='text-muted-foreground'>
									Đơn vị
								</span>
								<span>{selected.unit?.name ?? '—'}</span>
								<span className='text-muted-foreground'>
									Quân hàm đề xuất
								</span>
								<span>{selected.targetRank}</span>
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
								<span className='text-muted-foreground'>
									Ngày hiệu lực
								</span>
								<span>{selected.effectiveDate ?? '—'}</span>
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
											const rank = resolveRank(
												selected,
												t
											)
											const date = resolveDate(
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
														<span>
															Quân hàm: {rank}
														</span>
														<span>
															Ngày hiệu lực:{' '}
															{date ?? '—'}
														</span>
														{t.appliedAt && (
															<span>
																Đã áp dụng:{' '}
																{formatDbTimestamp(
																	t.appliedAt
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
