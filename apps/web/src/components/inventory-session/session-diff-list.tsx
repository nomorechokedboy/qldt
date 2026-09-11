import { Badge } from '@/components/ui/badge'
import type { inventory_sessions } from '@/api/client'
import { AssetDiffColor, AssetDiffStatusIcon } from './diff-status'
import { DIFF_STATUS_LABEL } from './diff-status-labels'
import {
	materialConditionColors,
	materialConditionLabels
} from '@/data/material-categories'
import { cn } from '@/lib/utils'

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
					<div className='flex flex-col gap-2'>
						<span className='font-mono'>{item.serial}</span>
						<span className='font-mono'>
							Tình trạng dự kiến:{' '}
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
									: 'Không có'}
							</Badge>
						</span>
						<span className='font-mono'>
							Tình trạng thực tế:{' '}
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
									: 'Không có'}
							</Badge>
						</span>
					</div>
					<Badge
						className={AssetDiffColor(item.status)}
						variant={DIFF_STATUS_LABEL[item.status].variant}
					>
						{DIFF_STATUS_LABEL[item.status].label}
						<AssetDiffStatusIcon status={item.status} />
					</Badge>
				</div>
			))}
		</div>
	)
}
