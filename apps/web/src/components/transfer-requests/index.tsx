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
import useTransferRequests from '@/hooks/useTransferRequests'
import {
	useApproveTransferRequest,
	useCancelTransferRequest,
	useExportTransferRequestHandover
} from '@/hooks/useTransferRequestActions'
import { getErrorMessage } from '@/lib/utils'
import type { transfer_requests } from '@/api/client'
import {
	getTransferRequestColumns,
	STATUS_BADGE_VARIANT,
	STATUS_LABELS,
	type TransferRequestRow
} from './columns'
import CreateTransferRequestForm from './create-transfer-request-form'
import RejectDialog from './reject-dialog'

const ITEM_STATUS_LABELS: Record<string, string> = {
	pending: 'Chờ duyệt',
	approved: 'Thành công',
	failed: 'Thất bại'
}

export default function TransferRequestsTab() {
	const [status, setStatus] = useState<string>('')
	const [selected, setSelected] = useState<TransferRequestRow | null>(null)
	const [rejectingId, setRejectingId] = useState<number | null>(null)

	const { user, hasPermission } = useAuth()

	const { data, isLoading, error, refetch } = useTransferRequests({
		status: (status ||
			undefined) as transfer_requests.GetTransferRequestsQuery['status']
	})

	const approveMutation = useApproveTransferRequest()
	const cancelMutation = useCancelTransferRequest()
	const exportHandoverMutation = useExportTransferRequestHandover()

	const canApprove = hasPermission('transfer_requests:approve')
	const canReject = hasPermission('transfer_requests:reject')

	const handleApprove = async (id: number) => {
		if (!confirm('Bạn có chắc muốn duyệt yêu cầu bàn giao này?')) return
		try {
			await approveMutation.mutateAsync(id)
			toast.success('Đã duyệt yêu cầu bàn giao')
		} catch (err) {
			toast.error(getErrorMessage(err, 'Duyệt yêu cầu thất bại!'))
		}
	}

	const handleExportHandover = async (id: number) => {
		try {
			await exportHandoverMutation.mutateAsync(id)
		} catch (err) {
			toast.error(
				getErrorMessage(err, 'Xuất biên bản bàn giao thất bại!')
			)
		}
	}

	const handleCancel = async (id: number) => {
		if (!confirm('Bạn có chắc muốn hủy yêu cầu bàn giao này?')) return
		try {
			await cancelMutation.mutateAsync(id)
			toast.success('Đã hủy yêu cầu bàn giao')
		} catch (err) {
			toast.error(getErrorMessage(err, 'Hủy yêu cầu thất bại!'))
		}
	}

	const columns = useMemo(
		() =>
			getTransferRequestColumns({
				currentUserId: user?.id,
				canApprove,
				canReject,
				isApproving: approveMutation.isPending,
				isCancelling: cancelMutation.isPending,
				isExportingHandover: exportHandoverMutation.isPending,
				onView: setSelected,
				onApprove: handleApprove,
				onReject: setRejectingId,
				onCancel: handleCancel,
				onExportHandover: handleExportHandover
			}),
		[
			user?.id,
			canApprove,
			canReject,
			approveMutation.isPending,
			cancelMutation.isPending,
			exportHandoverMutation.isPending
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

				<CreateTransferRequestForm onSuccess={() => refetch()} />
			</div>

			{isLoading ? (
				<DataTableSkeleton columns={7} rows={8} />
			) : (
				<DataTable
					columns={columns}
					data={data ?? []}
					toolbarVisible={false}
					placeholder='Không có yêu cầu bàn giao nào'
					getRowId={(row) => String(row.id)}
				/>
			)}

			<Sheet
				open={selected !== null}
				onOpenChange={(open) => !open && setSelected(null)}
			>
				<SheetContent className='w-full overflow-y-auto sm:max-w-xl'>
					<SheetHeader>
						<SheetTitle>Chi tiết yêu cầu bàn giao</SheetTitle>
					</SheetHeader>
					{selected && (
						<div className='space-y-4 px-4 pb-4'>
							<div className='grid grid-cols-2 gap-2 text-sm'>
								<span className='text-muted-foreground'>
									Đơn vị nguồn
								</span>
								<span>{selected.sourceUnit?.name ?? '—'}</span>
								<span className='text-muted-foreground'>
									Đơn vị đích
								</span>
								<span>
									{selected.destinationUnit?.name ?? '—'}
								</span>
								<span className='text-muted-foreground'>
									Vị trí đích
								</span>
								<span>
									{selected.destinationRoom?.name ?? '—'}
								</span>
								<span className='text-muted-foreground'>
									Người yêu cầu
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
										{selected.troopers.map((t) => (
											<li
												key={t.id}
												className='flex items-center justify-between rounded-md border p-2'
											>
												<span>
													{t.student?.fullName ??
														`#${t.id}`}
												</span>
												<span className='flex items-center gap-2'>
													<Badge variant='outline'>
														{ITEM_STATUS_LABELS[
															t.itemStatus
														] ?? t.itemStatus}
													</Badge>
													{t.failureReason && (
														<span className='text-xs text-destructive'>
															{t.failureReason}
														</span>
													)}
												</span>
											</li>
										))}
									</ul>
								</div>
							)}

							{!!selected.materialAssetItems?.length && (
								<div>
									<h4 className='mb-1 text-sm font-medium'>
										Khí tài
									</h4>
									<ul className='space-y-1 text-sm'>
										{selected.materialAssetItems.map(
											(m) => (
												<li
													key={m.id}
													className='flex items-center justify-between rounded-md border p-2'
												>
													<span>
														{m.materialAsset
															?.serialNumber ??
															`#${m.id}`}
													</span>
													<span className='flex items-center gap-2'>
														<Badge variant='outline'>
															{ITEM_STATUS_LABELS[
																m.itemStatus
															] ?? m.itemStatus}
														</Badge>
														{m.failureReason && (
															<span className='text-xs text-destructive'>
																{
																	m.failureReason
																}
															</span>
														)}
													</span>
												</li>
											)
										)}
									</ul>
								</div>
							)}

							{!!selected.materialStockItems?.length && (
								<div>
									<h4 className='mb-1 text-sm font-medium'>
										Vật tư
									</h4>
									<ul className='space-y-1 text-sm'>
										{selected.materialStockItems.map(
											(m) => (
												<li
													key={m.id}
													className='flex items-center justify-between rounded-md border p-2'
												>
													<span>
														{m.materialType?.name ??
															`#${m.id}`}{' '}
														({m.condition}) x{' '}
														{m.quantity}
													</span>
													<span className='flex items-center gap-2'>
														<Badge variant='outline'>
															{ITEM_STATUS_LABELS[
																m.itemStatus
															] ?? m.itemStatus}
														</Badge>
														{m.failureReason && (
															<span className='text-xs text-destructive'>
																{
																	m.failureReason
																}
															</span>
														)}
													</span>
												</li>
											)
										)}
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
