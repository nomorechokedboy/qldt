import type { ChallengeAsset, MaterialConditionName } from './payload'

export type DiffStatus = 'matched' | 'missing' | 'extra' | 'condition_changed'

export interface ScanEntry {
	serial: string
	observedCondition: MaterialConditionName
}

export interface DiffItem {
	serial: string
	status: DiffStatus
	materialTypeName?: string
	expectedCondition?: MaterialConditionName
	observedCondition?: MaterialConditionName
}

// Local mirror of computeInventorySessionDiff in
// apps/api/inventory-sessions/diff.ts, working off the challenge's expected
// list plus this session's local scan entries instead of DB rows. Extras
// (a scanned serial with no matching expected entry) are reported but never
// block finishing the session - see the design doc's "Decisions" section.
export function computeDiff(
	expected: ChallengeAsset[],
	scans: Record<string, ScanEntry>
): DiffItem[] {
	const expectedBySerial = new Map(expected.map((e) => [e.serial, e]))

	const items: DiffItem[] = expected.map((e) => {
		const scan = scans[e.serial]
		if (!scan) {
			return {
				serial: e.serial,
				status: 'missing',
				materialTypeName: e.materialTypeName,
				expectedCondition: e.condition
			}
		}
		if (scan.observedCondition !== e.condition) {
			return {
				serial: e.serial,
				status: 'condition_changed',
				materialTypeName: e.materialTypeName,
				expectedCondition: e.condition,
				observedCondition: scan.observedCondition
			}
		}
		return {
			serial: e.serial,
			status: 'matched',
			materialTypeName: e.materialTypeName,
			expectedCondition: e.condition,
			observedCondition: scan.observedCondition
		}
	})

	for (const serial of Object.keys(scans)) {
		if (!expectedBySerial.has(serial)) {
			items.push({
				serial,
				status: 'extra',
				observedCondition: scans[serial].observedCondition
			})
		}
	}

	return items
}
