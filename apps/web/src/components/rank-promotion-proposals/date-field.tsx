import * as React from 'react'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import { CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
	Popover,
	PopoverContent,
	PopoverTrigger
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

// Small standalone date field (Calendar + Popover) that speaks the same
// "YYYY-MM-DD" value convention as the backend directly, so callers don't
// need the dd/mm/yyyy <-> ISO conversion the tanstack-react-form-bound
// `DatePicker` field component requires. Kept local to this feature since
// this form uses plain useState, not useAppForm (mirrors
// activity-status-proposals/date-field.tsx).
export default function RankPromotionDateField({
	value,
	onChange,
	placeholder
}: {
	value: string | null | undefined
	onChange: (value: string | undefined) => void
	placeholder?: string
}) {
	const { t } = useTranslation('proposals')
	const [open, setOpen] = React.useState(false)
	const selected = value ? dayjs(value, 'YYYY-MM-DD') : undefined
	const selectedDate =
		selected && selected.isValid() ? selected.toDate() : undefined

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					type='button'
					variant='outline'
					className={cn(
						'w-full justify-start text-left font-normal',
						!selectedDate && 'text-muted-foreground'
					)}
				>
					<CalendarIcon className='mr-2 h-4 w-4' />
					{selectedDate
						? dayjs(selectedDate).format('DD/MM/YYYY')
						: (placeholder ?? t('common.pickDate'))}
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
