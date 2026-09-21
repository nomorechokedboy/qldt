import type { ChangeEvent } from 'react'
import { useFieldContext } from '@/hooks/form-context'

// Shared by the file-valued fields: a file over `maxSize` (bytes) is ignored,
// leaving the field as it was; clearing the choice stores `null`.
export function useFileField(maxSize: number) {
	const field = useFieldContext<File | null>()

	const selectFile = (file: File | null) => {
		if (file === null) {
			field.handleChange(null)
		} else if (file.size <= maxSize) {
			field.handleChange(file)
		}
	}

	const handleInputChange = (e: ChangeEvent<HTMLInputElement>) =>
		selectFile(e.target.files?.[0] || null)

	return { field, selectFile, handleInputChange }
}
