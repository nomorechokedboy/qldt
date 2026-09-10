import type { ChallengeStock, MaterialConditionName } from './payload'

export type StockDiffStatus = 'matched' | 'short' | 'over' | 'extra'

export interface StockDiffItem {
	materialTypeId: number
	condition: MaterialConditionName
	status: StockDiffStatus
	materialTypeName?: string
	expectedQuantity?: number
	observedQuantity: number
}

export function stockKey(
	materialTypeId: number,
	condition: MaterialConditionName
): string {
	return `${materialTypeId}:${condition}`
}

// Local mirror of computeInventorySessionStockDiff in
// apps/api/inventory-sessions/stock-diff.ts, working off the challenge's
// expectedStocks list plus this session's local count entries (keyed by
// stockKey) instead of DB rows. An "extra" combination is reported but
// never blocks finishing the session - same as the asset side's extra
// serials (see lib/diff.ts).
export function computeStockDiff(
	expected: ChallengeStock[],
	counts: Record<string, number>
): StockDiffItem[] {
	const expectedKeys = new Set(
		expected.map((e) => stockKey(e.materialTypeId, e.condition))
	)

	const items: StockDiffItem[] = expected.map((e) => {
		const key = stockKey(e.materialTypeId, e.condition)
		const observedQuantity = counts[key] ?? 0
		if (observedQuantity === e.expectedQuantity) {
			return {
				materialTypeId: e.materialTypeId,
				condition: e.condition,
				status: 'matched',
				materialTypeName: e.materialTypeName,
				expectedQuantity: e.expectedQuantity,
				observedQuantity
			}
		}
		return {
			materialTypeId: e.materialTypeId,
			condition: e.condition,
			status: observedQuantity < e.expectedQuantity ? 'short' : 'over',
			materialTypeName: e.materialTypeName,
			expectedQuantity: e.expectedQuantity,
			observedQuantity
		}
	})

	for (const key of Object.keys(counts)) {
		if (!expectedKeys.has(key)) {
			const [materialTypeIdStr, condition] = key.split(':')
			items.push({
				materialTypeId: Number(materialTypeIdStr),
				condition: condition as MaterialConditionName,
				status: 'extra',
				observedQuantity: counts[key]
			})
		}
	}

	return items
}
