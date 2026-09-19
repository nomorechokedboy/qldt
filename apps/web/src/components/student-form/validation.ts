// Copies zod issues onto the matching form fields so their inputs show them.
export function validateAndSetErrors(
	form: any,
	validationResult: { success: boolean; error?: { issues: any[] } }
) {
	if (validationResult.success) return true

	for (const issue of validationResult.error?.issues ?? []) {
		// ['siblings', 0, 'fullName'] -> 'siblings[0].fullName'
		const fieldPath =
			issue.path.length > 1 && typeof issue.path[1] === 'number'
				? `${issue.path[0]}[${issue.path[1]}].${issue.path.slice(2).join('.')}`
				: issue.path.join('.')

		form.setFieldMeta(fieldPath, (prev: any) => ({
			...prev,
			errorMap: { onSubmit: { message: issue.message } },
			isTouched: true
		}))
	}
	return false
}
