import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import useMaterialAssetEvents from '@/hooks/useMaterialAssetEvents'
import {
	materialAssetStatusLabels,
	materialConditionLabels
} from '@/data/material-categories'
import type { MaterialAssetEvent, MaterialAssetEventType } from '@/types'

const eventTypeLabels: Record<MaterialAssetEventType, string> = {
	assigned: 'Cấp phát',
	unassigned: 'Thu hồi',
	condition_changed: 'Đổi tình trạng',
	status_changed: 'Đổi trạng thái',
	transferred: 'Chuyển đơn vị/phòng'
}

const trooperLabel = (value?: Record<string, unknown> | null): string => {
	const name = value?.assignedTrooperName
	return typeof name === 'string' && name.length > 0 ? name : 'Chưa cấp phát'
}

const unitRoomLabel = (value?: Record<string, unknown> | null): string => {
	const unitName = value?.unitName
	const roomName = value?.roomName
	const unitPart =
		typeof unitName === 'string' && unitName.length > 0
			? unitName
			: 'Không rõ đơn vị'
	const roomPart =
		typeof roomName === 'string' && roomName.length > 0
			? roomName
			: 'Không có phòng'
	return `${unitPart} / ${roomPart}`
}

function EventDetail({ event }: { event: MaterialAssetEvent }) {
	switch (event.eventType) {
		case 'assigned':
		case 'unassigned':
			return (
				<p className='text-sm'>
					Từ:{' '}
					<span className='font-medium'>
						{trooperLabel(event.previousValue)}
					</span>{' '}
					→ Đến:{' '}
					<span className='font-medium'>
						{trooperLabel(event.newValue)}
					</span>
				</p>
			)
		case 'transferred':
			return (
				<p className='text-sm'>
					Từ:{' '}
					<span className='font-medium'>
						{unitRoomLabel(event.previousValue)}
					</span>{' '}
					→ Đến:{' '}
					<span className='font-medium'>
						{unitRoomLabel(event.newValue)}
					</span>
				</p>
			)
		case 'condition_changed': {
			const conditionLabel = (value?: Record<string, unknown> | null) => {
				const raw = value?.condition
				if (typeof raw !== 'string') {
					return '—'
				}
				return materialConditionLabels[raw] ?? raw
			}
			return (
				<p className='text-sm'>
					Từ:{' '}
					<span className='font-medium'>
						{conditionLabel(event.previousValue)}
					</span>{' '}
					→ Đến:{' '}
					<span className='font-medium'>
						{conditionLabel(event.newValue)}
					</span>
				</p>
			)
		}
		case 'status_changed': {
			const statusLabel = (value?: Record<string, unknown> | null) => {
				const raw = value?.status
				if (typeof raw !== 'string') {
					return '—'
				}
				return materialAssetStatusLabels[raw] ?? raw
			}
			return (
				<p className='text-sm'>
					Từ:{' '}
					<span className='font-medium'>
						{statusLabel(event.previousValue)}
					</span>{' '}
					→ Đến:{' '}
					<span className='font-medium'>
						{statusLabel(event.newValue)}
					</span>
				</p>
			)
		}
		default:
			return null
	}
}

interface MaterialAssetHistorySheetProps {
	assetId?: number
	open: boolean
	onOpenChange: (open: boolean) => void
}

export default function MaterialAssetHistorySheet({
	assetId,
	open,
	onOpenChange
}: MaterialAssetHistorySheetProps) {
	const { data: events } = useMaterialAssetEvents(assetId, { enabled: open })

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className='w-full sm:max-w-lg'>
				<SheetHeader>
					<SheetTitle>Lịch sử khí tài</SheetTitle>
				</SheetHeader>
				<div className='px-4 pb-4 space-y-3'>
					{events?.length === 0 && (
						<p className='text-muted-foreground text-sm'>
							Chưa có lịch sử thay đổi.
						</p>
					)}
					{events?.map((ev) => (
						<div
							key={ev.id}
							className='rounded-md border p-3 space-y-1'
						>
							<div className='flex items-center justify-between'>
								<Badge variant='secondary'>
									{eventTypeLabels[ev.eventType]}
								</Badge>
								<span className='text-xs text-muted-foreground'>
									{new Date(ev.createdAt).toLocaleString(
										'vi-VN'
									)}
								</span>
							</div>
							<EventDetail event={ev} />
							{ev.note && <p className='text-sm'>{ev.note}</p>}
							{ev.actor?.displayName && (
								<p className='text-xs text-muted-foreground'>
									Thực hiện bởi: {ev.actor.displayName}
								</p>
							)}
						</div>
					))}
				</div>
			</SheetContent>
		</Sheet>
	)
}
