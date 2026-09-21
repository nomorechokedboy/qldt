import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
	Popover,
	PopoverContent,
	PopoverTrigger
} from '@/components/ui/popover'

interface TrooperOverridePopoverProps {
	name: string
	// What this trooper gets instead of the shared values, e.g. "Đại úy ·
	// 01/10/2026"; undefined while they follow the shared ones.
	summary: string | undefined
	customizeLabel: string
	useSharedLabel: string
	onUseShared: () => void
	// The editor for the trooper's own values.
	children: ReactNode
}

// A selected trooper's own values live behind a small button on their row, so
// editing them never reflows the list. Once set, the button itself shows
// them.
export default function TrooperOverridePopover({
	name,
	summary,
	customizeLabel,
	useSharedLabel,
	onUseShared,
	children
}: TrooperOverridePopoverProps) {
	const { t } = useTranslation('proposals')

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					type='button'
					variant={summary ? 'secondary' : 'ghost'}
					size='sm'
					className='h-7 max-w-[55%] shrink-0 gap-1 px-2 text-xs'
					aria-label={`${customizeLabel}: ${name}`}
				>
					<SlidersHorizontal className='size-3 shrink-0' />
					<span className='truncate'>
						{summary
							? t('common.overrideChip', { value: summary })
							: customizeLabel}
					</span>
				</Button>
			</PopoverTrigger>
			<PopoverContent align='end' className='w-72 space-y-3'>
				<p className='text-sm font-medium'>{name}</p>
				{children}
				{summary && (
					<Button
						type='button'
						variant='link'
						size='sm'
						className='h-auto p-0 text-xs'
						onClick={onUseShared}
					>
						{useSharedLabel}
					</Button>
				)}
			</PopoverContent>
		</Popover>
	)
}
