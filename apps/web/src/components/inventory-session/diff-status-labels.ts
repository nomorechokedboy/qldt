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

export const STOCK_DIFF_STATUS_LABEL: Record<
	inventory_sessions.InventorySessionStockDiffStatus,
	{
		label: string
		variant: 'default' | 'destructive' | 'secondary' | 'outline'
	}
> = {
	matched: { label: 'Khớp', variant: 'default' },
	short: { label: 'Thiếu', variant: 'destructive' },
	over: { label: 'Dư', variant: 'default' },
	extra: { label: 'Phát sinh', variant: 'outline' }
}
