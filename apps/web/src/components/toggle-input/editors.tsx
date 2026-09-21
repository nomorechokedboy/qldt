import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList
} from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import {
	Popover,
	PopoverContent,
	PopoverTrigger
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import dayjs from 'dayjs'
import { Calendar as CalendarIcon, Check, ChevronsUpDown } from 'lucide-react'
import type { KeyboardEventHandler, ReactNode } from 'react'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { groupOptions, optionLabel } from './options'
import type { Option } from './types'

const DEFAULT_DATE_FORMAT = 'MMMM D, YYYY'

export function formatDate(date: Date, format?: string) {
	return dayjs(date).format(format || DEFAULT_DATE_FORMAT)
}

// What every editor gets: the pending value and how to change it, plus the
// shared editing-state plumbing.
interface EditorProps<V> {
	value: V
	onChange: (value: V) => void
	onKeyDown: KeyboardEventHandler
	disabled: boolean
	placeholder: ReactNode
}

// Editors that open a popover are told whether it is open, because editing
// starts with it open and save/cancel close it.
interface PopoverEditorProps {
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function TextEditor({
	value,
	onChange,
	onKeyDown,
	disabled
}: Omit<EditorProps<string>, 'placeholder'>) {
	const inputRef = useRef<HTMLInputElement>(null)

	// Editing just started: put the caret to work.
	useEffect(() => {
		inputRef.current?.focus()
		inputRef.current?.select()
	}, [])

	return (
		<Input
			ref={inputRef}
			value={value}
			onChange={(e) => onChange(e.target.value)}
			onKeyDown={onKeyDown}
			className='flex-1'
			disabled={disabled}
		/>
	)
}

export function DateEditor({
	value,
	onChange,
	onKeyDown,
	disabled,
	placeholder,
	open,
	onOpenChange,
	dateFormat
}: EditorProps<Date | null> & PopoverEditorProps & { dateFormat?: string }) {
	return (
		<Popover open={open} onOpenChange={onOpenChange}>
			<PopoverTrigger asChild>
				<Button
					variant='outline'
					className={cn(
						'flex-1 justify-start text-left font-normal',
						!value && 'text-muted-foreground'
					)}
					disabled={disabled}
					onKeyDown={onKeyDown}
				>
					<CalendarIcon className='mr-2 h-4 w-4' />
					{value ? formatDate(value, dateFormat) : placeholder}
				</Button>
			</PopoverTrigger>
			<PopoverContent className='w-auto p-0' align='start'>
				<Calendar
					mode='single'
					selected={value || undefined}
					onSelect={(date) => {
						onChange(date || null)
						onOpenChange(false)
					}}
					initialFocus
				/>
			</PopoverContent>
		</Popover>
	)
}

export function SelectEditor({
	value,
	onChange,
	onKeyDown,
	disabled,
	placeholder,
	options
}: EditorProps<string> & { options: Option[] }) {
	const renderItem = (option: Option) => (
		<SelectItem key={option.value} value={option.value}>
			{option.label}
		</SelectItem>
	)

	return (
		<Select value={value} onValueChange={onChange}>
			<SelectTrigger
				className='flex-1'
				onKeyDown={onKeyDown}
				disabled={disabled}
			>
				<SelectValue placeholder={placeholder as string} />
			</SelectTrigger>
			<SelectContent>
				{groupOptions(options).map((group) =>
					group.group ? (
						<SelectGroup key={group.group}>
							<SelectLabel>{group.group}</SelectLabel>
							{group.options.map(renderItem)}
						</SelectGroup>
					) : (
						group.options.map(renderItem)
					)
				)}
			</SelectContent>
		</Select>
	)
}

export function ComboboxEditor({
	value,
	onChange,
	onKeyDown,
	disabled,
	placeholder,
	open,
	onOpenChange,
	options,
	searchPlaceholder,
	emptyMessage
}: EditorProps<string> &
	PopoverEditorProps & {
		options: Option[]
		searchPlaceholder?: string
		emptyMessage?: string
	}) {
	const { t } = useTranslation('table')

	return (
		<Popover open={open} onOpenChange={onOpenChange} modal={true}>
			<PopoverTrigger asChild>
				<Button
					variant='outline'
					role='combobox'
					aria-expanded={open}
					className={cn(
						'flex-1 justify-between font-normal',
						!value && 'text-muted-foreground'
					)}
					disabled={disabled}
					onKeyDown={onKeyDown}
				>
					{value ? optionLabel(options, value) : placeholder}
					<ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
				</Button>
			</PopoverTrigger>
			<PopoverContent className='w-full p-0'>
				<Command>
					<CommandInput
						placeholder={
							searchPlaceholder || t('toggleInput.search')
						}
					/>
					<CommandList>
						<CommandEmpty>
							{emptyMessage || t('toggleInput.noOptions')}
						</CommandEmpty>
						<ScrollArea>
							{groupOptions(options).map((group, idx) => (
								<CommandGroup
									key={group.group ?? idx}
									heading={group.group}
								>
									{group.options.map((option) => (
										<CommandItem
											key={option.value}
											value={option.value}
											onSelect={() => {
												onChange(option.value)
												onOpenChange(false)
											}}
										>
											<Check
												className={cn(
													'mr-2 h-4 w-4',
													value === option.value
														? 'opacity-100'
														: 'opacity-0'
												)}
											/>
											{option.label}
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
