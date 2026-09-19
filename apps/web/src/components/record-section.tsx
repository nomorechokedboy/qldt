import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

// A titled group of related fields in the create wizard.
export function RecordSection({
	title,
	hint,
	children
}: {
	title: string
	hint?: string
	children: ReactNode
}) {
	return (
		<section className='space-y-4'>
			<div className='border-b pb-2'>
				<h3 className='font-serif text-lg font-semibold'>{title}</h3>
				{hint && (
					<p className='text-sm text-muted-foreground'>{hint}</p>
				)}
			</div>
			{children}
		</section>
	)
}

const columns = {
	1: 'grid-cols-1',
	2: 'grid-cols-1 sm:grid-cols-2',
	3: 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
}

export function RecordGrid({
	columns: count = 2,
	children
}: {
	columns?: keyof typeof columns
	children: ReactNode
}) {
	return (
		<div className={cn('grid gap-x-5 gap-y-4', columns[count])}>
			{children}
		</div>
	)
}

// A step's stack of sections.
export function StepBody({ children }: { children: ReactNode }) {
	return <div className='space-y-8'>{children}</div>
}
