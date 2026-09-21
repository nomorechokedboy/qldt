import type { ReactNode } from 'react'

export type Option = {
	value: string
	label: string
	group?: string
}

export type InputType = 'text' | 'date' | 'select' | 'combobox'

// What the editing state holds while a value is pending: text/select/
// combobox work on strings, date on a Date (or nothing).
export type PendingValue = string | Date | null

// Base props that are common to all input types
type BaseToggleInputProps = {
	placeholder?: ReactNode
	className?: string
	disabled?: boolean
	// Shows the value as plain text: no hover affordance and no editing,
	// without the dimmed look of `disabled`.
	readOnly?: boolean
	isLoading?: boolean
	ellipsisMaxWidth?: string
	onChange?: (value: any) => void
	onCancel?: () => void
}

// Type-specific props using conditional types
export type TypeSpecificProps<T extends InputType> = T extends 'text'
	? {
			type: 'text'
			initialValue?: string
			onSave?: (value: string) => void
		}
	: T extends 'date'
		? {
				type: 'date'
				initialValue?: Date | null
				onSave?: (value: Date | null) => void
				dateFormat?: string
			}
		: T extends 'select'
			? {
					type: 'select'
					initialValue?: string
					onSave?: (value: string) => void
					options: Option[]
				}
			: T extends 'combobox'
				? {
						type: 'combobox'
						initialValue?: string
						onSave?: (value: string) => void
						options: Option[]
						searchPlaceholder?: string
						emptyMessage?: string
						allowCustomValue?: boolean
					}
				: never

// Final props type using generics
export type ToggleInputProps<T extends InputType = InputType> =
	BaseToggleInputProps & TypeSpecificProps<T>
