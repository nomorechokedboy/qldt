import { toDdMmYyyy } from '@/common'
import type { ReactNode } from 'react'

// One labelled value of a record that is only being read.
export function Fact({ label, value }: { label: string; value?: ReactNode }) {
	const empty = value === undefined || value === null || value === ''

	return (
		<div className='space-y-0.5'>
			<dt className='text-sm text-muted-foreground'>{label}</dt>
			<dd className={empty ? 'text-muted-foreground' : 'font-medium'}>
				{empty ? '-' : value}
			</dd>
		</div>
	)
}

export function Facts({
	children,
	columns = 2
}: {
	children: ReactNode
	columns?: 1 | 2 | 3
}) {
	const cols = {
		1: 'grid-cols-1',
		2: 'grid-cols-1 sm:grid-cols-2',
		3: 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
	}
	return (
		<dl className={`grid gap-x-5 gap-y-4 ${cols[columns]}`}>{children}</dl>
	)
}

// Dates are stored as ISO but read as day/month/year.
export const dateText = (value?: string | null) =>
	value ? toDdMmYyyy(value) : undefined

export function EmptyNote({ children }: { children: string }) {
	return (
		<p className='rounded-md border border-dashed px-4 py-5 text-center text-sm text-muted-foreground'>
			{children}
		</p>
	)
}
