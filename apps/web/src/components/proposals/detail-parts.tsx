import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { itemStatusLabel } from './status'

// A label/value pair in the detail sheet's two-column grid.
export function DetailRow({
	label,
	children
}: {
	label: string
	children: ReactNode
}) {
	return (
		<>
			<span className='text-muted-foreground'>{label}</span>
			<span>{children}</span>
		</>
	)
}

export function ItemSection({
	title,
	children
}: {
	title: string
	children: ReactNode
}) {
	return (
		<div>
			<h4 className='mb-1 text-sm font-medium'>{title}</h4>
			<ul className='space-y-1 text-sm'>{children}</ul>
		</div>
	)
}

// One line of an item list: what it is, how it went, and optionally a second
// line of details.
export function ItemRow({
	label,
	itemStatus,
	failureReason,
	children
}: {
	label: ReactNode
	itemStatus: string
	failureReason: string | null
	children?: ReactNode
}) {
	const { t } = useTranslation('proposals')

	return (
		<li className='flex flex-col gap-1 rounded-md border p-2'>
			<div className='flex items-center justify-between'>
				<span>{label}</span>
				<span className='flex items-center gap-2'>
					<Badge variant='outline'>
						{itemStatusLabel(t, itemStatus)}
					</Badge>
					{failureReason && (
						<span className='text-xs text-destructive'>
							{failureReason}
						</span>
					)}
				</span>
			</div>
			{children}
		</li>
	)
}
