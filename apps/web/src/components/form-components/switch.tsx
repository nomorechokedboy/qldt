import { Label } from '@/components/ui/label'
import { Switch as ShadcnSwitch } from '@/components/ui/switch'
import { useFieldContext } from '@/hooks/form-context'
import { FieldFrame } from './field-frame'

// Unlike the other fields, the label sits beside the control.
export function Switch({ label }: { label: string }) {
	const field = useFieldContext<boolean>()

	return (
		<FieldFrame>
			<div className='flex items-center gap-2'>
				<ShadcnSwitch
					id={field.name}
					onBlur={field.handleBlur}
					checked={field.state.value}
					onCheckedChange={(checked) => field.handleChange(checked)}
				/>
				<Label htmlFor={field.name}>{label}</Label>
			</div>
		</FieldFrame>
	)
}
