import { GroupedSelectItems } from '@/components/ui/grouped-select-items'
import * as ShadcnSelect from '@/components/ui/select'
import { useFieldContext } from '@/hooks/form-context'
import { FieldFrame } from './field-frame'
import { useDefaultValue } from './use-default-value'

export function Select({
	label,
	values,
	placeholder,
	defaultValue,
	onChange
}: {
	label: string
	values: Array<{ label: string; value: string; group?: string }>
	placeholder?: string
	// Chosen when the field starts out empty.
	defaultValue?: string
	onChange?: (value: string) => void
}) {
	const field = useFieldContext<string>()
	useDefaultValue(defaultValue)

	return (
		<FieldFrame label={label} htmlFor={field.name}>
			<ShadcnSelect.Select
				name={field.name}
				value={field.state.value}
				onValueChange={(value) => {
					// Radix also reports '' when the value is changed from outside
					// (a default, a form reset) before its own option list has caught
					// up; picking an option never yields ''. Ignoring it keeps the
					// field from being wiped by that echo.
					if (value === '') return
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
