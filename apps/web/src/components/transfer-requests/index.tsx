import { useState } from 'react'
import { toast } from 'sonner'
import { ErrorState } from '@/components/error-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { Skeleton } from '@/components/ui/skeleton'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '@/components/ui/table'
import useAuth from '@/hooks/useAuth'
import useTransferRequests from '@/hooks/useTransferRequests'
import {
	useApproveTransferRequest,
	useCancelTransferRequest
} from '@/hooks/useTransferRequestActions'
import type { transfer_requests } from '@/api/client'
import CreateTransferRequestForm from './create-transfer-request-form'
import RejectDialog from './reject-dialog'

const STATUS_LABELS: Record<string, string> = {
	pending: 'Chờ duyệt',
	approved: 'Đã duyệt',
	rejected: 'Đã từ chối',
	cancelled: 'Đã hủy'
}

const STATUS_BADGE_VARIANT: Record<
	string,
	'default' | 'secondary' | 'destructive' | 'outline'
> = {
	pending: 'outline',
	approved: 'default',
	rejected: 'destructive',
	cancelled: 'secondary'
}

const ITEM_STATUS_LABELS: Record<string, string> = {
	pending: 'Chờ duyệt',
	approved: 'Thành công',
	failed: 'Thất bại'
}

type TransferRequestRow = transfer_requests.TransferRequestResp

function resourceSummary(row: TransferRequestRow) {
	const parts: string[] = []
	if (row.troopers?.length) parts.push(`${row.troopers.length} quân nhân`)
	if (row.materialAssetItems?.length)
		parts.push(`${row.materialAssetItems.length} khí tài`)
	if (row.materialStockItems?.length)
		parts.push(`${row.materialStockItems.length} vật tư`)
	return parts.length > 0 ? parts.join(', ') : '—'
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

	const canApprove = hasPermission('transfer_requests:approve')
	const canReject = hasPermission('transfer_requests:reject')

	const handleApprove = async (id: number) => {
		if (!confirm('Bạn có chắc muốn duyệt yêu cầu chuyển giao này?')) return
		try {
			await approveMutation.mutateAsync(id)
			toast.success('Đã duyệt yêu cầu chuyển giao')
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : 'Duyệt yêu cầu thất bại!'
			)
		}
	}

	const handleCancel = async (id: number) => {
		if (!confirm('Bạn có chắc muốn hủy yêu cầu chuyển giao này?')) return
		try {
			await cancelMutation.mutateAsync(id)
			toast.success('Đã hủy yêu cầu chuyển giao')
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : 'Hủy yêu cầu thất bại!'
			)
		}
	}

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

			<div className='rounded-md border'>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Thời gian</TableHead>
							<TableHead>Nguồn</TableHead>
							<TableHead>Đích</TableHead>
							<TableHead>Nguồn lực</TableHead>
							<TableHead>Người yêu cầu</TableHead>
							<TableHead>Người phê duyệt</TableHead>
							<TableHead>Trạng thái</TableHead>
							<TableHead className='text-right'>
								Thao tác
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading &&
							Array.from({ length: 8 }).map((_, i) => (
								<TableRow key={i}>
									{Array.from({ length: 8 }).map((_, j) => (
										<TableCell key={j}>
											<Skeleton className='h-4 w-full' />
										</TableCell>
									))}
								</TableRow>
							))}

						{!isLoading && data?.length === 0 && (
							<TableRow>
								<TableCell
									colSpan={8}
									className='py-10 text-center text-muted-foreground'
								>
									Không có yêu cầu chuyển giao nào
								</TableCell>
							</TableRow>
						)}

						{!isLoading &&
							data?.map((row) => {
								const isRequester =
									user?.id === row.requestedBy?.id
								const isPending = row.status === 'pending'

								return (
									<TableRow key={row.id}>
										<TableCell className='whitespace-nowrap text-sm'>
											{new Date(
												row.createdAt
											).toLocaleString('vi-VN')}
										</TableCell>
										<TableCell>
											{row.sourceUnit?.name ?? '—'}
										</TableCell>
										<TableCell>
											{row.destinationUnit?.name ?? '—'}
										</TableCell>
										<TableCell className='text-sm'>
											{resourceSummary(row)}
										</TableCell>
										<TableCell>
											{row.requestedBy?.displayName ??
												'—'}
										</TableCell>
										<TableCell>
											{row.approver?.displayName ?? '—'}
										</TableCell>
										<TableCell>
											<Badge
												variant={
													STATUS_BADGE_VARIANT[
														row.status
													] ?? 'secondary'
												}
											>
												{STATUS_LABELS[row.status] ??
													row.status}
											</Badge>
										</TableCell>
										<TableCell className='text-right'>
											<div className='flex justify-end gap-1'>
												<Button
													variant='ghost'
													size='sm'
													onClick={() =>
														setSelected(row)
													}
												>
													Xem
												</Button>
												{isPending &&
													canApprove &&
													row.canDecide && (
														<Button
															variant='ghost'
															size='sm'
															disabled={
																approveMutation.isPending
															}
															onClick={() =>
																handleApprove(
																	row.id
																)
															}
														>
															Duyệt
														</Button>
													)}
												{isPending &&
													canReject &&
													row.canDecide && (
														<Button
															variant='ghost'
															size='sm'
															onClick={() =>
																setRejectingId(
																	row.id
																)
															}
														>
															Từ chối
														</Button>
													)}
												{isPending && isRequester && (
													<Button
														variant='ghost'
														size='sm'
														disabled={
															cancelMutation.isPending
														}
														onClick={() =>
															handleCancel(row.id)
														}
													>
														Hủy
													</Button>
												)}
											</div>
										</TableCell>
									</TableRow>
								)
							})}
					</TableBody>
				</Table>
			</div>

			<Sheet
				open={selected !== null}
				onOpenChange={(open) => !open && setSelected(null)}
			>
				<SheetContent className='w-full overflow-y-auto sm:max-w-xl'>
					<SheetHeader>
						<SheetTitle>Chi tiết yêu cầu chuyển giao</SheetTitle>
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
									Phòng đích
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
