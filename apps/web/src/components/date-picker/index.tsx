import dayjs from 'dayjs'
import { CalendarIcon } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, ClipboardEvent, KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '@tanstack/react-form'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Popover,
	PopoverContent,
	PopoverTrigger
} from '@/components/ui/popover'
import { useFieldContext } from '@/hooks/form-context'
import { ErrorMessages } from '../form-components'
import { applyDateEdit, parsePastedDate } from './date-mask'
import { formatDate, parseDate, validateDateFormat } from './parse-date'

export interface DatePickerProps {
	label: string
	placeholder?: string
}

const endMonth = new Date(dayjs().year() + 10, 11)

export default function DatePicker({ label, placeholder }: DatePickerProps) {
	const { t } = useTranslation('stats')
	const field = useFieldContext<string>()
	const errors = useStore(field.store, (state) => state.meta.errors)
	const [open, setOpen] = useState(false)
	const inputRef = useRef<HTMLInputElement>(null)
	// Format problems with the typed text, checked on blur (not while typing).
	const [localError, setLocalError] = useState<string | null>(null)

	const currentDate = useMemo(
		() => parseDate(field.state.value),
		[field.state.value]
	)

	// The month the calendar shows; follows the value whenever it is a date.
	const [month, setMonth] = useState<Date | undefined>(
		currentDate || new Date()
	)
	useEffect(() => {
		if (currentDate) {
			setMonth(currentDate)
		}
	}, [currentDate])

	// Sets the text and shows the date it spells, if it spells one.
	const commit = (value: string, cursor: number) => {
		field.handleChange(value)
		// No real-time validation while the user is still typing.
		setLocalError(null)

		const date = parseDate(value)
		if (date) {
			setMonth(date)
		}

		// The text was rewritten, so put the caret back where it belongs.
		setTimeout(() => {
			inputRef.current?.setSelectionRange(cursor, cursor)
		}, 0)
	}

	const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
		const { value, cursor } = applyDateEdit(
			field.state.value,
			e.target.value
		)
		commit(value, cursor)
	}

	// A whole date pasted in (any common shape) replaces the field's text.
	const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
		const pasted = parsePastedDate(e.clipboardData.getData('text'))
		if (pasted === null) return

		e.preventDefault()
		commit(pasted, pasted.length)
	}

	const handleBlur = () => {
		field.handleBlur()
		setLocalError(validateDateFormat(field.state.value, label))
	}

	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'ArrowDown') {
			e.preventDefault()
			setOpen(true)
		}
	}

	const handleDateSelect = (date: Date | undefined) => {
		if (date) {
			field.handleChange(formatDate(date))
			setMonth(date)
			setLocalError(null)
		}
		setOpen(false)
	}

	const allErrors = [...(Array.isArray(errors) ? errors : [])]
	if (localError) allErrors.push(localError)

	return (
		<div className='flex flex-col gap-2'>
			<Label htmlFor={field.name} className='text-xl font-bold'>
				{label}
			</Label>
			<div className='relative flex gap-2'>
				<Input
					ref={inputRef}
					id={field.name}
					value={field.state.value}
					placeholder={placeholder || t('datePicker.placeholder')}
					className='bg-background pr-10'
					onBlur={handleBlur}
					onChange={handleInputChange}
					onKeyDown={handleKeyDown}
					onPaste={handlePaste}
					maxLength={10} // dd/mm/yyyy = 10 characters
				/>
				<Popover open={open} onOpenChange={setOpen}>
					<PopoverTrigger asChild>
						<Button
							type='button'
							variant='ghost'
							className='absolute top-1 right-2 size-6'
						>
							<CalendarIcon className='size-3.5' />
							<span className='sr-only'>Select date</span>
						</Button>
					</PopoverTrigger>
					<PopoverContent
						className='w-auto overflow-hidden p-0'
						align='end'
						alignOffset={-8}
						sideOffset={10}
					>
						<Calendar
							mode='single'
							selected={currentDate}
							captionLayout='dropdown'
							month={month}
							onMonthChange={setMonth}
							onSelect={handleDateSelect}
							endMonth={endMonth}
						/>
					</PopoverContent>
				</Popover>
			</div>
			{field.state.meta.isTouched && allErrors.length > 0 && (
				<ErrorMessages errors={allErrors} />
			)}
		</div>
	)
}
