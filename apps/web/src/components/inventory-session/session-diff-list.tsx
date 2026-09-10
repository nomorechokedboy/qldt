import { Badge } from '@/components/ui/badge'
import type { inventory_sessions } from '@/api/client'

export const DIFF_STATUS_LABEL: Record<
	inventory_sessions.InventorySessionDiffStatus,
	{
		label: string
		variant: 'default' | 'destructive' | 'secondary' | 'outline'
	}
> = {
	matched: { label: 'Khớp', variant: 'secondary' },
	missing: { label: 'Thiếu', variant: 'destructive' },
	extra: { label: 'Phát sinh', variant: 'outline' },
	condition_changed: { label: 'Đổi tình trạng', variant: 'default' }
}

interface InventorySessionDiffListProps {
	diff: inventory_sessions.InventorySessionDiffItem[]
}

// Shared between the create-session flow's review step and the room's
// "Lịch sử kiểm kê" history sheet, so a session's diff always reads the same
// way wherever it's shown.
export default function InventorySessionDiffList({
	diff
}: InventorySessionDiffListProps) {
	if (diff.length === 0) {
		return (
			<p className='text-muted-foreground text-sm text-center'>
				Không có dữ liệu chênh lệch.
			</p>
		)
	}

	return (
		<div className='space-y-2'>
			{diff.map((item) => (
				<div
					key={item.serial}
					className='flex items-center justify-between rounded-md border p-2 text-sm'
				>
					<span className='font-mono'>{item.serial}</span>
					<Badge variant={DIFF_STATUS_LABEL[item.status].variant}>
						{DIFF_STATUS_LABEL[item.status].label}
					</Badge>
				</div>
			))}
		</div>
	)
}
