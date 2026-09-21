import { useMemo } from 'react'
import useStudentData from '@/hooks/useStudents'
import useUnitOptions from '@/hooks/useUnitOptions'

type UnitNode = { id: number; parent?: { id: number } | null }

// `rootId` and every unit beneath it. A proposal may cover troopers belonging
// to the selected unit or any of its subordinate (descendant) units, not only
// ones registered directly on the unit itself (matches the backend's
// unitAndDescendantIds scope).
export function collectUnitScope(
	units: UnitNode[],
	rootId: number
): Set<number> {
	const childrenByParentId = new Map<number, number[]>()
	for (const u of units) {
		if (!u.parent) continue
		const list = childrenByParentId.get(u.parent.id) ?? []
		list.push(u.id)
		childrenByParentId.set(u.parent.id, list)
	}

	// A Set is iterated live, so units added below are visited too - a
	// breadth-first walk that needs no queue and can't revisit a unit.
	const scope = new Set<number>([rootId])
	for (const current of scope) {
		for (const childId of childrenByParentId.get(current) ?? []) {
			scope.add(childId)
		}
	}
	return scope
}

// A student is either attached directly to a unit (unitId) or is a squad
// member reached only through their class (class.unit.id).
export function studentsInScope<
	S extends {
		unitId?: number
		class?: { unit?: { id: number } | null } | null
	}
>(students: S[] | undefined, scope: ReadonlySet<number>): S[] {
	return (students ?? []).filter((s) => {
		const id = s.unitId ?? s.class?.unit?.id
		return id !== undefined && scope.has(id)
	})
}

// What a proposal form needs to pick a unit and then its troopers. Nothing is
// fetched until the form's sheet is open, and troopers only once a unit is
// chosen.
export default function useUnitTroopers({
	unitId,
	open
}: {
	unitId: string
	open: boolean
}) {
	// Proposals require a Battalion level unit or larger (matches the backend
	// constraint), scoped to the units the current user can access.
	const { units, options: unitOptions } = useUnitOptions({
		enabled: open,
		minLevel: 'battalion'
	})
	const { data: students } = useStudentData(undefined, {
		enabled: open && !!unitId
	})

	const unitScopeIds = useMemo(
		() =>
			unitId
				? collectUnitScope(units, Number(unitId))
				: new Set<number>(),
		[units, unitId]
	)

	const unitStudents = useMemo(
		() => studentsInScope(students, unitScopeIds),
		[students, unitScopeIds]
	)

	return { unitOptions, unitStudents }
}
