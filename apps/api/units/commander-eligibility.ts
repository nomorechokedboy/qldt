import { UnitDB } from '../schema/units'
import unitRepo from './repo'

// Shared by every "raise a request, a higher commander decides" feature
// (transfer-requests, activity-status-proposals, and future ones following
// the same pattern): a unit's 4 leadership roles are who can act as its
// "commander" for approval purposes.
const COMMANDER_FIELDS = [
	'commanderId',
	'deputyCommanderId',
	'politicalCommanderId',
	'deputyPoliticalCommanderId'
] as const

export function commanderIdsOf(unit: UnitDB): number[] {
	return COMMANDER_FIELDS.map((f) => unit[f]).filter(
		(id): id is number => id !== null && id !== undefined
	)
}

// Units that are ancestor-or-self of every one of the given unit ids — the
// valid "superior commander" units for a request spanning those units. A
// single unit id degenerates to that unit's own ancestor chain (used by
// single-unit request features like activity-status-proposals); multiple
// unit ids intersect their chains (used by features that move something
// between two units, like transfer-requests).
export async function commonAncestorUnits(
	unitIds: number[]
): Promise<UnitDB[]> {
	if (unitIds.length === 0) return []

	const chains = await Promise.all(
		unitIds.map((id) => unitRepo.findAncestorChain(id))
	)
	const [first, ...rest] = chains
	const restIdSets = rest.map((chain) => new Set(chain.map((u) => u.id)))
	return first.filter((u) => restIdSets.every((ids) => ids.has(u.id)))
}

// Users eligible to approve/decide a request spanning the given unit ids —
// never throws for a combination with no common superior unit, so it's
// safe for read-only UI hints (approver pickers, "can this user decide"
// checks) where an empty result is a valid answer rather than an error.
// Callers that need to hard-fail on an empty result (e.g. at request
// creation time) should check `.size === 0` themselves and throw with a
// domain-appropriate message.
export async function eligibleApproverIdsOrEmpty(
	unitIds: number[]
): Promise<Set<number>> {
	const commonUnits = await commonAncestorUnits(unitIds)
	return new Set(commonUnits.flatMap((u) => commanderIdsOf(u)))
}
