export interface MaterialTypeOption {
	id: number
	label: string
}

// A type is identified by name plus unit of measure, so the same name can
// exist twice ("Chiếu" in "cái" and in "bộ"). Bulk imports match a type by
// its label, so a name shared by several types gets its unit appended to
// keep every label unique; names that are already unique stay unchanged.
export function buildMaterialTypeOptions(
	types: { id: number; name: string; unitOfMeasure?: string | null }[]
): MaterialTypeOption[] {
	const nameCount = new Map<string, number>()
	for (const t of types) {
		const key = t.name.trim().toLowerCase()
		nameCount.set(key, (nameCount.get(key) ?? 0) + 1)
	}

	return types.map((t) => {
		const shared = (nameCount.get(t.name.trim().toLowerCase()) ?? 0) > 1
		const unit = t.unitOfMeasure?.trim()
		return {
			id: t.id,
			label: shared && unit ? `${t.name} (${unit})` : t.name
		}
	})
}
