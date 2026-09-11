import { useEffect, useState } from 'react'
import type { DateRange } from 'react-day-picker'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import DateRangePicker from '@/components/date-range-picker'
import { ErrorState } from '@/components/error-state'
import InventorySessionApplyPanel from './inventory-session-apply-panel'
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
import type { inventory_sessions } from '@/api/client'
import {
	useInventorySessionReview,
	useInventorySessionsForRoom
} from '@/hooks/useInventorySession'
import {
	formatDbTimestamp,
	IsExceedApplyTime,
	toIsoDateString
} from '@/lib/utils'
import InventorySessionDiffList from './session-diff-list'
import InventorySessionStockDiffList from './stock-diff-list'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Label } from '../ui/label'

const HISTORY_PAGE_SIZE = 10

const SESSION_STATUS_LABEL: Record<
	string,
	{
		label: string
		variant: 'default' | 'secondary' | 'outline' | 'destructive'
	}
> = {
	in_progress: { label: 'Đang kiểm kê', variant: 'secondary' },
	completed: { label: 'Chờ xác nhận', variant: 'default' },
	reviewed: { label: 'Đã xác nhận', variant: 'outline' },
	expired: { label: 'Đã hết hạn', variant: 'destructive' }
}

function SessionDiffPanel({
	sessionId,
	enabled,
	enabledApply,
	completedAt
}: {
	sessionId: number
	enabled: boolean
	enabledApply: boolean
	completedAt: string | null
}) {
	const {
		data: review,
		isLoading,
		refetch
	} = useInventorySessionReview(sessionId, {
		enabled
	})

	if (!enabled) return null
	if (isLoading) {
		return <p className='text-muted-foreground text-sm'>Đang tải...</p>
	}
	if (!review) return null

	return (
		<div className='flex flex-col gap-4'>
			<div className='flex items-center gap-2'>
				<Badge className='bg-sky-50 text-sky-700'>
					Hoàn thành lúc:{' '}
				</Badge>
				<span className='font-mono'>
					{completedAt !== null
						? formatDbTimestamp(completedAt)
						: 'Chưa hoàn thành'}
				</span>
			</div>
			<InventorySessionDiffList diff={review.diff} />
			<InventorySessionStockDiffList stockDiff={review.stockDiff} />
			{enabledApply && (
				<InventorySessionApplyPanel
					session={review.session}
					diff={review.diff}
					stockDiff={review.stockDiff}
					onApplied={() => refetch()}
				/>
			)}
		</div>
	)
}

interface InventorySessionHistorySheetProps {
	roomId?: number
	roomName: string
	open: boolean
	onOpenChange: (open: boolean) => void
}

// Every session a room has ever run, newest first - the durable record of
// `inventory_sessions.status` reaching `completed`/`reviewed` has nowhere
// else to surface once its originating InventorySessionDialog closes.
export default function InventorySessionHistorySheet({
	roomId,
	roomName,
	open,
	onOpenChange
}: InventorySessionHistorySheetProps) {
	const [openSessionId, setOpenSessionId] = useState('')
	const [status, setStatus] = useState('')
	const [dateRange, setDateRange] = useState<DateRange | undefined>()
	const [page, setPage] = useState(1)
	const [sessions, setSessions] = useState<
		inventory_sessions.InventorySessionResp[]
	>([])

	const from = dateRange?.from ? toIsoDateString(dateRange.from) : undefined
	const to = dateRange?.to ? toIsoDateString(dateRange.to) : undefined

	// Any filter change (or the sheet reopening) starts a fresh accumulated
	// list at page 1 - stale pages from a previous filter must not linger
	// ahead of the "load more" button.
	useEffect(() => {
		setPage(1)
		setSessions([])
	}, [open, roomId, status, from, to])

	const { data, error, refetch, isFetching } = useInventorySessionsForRoom(
		roomId,
		{
			status: (status || undefined) as
				| inventory_sessions.InventorySessionStatus
				| undefined,
			from,
			to,
			page,
			pageSize: HISTORY_PAGE_SIZE
		},
		{ enabled: open }
	)

	useEffect(() => {
		if (!data) return
		setSessions((prev) =>
			page === 1 ? data.data : [...prev, ...data.data]
		)
	}, [data, page])

	const total = data?.total ?? 0
	const hasMore = sessions.length < total

	const handleFilterChange = (setter: (v: string) => void) => (v: string) =>
		setter(v === 'all' ? '' : v)

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className='w-full sm:max-w-lg'>
				<SheetHeader>
					<SheetTitle>Lịch sử kiểm kê - {roomName}</SheetTitle>
				</SheetHeader>
				<ScrollArea className='px-4 pb-4 h-screen'>
					<div className='flex flex-wrap items-center gap-2 pb-3'>
						<div className='flex flex-col gap-2'>
							<Label className='font-bold'>
								Trạng thái của phiên
							</Label>
							<Select
								value={status || 'all'}
								onValueChange={handleFilterChange(setStatus)}
							>
								<SelectTrigger className='h-8 w-[160px]'>
									<SelectValue placeholder='Trạng thái' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='all'>
										Tất cả trạng thái
									</SelectItem>
									{Object.entries(SESSION_STATUS_LABEL).map(
										([value, { label }]) => (
											<SelectItem
												key={value}
												value={value}
											>
												{label}
											</SelectItem>
										)
									)}
								</SelectContent>
							</Select>
						</div>
						<div className='flex flex-col gap-2'>
							<Label className='font-bold'>Khoảng ngày</Label>
							<DateRangePicker
								value={dateRange}
								onChange={setDateRange}
							/>
						</div>
					</div>

					{error && (
						<ErrorState
							error={error as Error}
							onRetry={() => refetch()}
						/>
					)}
					{!error && !isFetching && sessions.length === 0 && (
						<p className='text-muted-foreground text-sm'>
							Phòng này chưa có phiên kiểm kê nào.
						</p>
					)}
					{!error && sessions.length > 0 && (
						<Accordion
							type='single'
							collapsible
							value={openSessionId}
							onValueChange={setOpenSessionId}
						>
							{sessions.map(
								(
									session: inventory_sessions.InventorySessionResp
								) => {
									const statusLabel = SESSION_STATUS_LABEL[
										session.status
									] ?? {
										label: session.status,
										variant: 'outline' as const
									}
									const enabledApply = session.completedAt
										? !IsExceedApplyTime(
												session.completedAt
											)
										: false

									return (
										<AccordionItem
											key={session.id}
											value={String(session.id)}
										>
											<AccordionTrigger>
												<div className='flex items-center justify-between w-full'>
													<span className='font-mono'>
														Tạo lúc:{' '}
														<span>
															{formatDbTimestamp(
																session.createdAt
															)}
														</span>
													</span>
													<Badge
														variant={
															statusLabel.variant
														}
													>
														{statusLabel.label}
													</Badge>
												</div>
											</AccordionTrigger>
											<AccordionContent>
												<SessionDiffPanel
													completedAt={
														session.completedAt
													}
													sessionId={session.id}
													enabled={
														openSessionId ===
														String(session.id)
													}
													enabledApply={enabledApply}
												/>
											</AccordionContent>
										</AccordionItem>
									)
								}
							)}
						</Accordion>
					)}

					{!error && hasMore && (
						<div className='flex justify-center pt-3'>
							<Button
								variant='outline'
								size='sm'
								disabled={isFetching}
								onClick={() => setPage((p) => p + 1)}
							>
								{isFetching ? 'Đang tải...' : 'Tải thêm'}
							</Button>
						</div>
					)}
				</ScrollArea>
			</SheetContent>
		</Sheet>
	)
}
