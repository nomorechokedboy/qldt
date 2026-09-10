import { describe, expect, it } from 'vitest'
import { computeInventorySessionStockDiff } from './stock-diff'
import { InventorySessionExpectedStockDB } from '../schema/inventory-session-expected-stocks'
import { InventorySessionStockCountDB } from '../schema/inventory-session-stock-counts'

function makeExpected(
	overrides: Partial<InventorySessionExpectedStockDB> = {}
): InventorySessionExpectedStockDB {
	return {
		id: 1,
		sessionId: 1,
		materialTypeId: 10,
		condition: 'good',
		expectedQuantity: 0,
		createdAt: '',
		updatedAt: '',
		...overrides
	}
}

function makeCount(
	overrides: Partial<InventorySessionStockCountDB> = {}
): InventorySessionStockCountDB {
	return {
		id: 1,
		sessionId: 1,
		materialTypeId: 10,
		condition: 'good',
		observedQuantity: 0,
		createdAt: '',
		updatedAt: '',
		...overrides
	}
}

describe('computeInventorySessionStockDiff', () => {
	it('marks a line matched when the count equals the expected quantity', () => {
		const expected = [
			makeExpected({
				materialTypeId: 20,
				condition: 'good',
				expectedQuantity: 12
			})
		]
		const counts = [
			makeCount({
				materialTypeId: 20,
				condition: 'good',
				observedQuantity: 12
			})
		]

		const diff = computeInventorySessionStockDiff(expected, counts)

		expect(diff).toEqual([
			{
				materialTypeId: 20,
				condition: 'good',
				status: 'matched',
				expectedQuantity: 12,
				observedQuantity: 12
			}
		])
	})

	it('marks a line short when the count is below the expected quantity', () => {
		const expected = [
			makeExpected({
				materialTypeId: 10,
				condition: 'good',
				expectedQuantity: 50
			})
		]
		const counts = [
			makeCount({
				materialTypeId: 10,
				condition: 'good',
				observedQuantity: 45
			})
		]

		const diff = computeInventorySessionStockDiff(expected, counts)

		expect(diff).toEqual([
			{
				materialTypeId: 10,
				condition: 'good',
				status: 'short',
				expectedQuantity: 50,
				observedQuantity: 45
			}
		])
	})

	it('marks a line over when the count exceeds the expected quantity', () => {
		const expected = [
			makeExpected({
				materialTypeId: 10,
				condition: 'good',
				expectedQuantity: 50
			})
		]
		const counts = [
			makeCount({
				materialTypeId: 10,
				condition: 'good',
				observedQuantity: 53
			})
		]

		const diff = computeInventorySessionStockDiff(expected, counts)

		expect(diff).toEqual([
			{
				materialTypeId: 10,
				condition: 'good',
				status: 'over',
				expectedQuantity: 50,
				observedQuantity: 53
			}
		])
	})

	it('treats an expected line with no matching count as a count of zero', () => {
		const expected = [
			makeExpected({
				materialTypeId: 10,
				condition: 'good',
				expectedQuantity: 50
			})
		]

		const diff = computeInventorySessionStockDiff(expected, [])

		expect(diff).toEqual([
			{
				materialTypeId: 10,
				condition: 'good',
				status: 'short',
				expectedQuantity: 50,
				observedQuantity: 0
			}
		])
	})

	it('reports a counted materialType/condition not in expectedStocks as extra', () => {
		const diff = computeInventorySessionStockDiff(
			[],
			[
				makeCount({
					materialTypeId: 30,
					condition: 'fair',
					observedQuantity: 5
				})
			]
		)

		expect(diff).toEqual([
			{
				materialTypeId: 30,
				condition: 'fair',
				status: 'extra',
				observedQuantity: 5
			}
		])
	})

	it('represents a condition transfer as a short line on the source condition plus an extra line on the destination', () => {
		// 5 units of materialTypeId 10 physically moved from `good` to
		// `damaged` between the challenge snapshot and the count - there was
		// never a material_stocks row (and so no expected line) for
		// `damaged`, matching the design doc's "Diff semantics" example.
		const expected = [
			makeExpected({
				materialTypeId: 10,
				condition: 'good',
				expectedQuantity: 50
			})
		]
		const counts = [
			makeCount({
				materialTypeId: 10,
				condition: 'good',
				observedQuantity: 45
			}),
			makeCount({
				materialTypeId: 10,
				condition: 'damaged',
				observedQuantity: 5
			})
		]

		const diff = computeInventorySessionStockDiff(expected, counts)

		expect(diff).toEqual([
			{
				materialTypeId: 10,
				condition: 'good',
				status: 'short',
				expectedQuantity: 50,
				observedQuantity: 45
			},
			{
				materialTypeId: 10,
				condition: 'damaged',
				status: 'extra',
				observedQuantity: 5
			}
		])
	})

	it('sums duplicate counts for the same materialType/condition before comparing', () => {
		const expected = [
			makeExpected({
				materialTypeId: 10,
				condition: 'good',
				expectedQuantity: 50
			})
		]
		const counts = [
			makeCount({
				id: 1,
				materialTypeId: 10,
				condition: 'good',
				observedQuantity: 30
			}),
			makeCount({
				id: 2,
				materialTypeId: 10,
				condition: 'good',
				observedQuantity: 20
			})
		]

		const diff = computeInventorySessionStockDiff(expected, counts)

		expect(diff).toEqual([
			{
				materialTypeId: 10,
				condition: 'good',
				status: 'matched',
				expectedQuantity: 50,
				observedQuantity: 50
			}
		])
	})
})
