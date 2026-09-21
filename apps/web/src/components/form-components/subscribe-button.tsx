import { Button } from '@/components/ui/button'
import { useFormContext } from '@/hooks/form-context'

export function SubscribeButton({
	label,
	form: formProp
}: {
	label: string
	form?: string
}) {
	const form = useFormContext()
	return (
		<form.Subscribe selector={(state) => state.isSubmitting}>
			{(isSubmitting) => (
				<Button type='submit' form={formProp} disabled={isSubmitting}>
					{label}
				</Button>
			)}
		</form.Subscribe>
	)
}
