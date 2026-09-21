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
import useTransferRequests from '@/hooks/useTransferRequests'
import {
	useApproveTransferRequest,
	useCancelTransferRequest,
	useExportTransferRequestHandover
} from '@/hooks/useTransferRequestActions'
import type { transfer_requests } from '@/api/client'
import {
	getTransferRequestColumns,
	STATUS_BADGE_VARIANT,
	STATUS_VALUES,
	statusLabel,
	type TransferRequestRow
} from './columns'
import CreateTransferRequestForm from './create-transfer-request-form'
import RejectDialog from './reject-dialog'
import { toastApiError } from '@/lib/api-error'

const ITEM_STATUSES = ['pending', 'approved', 'failed'] as const

function itemStatusLabel(t: TFunction<'proposals'>, status: string): string {
	return (ITEM_STATUSES as readonly string[]).includes(status)
		? t(`itemStatus.${status as (typeof ITEM_STATUSES)[number]}`)
		: status
}

export default function TransferRequestsTab() {
	const { t } = useTranslation('proposals')
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
		if (!confirm(t('transfer.confirmApprove'))) return
		try {
			await approveMutation.mutateAsync(id)
			toast.success(t('transfer.approved'))
		} catch (err) {
			toastApiError(t('transfer.approveFailed'), err)
		}
	}

	const handleExportHandover = async (id: number) => {
		try {
			await exportHandoverMutation.mutateAsync(id)
		} catch (err) {
			toastApiError(t('transfer.exportFailed'), err)
		}
	}

	const handleCancel = async (id: number) => {
		if (!confirm(t('transfer.confirmCancel'))) return
		try {
			await cancelMutation.mutateAsync(id)
			toast.success(t('transfer.cancelled'))
		} catch (err) {
			toastApiError(t('transfer.cancelFailed'), err)
		}
	}

	const columns = useMemo(
		() =>
			getTransferRequestColumns({
				t,
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
			t,
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
					<CreateTransferRequestForm onSuccess={() => refetch()} />
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
					placeholder={t('transfer.emptyTable')}
					getRowId={(row) => String(row.id)}
				/>
			)}

			<Sheet
				open={selected !== null}
				onOpenChange={(open) => !open && setSelected(null)}
			>
				<SheetContent className='w-full overflow-y-auto sm:max-w-xl'>
					<SheetHeader>
						<SheetTitle>{t('transfer.detailTitle')}</SheetTitle>
					</SheetHeader>
					{selected && (
						<div className='space-y-4 px-4 pb-4'>
							<div className='grid grid-cols-2 gap-2 text-sm'>
								<span className='text-muted-foreground'>
									{t('transfer.sourceUnit')}
								</span>
								<span>{selected.sourceUnit?.name ?? '—'}</span>
								<span className='text-muted-foreground'>
									{t('transfer.destinationUnit')}
								</span>
								<span>
									{selected.destinationUnit?.name ?? '—'}
								</span>
								<span className='text-muted-foreground'>
									{t('transfer.destinationRoom')}
								</span>
								<span>
									{selected.destinationRoom?.name ?? '—'}
								</span>
								<span className='text-muted-foreground'>
									{t('transfer.requestedBy')}
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
										{selected.troopers.map((trooper) => (
											<li
												key={trooper.id}
												className='flex items-center justify-between rounded-md border p-2'
											>
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
											</li>
										))}
									</ul>
								</div>
							)}

							{!!selected.materialAssetItems?.length && (
								<div>
									<h4 className='mb-1 text-sm font-medium'>
										{t('transfer.assets')}
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
															{itemStatusLabel(
																t,
																m.itemStatus
															)}
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
										{t('transfer.stocks')}
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
															{itemStatusLabel(
																t,
																m.itemStatus
															)}
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
