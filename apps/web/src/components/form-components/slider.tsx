import { Slider as ShadcnSlider } from '@/components/ui/slider'
import { useFieldContext } from '@/hooks/form-context'
import { FieldFrame } from './field-frame'

export function Slider({ label }: { label: string }) {
	const field = useFieldContext<number>()

	return (
		<FieldFrame label={label} htmlFor={label}>
			<ShadcnSlider
				id={label}
				onBlur={field.handleBlur}
				value={[field.state.value]}
				onValueChange={(value) => field.handleChange(value[0])}
			/>
		</FieldFrame>
	)
}
