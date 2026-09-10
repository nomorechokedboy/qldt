import { InventorySessionExpectedStockDB } from '../schema/inventory-session-expected-stocks'
import { InventorySessionStockCountDB } from '../schema/inventory-session-stock-counts'
import { MaterialConditionName } from '../schema/material-stocks'

export type InventorySessionStockDiffStatus =
	| 'matched'
	| 'short'
	| 'over'
	| 'extra'

export interface InventorySessionStockDiffItem {
	materialTypeId: number
	condition: MaterialConditionName
	status: InventorySessionStockDiffStatus
	expectedQuantity?: number
	observedQuantity: number
}

function stockKey(materialTypeId: number, condition: string): string {
	return `${materialTypeId}:${condition}`
}

// Pure diff over what stock was expected for the session vs. what was
// actually counted, mirroring computeInventorySessionDiff's shape (see
// diff.ts) but comparing quantities instead of identities. A materialType/
// condition combo counted more than once (the table has no unique
// constraint preventing this - see the design doc) is summed before
// comparing, so a duplicate insert can't silently understate a count.
export function computeInventorySessionStockDiff(
	expected: InventorySessionExpectedStockDB[],
	counts: InventorySessionStockCountDB[]
): InventorySessionStockDiffItem[] {
	const observedByKey = new Map<string, number>()
	for (const c of counts) {
		const key = stockKey(c.materialTypeId, c.condition)
		observedByKey.set(
			key,
			(observedByKey.get(key) ?? 0) + c.observedQuantity
		)
	}

	const expectedKeys = new Set(
		expected.map((e) => stockKey(e.materialTypeId, e.condition))
	)

	const items: InventorySessionStockDiffItem[] = expected.map((e) => {
		const key = stockKey(e.materialTypeId, e.condition)
		const observedQuantity = observedByKey.get(key) ?? 0
		if (observedQuantity === e.expectedQuantity) {
			return {
				materialTypeId: e.materialTypeId,
				condition: e.condition,
				status: 'matched',
				expectedQuantity: e.expectedQuantity,
				observedQuantity
			}
		}
		return {
			materialTypeId: e.materialTypeId,
			condition: e.condition,
			status: observedQuantity < e.expectedQuantity ? 'short' : 'over',
			expectedQuantity: e.expectedQuantity,
			observedQuantity
		}
	})

	for (const [key, observedQuantity] of observedByKey) {
		if (!expectedKeys.has(key)) {
			const [materialTypeIdStr, condition] = key.split(':')
			items.push({
				materialTypeId: Number(materialTypeIdStr),
				condition: condition as MaterialConditionName,
				status: 'extra',
				observedQuantity
			})
		}
	}

	return items
}
