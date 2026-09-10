import { Badge } from '@/components/ui/badge'
import type { inventory_sessions } from '@/api/client'

export const STOCK_DIFF_STATUS_LABEL: Record<
	inventory_sessions.InventorySessionStockDiffStatus,
	{
		label: string
		variant: 'default' | 'destructive' | 'secondary' | 'outline'
	}
> = {
	matched: { label: 'Khớp', variant: 'secondary' },
	short: { label: 'Thiếu', variant: 'destructive' },
	over: { label: 'Dư', variant: 'default' },
	extra: { label: 'Phát sinh', variant: 'outline' }
}

interface InventorySessionStockDiffListProps {
	stockDiff: inventory_sessions.InventorySessionStockDiffItem[]
}

// Sibling to InventorySessionDiffList (session-diff-list.tsx) for the
// bulk-stock half of a session's review - quantity variance instead of
// per-serial identity. Displays raw materialTypeId rather than a resolved
// name, matching InventorySessionDiffList's own fidelity (it shows a raw
// `serial`, not a resolved asset description, either). See
// docs/superpowers/specs/2026-09-10-inventory-session-stock-counts-design.md.
export default function InventorySessionStockDiffList({
	stockDiff
}: InventorySessionStockDiffListProps) {
	if (stockDiff.length === 0) {
		return (
			<p className='text-muted-foreground text-sm text-center'>
				Không có vật tư kiểm kê theo số lượng.
			</p>
		)
	}

	return (
		<div className='space-y-2'>
			{stockDiff.map((item) => (
				<div
					key={`${item.materialTypeId}-${item.condition}`}
					className='flex items-center justify-between rounded-md border p-2 text-sm'
				>
					<div className='flex flex-col'>
						<span className='font-mono'>
							#{item.materialTypeId}
						</span>
						<span className='text-muted-foreground text-xs'>
							Dự kiến: {item.expectedQuantity ?? '-'} - Thực tế:{' '}
							{item.observedQuantity}
						</span>
					</div>
					<Badge
						variant={STOCK_DIFF_STATUS_LABEL[item.status].variant}
					>
						{STOCK_DIFF_STATUS_LABEL[item.status].label}
					</Badge>
				</div>
			))}
		</div>
	)
}
