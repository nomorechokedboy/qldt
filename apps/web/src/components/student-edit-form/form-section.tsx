import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type SectionTone =
	| 'primary'
	| 'green'
	| 'yellow'
	| 'purple'
	| 'pink'
	| 'orange'
	| 'cyan'
	| 'teal'
	| 'indigo'
	| 'emerald'
	| 'amber'
	| 'rose'
	| 'slate'

// Full class names so Tailwind can see them.
const tones: Record<SectionTone, string> = {
	primary: 'border-primary bg-primary/5',
	green: 'border-green-500 bg-green-50 dark:bg-green-950/30',
	yellow: 'border-yellow-500 bg-yellow-50/30',
	purple: 'border-purple-500 bg-purple-50/30',
	pink: 'border-pink-500 bg-pink-50/30',
	orange: 'border-orange-500 bg-orange-50/30',
	cyan: 'border-cyan-500 bg-cyan-50/30',
	teal: 'border-teal-500 bg-teal-50/30',
	indigo: 'border-indigo-500 bg-indigo-50/30',
	emerald: 'border-emerald-500 bg-emerald-50/30',
	amber: 'border-amber-500 bg-amber-50/30',
	rose: 'border-rose-500 bg-rose-50/30',
	slate: 'border-slate-500 bg-slate-50/30'
}

export function FormSection({
	title,
	icon: Icon,
	tone,
	children
}: {
	title: string
	icon: LucideIcon
	tone: SectionTone
	children: ReactNode
}) {
	return (
		<div className={cn('border-l-4 pl-4 py-2 rounded-r', tones[tone])}>
			<h3 className='font-semibold mb-3 text-base flex items-center gap-2'>
				<Icon className='h-4 w-4' />
				{title}
			</h3>
			{children}
		</div>
	)
}

const columns = {
	1: 'grid-cols-1',
	2: 'grid-cols-1 md:grid-cols-2',
	3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
	4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
}

export function FieldGrid({
	columns: count = 3,
	children
}: {
	columns?: keyof typeof columns
	children: ReactNode
}) {
	return (
		<div className={cn('grid gap-4 text-sm', columns[count])}>
			{children}
		</div>
	)
}
