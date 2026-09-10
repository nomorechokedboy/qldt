import { useState } from 'react'
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { ErrorState } from '@/components/error-state'
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
import InventorySessionDiffList from './session-diff-list'

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
	enabled
}: {
	sessionId: number
	enabled: boolean
}) {
	const { data: review, isLoading } = useInventorySessionReview(sessionId, {
		enabled
	})

	if (!enabled) return null
	if (isLoading) {
		return <p className='text-muted-foreground text-sm'>Đang tải...</p>
	}
	if (!review) return null

	return <InventorySessionDiffList diff={review.diff} />
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
	const { data, error, refetch } = useInventorySessionsForRoom(roomId, {
		enabled: open
	})
	const [openSessionId, setOpenSessionId] = useState('')

	const sessions = data?.data ?? []

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className='w-full sm:max-w-lg'>
				<SheetHeader>
					<SheetTitle>Lịch sử kiểm kê - {roomName}</SheetTitle>
				</SheetHeader>
				<div className='px-4 pb-4'>
					{error && (
						<ErrorState
							error={error as Error}
							onRetry={() => refetch()}
						/>
					)}
					{!error && sessions.length === 0 && (
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
									return (
										<AccordionItem
											key={session.id}
											value={String(session.id)}
										>
											<AccordionTrigger>
												<span className='flex items-center gap-3'>
													<span>
														{new Date(
															session.createdAt
														).toLocaleString(
															'vi-VN'
														)}
													</span>
													<Badge
														variant={
															statusLabel.variant
														}
													>
														{statusLabel.label}
													</Badge>
												</span>
											</AccordionTrigger>
											<AccordionContent>
												<SessionDiffPanel
													sessionId={session.id}
													enabled={
														openSessionId ===
														String(session.id)
													}
												/>
											</AccordionContent>
										</AccordionItem>
									)
								}
							)}
						</Accordion>
					)}
				</div>
			</SheetContent>
		</Sheet>
	)
}
