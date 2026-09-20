import { rankOptions } from '@/data/ranks'
import usePositionOptions from '@/hooks/usePositionOptions'
import useUnitOptions from '@/hooks/useUnitOptions'
import { useStore } from '@tanstack/react-form'

// What has been entered so far, worded the way the record will read.
export default function useRecordSummary(
	form: any,
	// Saved wording to fall back on when an id is not in the option lists.
	fallback: { position?: string; unit?: string } = {}
) {
	const fullName = useStore(form.store, (s: any) => s.values.fullName)
	const rank = useStore(form.store, (s: any) => s.values.rank)
	const positionId = useStore(form.store, (s: any) => s.values.positionId)
	const unitId = useStore(form.store, (s: any) => s.values.unitId)
	const { options: unitOptions } = useUnitOptions()
	const positionOptions = usePositionOptions()

	const labelOf = (
		options: { value: string; label: string }[],
		v: unknown
	) =>
		v === undefined || v === null || v === ''
			? undefined
			: options.find((o) => o.value === String(v))?.label

	return {
		fullName: (fullName as string)?.trim() || undefined,
		rank: labelOf(rankOptions, rank),
		position: labelOf(positionOptions, positionId) ?? fallback.position,
		unit: labelOf(unitOptions, unitId) ?? fallback.unit
	}
}
