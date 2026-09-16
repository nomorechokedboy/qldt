import { EllipsisText } from '@/components/data-table/ellipsis-text'
import { Button } from '@/components/ui/button'
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList
} from '@/components/ui/command'
import {
	Popover,
	PopoverContent,
	PopoverTrigger
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { Check, ChevronsUpDown } from 'lucide-react'
import { useMemo, useState } from 'react'
import { reviewInputClass } from './review-input-class'

// Searchable, grouped picker for review-table cells backed by a large
// catalog (positions span every unit level) - a flat native <select> makes
// finding the right one impractical once the list grows past a handful of
// entries, since there's no way to filter and same-named options across
// different levels/groups are indistinguishable without scrolling.
export function ReviewComboboxCell({
	value,
	onChange,
	options,
	placeholder
}: {
	value: string
	onChange: (value: string) => void
	options: { value: string; label: string; group?: string }[]
	placeholder: string
}) {
	const [open, setOpen] = useState(false)
	const selected = options.find((o) => o.value === value)

	const grouped = useMemo(() => {
		const groups: { group: string; options: typeof options }[] = []
		const bucketByGroup = new Map<string, number>()
		options.forEach((o) => {
			const key = o.group ?? ''
			const idx = bucketByGroup.get(key)
			if (idx !== undefined) {
				groups[idx].options.push(o)
			} else {
				bucketByGroup.set(key, groups.length)
				groups.push({ group: key, options: [o] })
			}
		})
		return groups
	}, [options])

	return (
		<Popover open={open} onOpenChange={setOpen} modal={true}>
			<PopoverTrigger asChild>
				<Button
					type='button'
					variant='outline'
					role='combobox'
					aria-expanded={open}
					className={cn(
						reviewInputClass,
						'justify-between font-normal'
					)}
				>
					<EllipsisText
						className={cn(!selected && 'text-muted-foreground')}
						maxWidth='160px'
					>
						{selected?.label ?? placeholder}
					</EllipsisText>
					<ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
				</Button>
			</PopoverTrigger>
			<PopoverContent className='w-[280px] p-0'>
				<Command>
					<CommandInput placeholder='Tìm kiếm...' />
					<CommandList>
						<CommandEmpty>Không tìm thấy.</CommandEmpty>
						<ScrollArea className='max-h-64'>
							{grouped.map(({ group, options: opts }) => (
								<CommandGroup
									key={group || '_'}
									heading={group || undefined}
								>
									{opts.map((o) => (
										<CommandItem
											key={o.value}
											value={o.value}
											keywords={[o.label]}
											onSelect={() => {
												onChange(o.value)
												setOpen(false)
											}}
										>
											<Check
												className={cn(
													'mr-2 h-4 w-4',
													value === o.value
														? 'opacity-100'
														: 'opacity-0'
												)}
											/>
											{o.label}
										</CommandItem>
									))}
								</CommandGroup>
							))}
						</ScrollArea>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	)
}
