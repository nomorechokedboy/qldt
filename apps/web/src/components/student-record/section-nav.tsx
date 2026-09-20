import { cn } from '@/lib/utils'
import { RECORD_SECTIONS as SECTIONS, type SectionId } from './sections'

interface SectionNavProps {
	current: SectionId
	onSelect: (id: SectionId) => void
}

// Sections can be edited in any order, so they get icons, not step numbers.
export function SectionList({ current, onSelect }: SectionNavProps) {
	return (
		<nav aria-label='Các mục'>
			<ul className='space-y-1 border-t border-sidebar-border pt-4'>
				{SECTIONS.map(({ id, label, hint, icon: Icon }) => (
					<li key={id}>
						<button
							type='button'
							aria-current={id === current ? 'page' : undefined}
							onClick={() => onSelect(id)}
							className={cn(
								'flex w-full items-center gap-3 rounded-md px-2 py-2 text-left outline-none transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-gold',
								id === current && 'bg-sidebar-accent'
							)}
						>
							<span
								className={cn(
									'flex size-7 shrink-0 items-center justify-center rounded-full',
									id === current
										? 'bg-gold text-gold-foreground'
										: 'border border-sidebar-foreground/40'
								)}
							>
								<Icon className='size-4' aria-hidden />
							</span>
							<span className='min-w-0'>
								<span className='block truncate text-sm font-medium'>
									{label}
								</span>
								<span className='block truncate text-xs text-sidebar-foreground/60'>
									{hint}
								</span>
							</span>
						</button>
					</li>
				))}
			</ul>
		</nav>
	)
}

export function SectionPills({ current, onSelect }: SectionNavProps) {
	return (
		<nav aria-label='Các mục' className='-mx-4 overflow-x-auto px-4 pb-1'>
			<ul className='flex w-max gap-2'>
				{SECTIONS.map(({ id, label, icon: Icon }) => (
					<li key={id}>
						<button
							type='button'
							aria-current={id === current ? 'page' : undefined}
							onClick={() => onSelect(id)}
							className={cn(
								'flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring',
								id === current
									? 'border-primary bg-primary text-primary-foreground'
									: 'bg-card'
							)}
						>
							<Icon className='size-3.5' aria-hidden />
							{label}
						</button>
					</li>
				))}
			</ul>
		</nav>
	)
}
