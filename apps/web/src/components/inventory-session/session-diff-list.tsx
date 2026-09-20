import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import type { inventory_sessions } from '@/api/client'
import { AssetDiffColor, AssetDiffStatusIcon } from './diff-status'
import { DIFF_STATUS_VARIANT } from './diff-status-labels'
import {
	materialConditionColors,
	materialConditionLabels
} from '@/data/material-categories'
import { cn } from '@/lib/utils'

interface InventorySessionDiffListProps {
	diff: inventory_sessions.InventorySessionDiffItem[]
}

// Shared between the create-session flow's review step and the room's
// inventory history sheet, so a session's diff always reads the same
// way wherever it's shown.
export default function InventorySessionDiffList({
	diff
}: InventorySessionDiffListProps) {
	const { t } = useTranslation('materials')
	if (diff.length === 0) {
		return (
			<p className='text-muted-foreground text-sm text-center'>
				{t('inventory.diff.empty')}
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
					<div className='flex flex-col gap-2'>
						<span className='font-mono'>{item.serial}</span>
						<span className='font-mono'>
							{t('inventory.diff.expectedCondition')}{' '}
							<Badge
								className={cn(
									item.expectedCondition
										? materialConditionColors[
												item.expectedCondition
											]
										: '',
									'inline'
								)}
							>
								{item.expectedCondition
									? materialConditionLabels[
											item.expectedCondition
										]
									: t('inventory.diff.none')}
							</Badge>
						</span>
						<span className='font-mono'>
							{t('inventory.diff.observedCondition')}{' '}
							<Badge
								className={cn(
									item.observedCondition
										? materialConditionColors[
												item.observedCondition
											]
										: '',
									'inline'
								)}
							>
								{item.observedCondition
									? materialConditionLabels[
											item.observedCondition
										]
									: t('inventory.diff.none')}
							</Badge>
						</span>
					</div>
					<Badge
						className={AssetDiffColor(item.status)}
						variant={DIFF_STATUS_VARIANT[item.status]}
					>
						{t(`inventory.diffStatus.${item.status}`)}
						<AssetDiffStatusIcon status={item.status} />
					</Badge>
				</div>
			))}
		</div>
	)
}
