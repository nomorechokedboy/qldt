import { InventorySessionExpectedAssetDB } from '../schema/inventory-session-inspected-assets'
import { InventorySessionScanDB } from '../schema/inventory-session-scans'
import { MaterialConditionName } from '../schema/material-stocks'

export type InventorySessionDiffStatus =
	| 'matched'
	| 'missing'
	| 'extra'
	| 'condition_changed'

export interface InventorySessionDiffItem {
	serial: string
	status: InventorySessionDiffStatus
	expectedCondition?: MaterialConditionName
	observedCondition?: MaterialConditionName | null
}

// Pure diff over what was expected for the session vs. what was actually
// scanned. "extra" items (a scanned serial not in the expected set) are
// included but never change completion behavior - the caller decides what
// to do with them, this function only reports.
export function computeInventorySessionDiff(
	expected: InventorySessionExpectedAssetDB[],
	scans: InventorySessionScanDB[]
): InventorySessionDiffItem[] {
	const scansBySerial = new Map(scans.map((s) => [s.serialNumber, s]))
	const expectedSerials = new Set(expected.map((e) => e.serialNumber))

	const items: InventorySessionDiffItem[] = expected.map((e) => {
		const scan = scansBySerial.get(e.serialNumber)
		const expectedCondition = e.conditionSnapshot

		if (!scan) {
			return {
				serial: e.serialNumber,
				status: 'missing',
				expectedCondition
			}
		}

		if (
			scan.observedCondition !== null &&
			scan.observedCondition !== expectedCondition
		) {
			return {
				serial: e.serialNumber,
				status: 'condition_changed',
				expectedCondition,
				observedCondition: scan.observedCondition
			}
		}

		return {
			serial: e.serialNumber,
			status: 'matched',
			expectedCondition,
			observedCondition: scan.observedCondition
		}
	})

	for (const scan of scans) {
		if (!expectedSerials.has(scan.serialNumber)) {
			items.push({
				serial: scan.serialNumber,
				status: 'extra',
				observedCondition: scan.observedCondition
			})
		}
	}

	return items
}
