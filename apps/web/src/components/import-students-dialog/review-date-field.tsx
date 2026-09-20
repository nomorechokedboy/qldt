import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
	Popover,
	PopoverContent,
	PopoverTrigger
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import dayjs from 'dayjs'
import { CalendarIcon } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { reviewInputClass } from './review-input-class'

// Standalone Calendar+Popover date field that speaks the same "YYYY-MM-DD"
// value convention as the backend directly - same pattern as
// ActivityStatusDateField/RankPromotionDateField. Deliberately NOT the
// tanstack-react-form-bound `DatePicker` field component: that one edits a
// dd/mm/yyyy display string via `useFieldContext` and only converts to ISO
// at form submit time, which requires a form context this plain-useState
// review table doesn't have. A raw <input type="date"> would sidestep that,
// but renders per-browser/OS locale and silently blanks out on any value
// that isn't an exact YYYY-MM-DD string, unlike this component's explicit
// dayjs parsing.
export function ReviewDateField({
	value,
	onChange
}: {
	value: string | null | undefined
	onChange: (value: string | undefined) => void
}) {
	const { t } = useTranslation('io')
	const [open, setOpen] = useState(false)
	const parsed = value ? dayjs(value, 'YYYY-MM-DD') : undefined
	const selectedDate =
		parsed && parsed.isValid() ? parsed.toDate() : undefined

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					type='button'
					variant='outline'
					className={cn(
						reviewInputClass,
						'justify-start text-left font-normal',
						!selectedDate && 'text-muted-foreground'
					)}
				>
					<CalendarIcon className='mr-2 h-4 w-4 shrink-0' />
					{selectedDate
						? dayjs(selectedDate).format('DD/MM/YYYY')
						: t('importDialog.cells.pickDate')}
				</Button>
			</PopoverTrigger>
			<PopoverContent className='w-auto p-0' align='start'>
				<Calendar
					mode='single'
					captionLayout='dropdown'
					selected={selectedDate}
					onSelect={(date) => {
						onChange(
							date ? dayjs(date).format('YYYY-MM-DD') : undefined
						)
						setOpen(false)
					}}
				/>
			</PopoverContent>
		</Popover>
	)
}
