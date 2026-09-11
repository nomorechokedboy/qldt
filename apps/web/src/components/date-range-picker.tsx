import { useState } from 'react'
import { CalendarIcon } from 'lucide-react'
import type { DateRange } from 'react-day-picker'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
	Popover,
	PopoverContent,
	PopoverTrigger
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

function formatDisplayDate(date: Date): string {
	const day = date.getDate().toString().padStart(2, '0')
	const month = (date.getMonth() + 1).toString().padStart(2, '0')
	return `${day}/${month}/${date.getFullYear()}`
}

export interface DateRangePickerProps {
	value: DateRange | undefined
	onChange: (range: DateRange | undefined) => void
	placeholder?: string
	className?: string
}

// A single trigger button that opens a two-month range calendar, for any
// caller that needs a from/to filter (e.g. a history list) without wiring
// up two separate date inputs and their own Popover/Calendar plumbing.
export default function DateRangePicker({
	value,
	onChange,
	placeholder = 'Chọn khoảng ngày',
	className
}: DateRangePickerProps) {
	const [open, setOpen] = useState(false)

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant='outline'
					className={cn(
						'h-8 w-[220px] justify-start text-left font-normal',
						!value?.from && 'text-muted-foreground',
						className
					)}
				>
					<CalendarIcon className='mr-1 size-3.5' />
					{value?.from ? (
						value.to ? (
							<>
								{formatDisplayDate(value.from)} -{' '}
								{formatDisplayDate(value.to)}
							</>
						) : (
							formatDisplayDate(value.from)
						)
					) : (
						<span>{placeholder}</span>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className='w-auto p-0' align='start'>
				<Calendar
					mode='range'
					selected={value}
					onSelect={onChange}
					numberOfMonths={2}
					captionLayout='dropdown'
				/>
				{value?.from && (
					<div className='flex justify-end border-t p-2'>
						<Button
							variant='ghost'
							size='sm'
							onClick={() => {
								onChange(undefined)
								setOpen(false)
							}}
						>
							Xoá khoảng ngày
						</Button>
					</div>
				)}
			</PopoverContent>
		</Popover>
	)
}
