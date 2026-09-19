import { useStudentForm } from './student-form-context'

export interface SelectOption {
	label: string
	value: string
	group?: string
}

type StudentFieldProps = { name: string; label: string } & (
	| { kind?: 'text' | 'number' | 'date' | 'switch' }
	| { kind: 'select'; options: SelectOption[] }
)

// One input per field, chosen by the declared kind so a value's runtime type
// never decides which control is shown.
export default function StudentField(props: StudentFieldProps) {
	const form = useStudentForm()
	const { name, label } = props

	return (
		<form.AppField name={name}>
			{(field: any) => {
				switch (props.kind) {
					case 'switch':
						return <field.Switch label={label} />
					case 'date':
						return <field.DatePicker label={label} />
					case 'number':
						return <field.TextField label={label} type='number' />
					case 'select':
						return (
							<field.Select
								label={label}
								values={withCurrentValue(
									props.options,
									field.state.value
								)}
							/>
						)
					default:
						return <field.TextField label={label} />
				}
			}}
		</form.AppField>
	)
}

// A stored value that is not in the option list (a legacy rank, a unit the
// caller can no longer see) would render as an empty select and be lost on
// the next save, so keep it selectable.
function withCurrentValue(options: SelectOption[], current: unknown) {
	if (typeof current !== 'string' || current === '') return options
	if (options.some((o) => o.value === current)) return options
	return [...options, { label: current, value: current }]
}
