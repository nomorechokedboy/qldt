import { useState } from 'react'

const toggled = (set: Set<number>, id: number) => {
	const next = new Set(set)
	if (next.has(id)) next.delete(id)
	else next.add(id)
	return next
}

// What the user has ticked to move: troopers and assets by id, stocks by id
// with the quantity to move.
export default function useTransferSelection() {
	const [trooperIds, setTrooperIds] = useState<Set<number>>(new Set())
	const [assetIds, setAssetIds] = useState<Set<number>>(new Set())
	const [stockQuantities, setStockQuantities] = useState<Map<number, number>>(
		new Map()
	)

	return {
		trooperIds,
		assetIds,
		stockQuantities,
		total: trooperIds.size + assetIds.size + stockQuantities.size,
		toggleTrooper: (id: number) => setTrooperIds((s) => toggled(s, id)),
		toggleAsset: (id: number) => setAssetIds((s) => toggled(s, id)),
		// Ticking a stock moves all of it, until the user says otherwise.
		toggleStock: (id: number, remaining: number, checked: boolean) =>
			setStockQuantities((quantities) => {
				const next = new Map(quantities)
				if (checked) next.set(id, remaining)
				else next.delete(id)
				return next
			}),
		// Kept between 1 and what remains.
		setStockQuantity: (id: number, quantity: number, remaining: number) =>
			setStockQuantities((quantities) =>
				new Map(quantities).set(
					id,
					Math.min(Math.max(1, quantity), remaining)
				)
			),
		clear: () => {
			setTrooperIds(new Set())
			setAssetIds(new Set())
			setStockQuantities(new Map())
		}
	}
}

export type TransferSelection = ReturnType<typeof useTransferSelection>
