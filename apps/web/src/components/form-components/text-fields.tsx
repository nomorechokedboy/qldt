import type { JSX } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea as ShadcnTextarea } from '@/components/ui/textarea'
import { useFieldContext } from '@/hooks/form-context'
import PasswordInput from '../password-input'
import ToggleInput from '../toggle-input'
import { FieldFrame } from './field-frame'

export type TextFieldProps = JSX.IntrinsicElements['input'] & {
	label: string
}

export function TextField({ label, className, ...inputProps }: TextFieldProps) {
	const field = useFieldContext<string>()
	const controlProps = {
		...inputProps,
		id: field.name,
		value: field.state.value,
		onBlur: field.handleBlur,
		onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
			field.handleChange(e.target.value)
	}

	return (
		<FieldFrame label={label} htmlFor={field.name} className={className}>
			{inputProps.type === 'password' ? (
				<PasswordInput {...controlProps} />
			) : (
				<Input {...controlProps} name={field.name} />
			)}
		</FieldFrame>
	)
}

export function TextArea({
	label,
	rows = 3
}: {
	label: string
	rows?: number
}) {
	const field = useFieldContext<string>()

	return (
		<FieldFrame label={label} htmlFor={field.name}>
			<ShadcnTextarea
				id={field.name}
				value={field.state.value}
				onBlur={field.handleBlur}
				rows={rows}
				onChange={(e) => field.handleChange(e.target.value)}
			/>
		</FieldFrame>
	)
}

export type EditableInputProps = JSX.IntrinsicElements['input'] & {
	label: string
	ellipsisMaxWidth?: string
}

export function EditableInput({
	label,
	className,
	ellipsisMaxWidth,
	...inputProps
}: EditableInputProps) {
	const field = useFieldContext<string>()

	return (
		<FieldFrame label={label} htmlFor={label} className={className}>
			<ToggleInput
				{...inputProps}
				type='text'
				initialValue={field.state.value}
				ellipsisMaxWidth={ellipsisMaxWidth}
				// Update form state immediately so errors clear as the user types.
				onChange={(value) => field.handleChange(value)}
				// Saving and cancelling both blur, which triggers validation.
				onSave={(value) => {
					field.handleChange(value)
					field.handleBlur()
				}}
				onCancel={() => field.handleBlur()}
			/>
		</FieldFrame>
	)
}
