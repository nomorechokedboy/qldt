import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type React from 'react'
import {
	ComboboxEditor,
	DateEditor,
	SelectEditor,
	TextEditor,
	formatDate
} from './editors'
import { optionLabel } from './options'
import { DisplayValue, EditActions } from './parts'
import type { InputType, PendingValue, ToggleInputProps } from './types'

export type { InputType, ToggleInputProps } from './types'

// What an untouched field holds: nothing for a date, an empty string for the
// rest.
const emptyValue = (type: InputType): PendingValue =>
	type === 'date' ? null : ''

// A value that reads as text in the resting state.
function displayText(
	props: ToggleInputProps,
	value: PendingValue,
	placeholder: ReactNode
): ReactNode {
	if (!value) return placeholder

	switch (props.type) {
		case 'date':
			return formatDate(value as Date, props.dateFormat)
		case 'select':
		case 'combobox':
			return optionLabel(props.options, value as string)
		default:
			return value as string
	}
}

export default function ToggleInput<T extends InputType>(
	genericProps: ToggleInputProps<T>
) {
	const props = genericProps as ToggleInputProps
	const {
		id,
		type,
		initialValue,
		placeholder: placeholderProp,
		onSave,
		onChange,
		onCancel,
		className = '',
		disabled = false,
		readOnly = false,
		isLoading = false,
		ellipsisMaxWidth
	} = props

	const { t } = useTranslation('table')
	const placeholder = placeholderProp ?? t('toggleInput.clickToEdit')
	const [isEditing, setIsEditing] = useState(false)
	const [value, setValue] = useState<PendingValue>(
		initialValue ?? emptyValue(type)
	)
	// What the editor shows; only becomes `value` on save.
	const [tempValue, setTempValue] = useState<PendingValue>(
		initialValue ?? emptyValue(type)
	)
	// The date and combobox editors open a popover.
	const [isPopoverOpen, setIsPopoverOpen] = useState(false)

	// Sync with initialValue changes
	useEffect(() => {
		setValue(initialValue ?? emptyValue(type))
		setTempValue(initialValue ?? emptyValue(type))
	}, [initialValue, type])

	const finishEditing = () => {
		setIsEditing(false)
		setIsPopoverOpen(false)
	}

	const handleSave = () => {
		setValue(tempValue)
		finishEditing()
		;(onSave as ((value: PendingValue) => void) | undefined)?.(tempValue)
	}

	const handleCancel = () => {
		setTempValue(value)
		finishEditing()
		onCancel?.()
	}

	const startEditing = () => {
		setIsEditing(true)
		setTempValue(value)
		if (type === 'date' || type === 'combobox') {
			setIsPopoverOpen(true)
		}
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !isLoading && type === 'text') {
			handleSave()
		} else if (e.key === 'Escape' && !isLoading) {
			handleCancel()
		}
	}

	// Every editor reports its new value the same way: remembered as pending
	// and announced immediately, for real-time validation.
	const handleChange = (newValue: PendingValue) => {
		setTempValue(newValue)
		onChange?.(newValue)
	}

	const renderEditor = () => {
		const shared = {
			onKeyDown: handleKeyDown,
			disabled: disabled || isLoading,
			placeholder
		}
		const popover = {
			open: isPopoverOpen,
			onOpenChange: setIsPopoverOpen
		}

		switch (props.type) {
			case 'text':
				return (
					<TextEditor
						{...shared}
						id={id}
						value={(tempValue as string) || ''}
						onChange={handleChange}
					/>
				)
			case 'date':
				return (
					<DateEditor
						{...shared}
						{...popover}
						value={tempValue as Date | null}
						onChange={handleChange}
						dateFormat={props.dateFormat}
					/>
				)
			case 'select':
				return (
					<SelectEditor
						{...shared}
						value={(tempValue as string) || ''}
						onChange={handleChange}
						options={props.options}
					/>
				)
			case 'combobox':
				return (
					<ComboboxEditor
						{...shared}
						{...popover}
						value={tempValue as string}
						onChange={handleChange}
						options={props.options}
						searchPlaceholder={props.searchPlaceholder}
						emptyMessage={props.emptyMessage}
					/>
				)
			default:
				return null
		}
	}

	if (isEditing) {
		return (
			<div className={`flex items-center gap-2 ${className}`}>
				{renderEditor()}
				<EditActions
					onSave={handleSave}
					onCancel={handleCancel}
					disabled={disabled}
					isLoading={isLoading}
				/>
			</div>
		)
	}

	return (
		<DisplayValue
			isEmpty={!value}
			type={type}
			onDoubleClick={startEditing}
			readOnly={readOnly}
			disabled={disabled}
			isLoading={isLoading}
			className={className}
			ellipsisMaxWidth={ellipsisMaxWidth}
		>
			{displayText(props, value, placeholder)}
		</DisplayValue>
	)
}
