import { Check, ChevronsUpDown } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
import { useFieldContext } from '@/hooks/form-context'
import { cn } from '@/lib/utils'
import { FieldFrame } from './field-frame'

export function Combobox({
	label,
	values,
	placeholder = 'Select option...',
	onChange
}: {
	label: string
	values: Array<{ label: string; value: string }>
	placeholder?: string
	// Accepted for compatibility; the field's own value drives the selection.
	defaultValue?: string
	onChange?: (value: string) => void
}) {
	const { t } = useTranslation('common')
	const [open, setOpen] = useState(false)
	const field = useFieldContext<string>()

	const selectedValue = field.state.value
	const selectedLabel = values.find(
		(item) => item.value === selectedValue
	)?.label

	// Picking the selected option again clears the field.
	const select = (currentValue: string) => {
		const newValue = currentValue === selectedValue ? '' : currentValue
		field.handleChange(newValue)
		onChange?.(newValue)
		setOpen(false)
	}

	return (
		<FieldFrame label={label} htmlFor={label}>
			<Popover open={open} onOpenChange={setOpen} modal={true}>
				<PopoverTrigger asChild>
					<Button
						variant='outline'
						role='combobox'
						aria-expanded={open}
						className='w-full justify-between bg-transparent'
					>
						{selectedLabel || placeholder}
						<ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
					</Button>
				</PopoverTrigger>
				<PopoverContent className='w-full p-0'>
					<Command>
						<CommandInput
							placeholder={t('form.searchPlaceholder', {
								label: label.toLowerCase()
							})}
						/>
						<CommandList>
							<CommandEmpty>No option found.</CommandEmpty>
							<CommandGroup>
								<ScrollArea>
									{values.map((item) => (
										<CommandItem
											key={item.value}
											value={item.value}
											keywords={[item.label]}
											onSelect={select}
										>
											<Check
												className={cn(
													'mr-2 h-4 w-4',
													selectedValue === item.value
														? 'opacity-100'
														: 'opacity-0'
												)}
											/>
											{item.label}
										</CommandItem>
									))}
								</ScrollArea>
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
		</FieldFrame>
	)
}
