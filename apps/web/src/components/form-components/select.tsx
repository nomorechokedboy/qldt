import { GroupedSelectItems } from '@/components/ui/grouped-select-items'
import * as ShadcnSelect from '@/components/ui/select'
import { useFieldContext } from '@/hooks/form-context'
import { FieldFrame } from './field-frame'

export function Select({
	label,
	values,
	placeholder,
	onChange
}: {
	label: string
	values: Array<{ label: string; value: string; group?: string }>
	placeholder?: string
	// Accepted for compatibility; the field's own value drives the selection.
	defaultValue?: string
	onChange?: (value: string) => void
}) {
	const field = useFieldContext<string>()

	return (
		<FieldFrame label={label} htmlFor={field.name}>
			<ShadcnSelect.Select
				name={field.name}
				value={field.state.value}
				onValueChange={(value) => {
					field.handleChange(value)
					onChange?.(value)
				}}
			>
				<ShadcnSelect.SelectTrigger id={field.name} className='w-full'>
					<ShadcnSelect.SelectValue placeholder={placeholder} />
				</ShadcnSelect.SelectTrigger>
				<ShadcnSelect.SelectContent>
					<GroupedSelectItems
						options={values}
						ungroupedLabel={label}
					/>
				</ShadcnSelect.SelectContent>
			</ShadcnSelect.Select>
		</FieldFrame>
	)
}
