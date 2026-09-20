import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import type { inventory_sessions } from '@/api/client'
import {
	materialConditionColors,
	materialConditionLabels
} from '@/data/material-categories'
import { StockDiffColor, StockDiffStatusIcon } from './diff-status'
import { STOCK_DIFF_STATUS_VARIANT } from './diff-status-labels'
import { cn } from '@/lib/utils'

interface InventorySessionStockDiffListProps {
	stockDiff: inventory_sessions.InventorySessionStockDiffItem[]
}

// Sibling to InventorySessionDiffList (session-diff-list.tsx) for the
// bulk-stock half of a session's review - quantity variance instead of
// per-serial identity. Shows the resolved material type name where
// available; an `extra` line (a materialTypeId/condition combo present only
// in the phone's counts) has no name to join against, so it falls back to
// the raw id. See
// docs/superpowers/specs/2026-09-10-inventory-session-stock-counts-design.md.
export default function InventorySessionStockDiffList({
	stockDiff
}: InventorySessionStockDiffListProps) {
	const { t } = useTranslation('materials')
	if (stockDiff.length === 0) {
		return (
			<p className='text-muted-foreground text-sm text-center'>
				{t('inventory.stockDiff.empty')}
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
							{item.materialTypeName ?? `#${item.materialTypeId}`}{' '}
							<Badge
								className={cn(
									materialConditionColors[item.condition],
									'inline'
								)}
							>
								{materialConditionLabels[item.condition]}
							</Badge>
						</span>
						<span className='text-muted-foreground text-xs'>
							{t('inventory.stockDiff.quantities', {
								expected: item.expectedQuantity ?? '0',
								observed: item.observedQuantity
							})}
						</span>
					</div>
					<Badge
						className={StockDiffColor(item.status)}
						variant={STOCK_DIFF_STATUS_VARIANT[item.status]}
					>
						{t(`inventory.stockDiffStatus.${item.status}`)}
						<StockDiffStatusIcon status={item.status} />
					</Badge>
				</div>
			))}
		</div>
	)
}
