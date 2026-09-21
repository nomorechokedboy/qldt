import { useEffect } from 'react'
import { useFieldContext } from '@/hooks/form-context'

// A starting value for a field that has none: applied once, on mount, only
// when the field is still empty, and left to the user from then on. It is a
// starting point rather than a user choice, so the field is not marked
// touched and `onChange` callbacks are not run.
export function useDefaultValue(defaultValue: string | undefined) {
	const field = useFieldContext<string | null | undefined>()

	// biome-ignore lint/correctness/useExhaustiveDependencies: mount only
	useEffect(() => {
		const current = field.state.value
		const isEmpty =
			current === undefined || current === null || current === ''
		if (defaultValue && isEmpty) {
			field.setValue(defaultValue, { dontUpdateMeta: true })
		}
	}, [])
}
