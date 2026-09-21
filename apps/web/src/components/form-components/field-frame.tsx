import { useStore } from '@tanstack/react-form'
import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'
import { useFieldContext } from '@/hooks/form-context'
import { ErrorMessages } from './error-messages'

// The field's validation errors, shown only once the user has touched it.
export function FieldErrors() {
	const field = useFieldContext()
	const errors = useStore(field.store, (state) => state.meta.errors)
	const isTouched = useStore(field.store, (state) => state.meta.isTouched)

	return isTouched ? <ErrorMessages errors={errors} /> : null
}

// The layout every field shares: an optional label, the control, then the
// field's errors. `htmlFor` is the id of the control the label points at.
export function FieldFrame({
	label,
	htmlFor,
	className,
	children
}: {
	label?: string
	htmlFor?: string
	className?: string
	children: ReactNode
}) {
	return (
		<div className={className}>
			{label !== undefined && (
				<Label htmlFor={htmlFor} className='mb-2 text-xl font-bold'>
					{label}
				</Label>
			)}
			{children}
			<FieldErrors />
		</div>
	)
}
