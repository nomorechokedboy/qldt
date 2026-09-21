import type { TFunction } from 'i18next'

export const STATUS_VALUES = [
	'pending',
	'approved',
	'rejected',
	'cancelled'
] as const

export type ProposalStatus = (typeof STATUS_VALUES)[number]

export function statusLabel(t: TFunction<'proposals'>, status: string): string {
	return (STATUS_VALUES as readonly string[]).includes(status)
		? t(`status.${status as ProposalStatus}`)
		: status
}

export const STATUS_BADGE_VARIANT: Record<
	string,
	'default' | 'secondary' | 'destructive' | 'outline'
> = {
	pending: 'outline',
	approved: 'default',
	rejected: 'destructive',
	cancelled: 'secondary'
}

const ITEM_STATUSES = ['pending', 'approved', 'failed'] as const

export function itemStatusLabel(
	t: TFunction<'proposals'>,
	status: string
): string {
	return (ITEM_STATUSES as readonly string[]).includes(status)
		? t(`itemStatus.${status as (typeof ITEM_STATUSES)[number]}`)
		: status
}
