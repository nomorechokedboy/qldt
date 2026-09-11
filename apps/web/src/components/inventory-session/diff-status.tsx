import type { inventory_sessions } from '@/api/client'
import {
	CircleAlert,
	CircleCheck,
	CircleMinus,
	CirclePlus,
	RefreshCw
} from 'lucide-react'

export function AssetDiffStatusIcon({
	status
}: {
	status: inventory_sessions.InventorySessionDiffStatus
}) {
	switch (status) {
		case 'condition_changed':
			return <RefreshCw />
		case 'missing':
			return <CircleMinus />
		case 'extra':
			return <CircleAlert />
		default:
			return <CircleCheck />
	}
}

export function StockDiffStatusIcon({
	status
}: {
	status: inventory_sessions.InventorySessionStockDiffStatus
}) {
	switch (status) {
		case 'over':
			return <CirclePlus />
		case 'short':
			return <CircleMinus />
		case 'extra':
			return <CircleAlert />
		default:
			return <CircleCheck />
	}
}

export function AssetDiffColor(
	status: inventory_sessions.InventorySessionDiffStatus
) {
	switch (status) {
		case 'condition_changed':
			return 'bg-yellow-50 text-yellow-700'
		case 'matched':
			return 'bg-green-50 text-green-700'
		case 'extra':
			return 'bg-blue-50 text-blue-700'
		default:
			return ''
	}
}

export function StockDiffColor(
	status: inventory_sessions.InventorySessionStockDiffStatus
) {
	switch (status) {
		case 'matched':
			return 'bg-green-50 text-green-700'
		case 'extra':
			return 'bg-blue-50 text-blue-700'
		case 'over':
			return 'bg-yellow-50 text-yellow-700'
		default:
			return ''
	}
}
