import type { inventory_sessions } from '@/api/client'

type BadgeVariant = 'default' | 'destructive' | 'secondary' | 'outline'

// Only the badge styling lives here; the wording is translated at the call
// site as `materials:inventory.diffStatus.<status>`.
export const DIFF_STATUS_VARIANT: Record<
	inventory_sessions.InventorySessionDiffStatus,
	BadgeVariant
> = {
	matched: 'secondary',
	missing: 'destructive',
	extra: 'outline',
	condition_changed: 'default'
}

export const STOCK_DIFF_STATUS_VARIANT: Record<
	inventory_sessions.InventorySessionStockDiffStatus,
	BadgeVariant
> = {
	matched: 'default',
	short: 'destructive',
	over: 'default',
	extra: 'outline'
}
