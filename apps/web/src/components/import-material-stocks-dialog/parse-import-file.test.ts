import { readTemplate } from '@/components/material-import/spreadsheet-fixture'
import type { Room } from '@/types'
import { describe, expect, it } from 'vitest'
import { buildStockImportLookups } from './build-lookups'
import { parseStockRows } from './parse-import-file'

const HEADERS = [
	'materialTypeName',
	'unitName',
	'roomName',
	'quantity',
	'condition'
]

const lookups = buildStockImportLookups({
	unitOptions: [
		{ id: 1, label: 'Đại đội 1' },
		{ id: 2, label: 'Đại đội 2' }
	],
	rooms: [
		{ id: 10, unitId: 1, name: 'Kho A' },
		{ id: 20, unitId: 2, name: 'Kho B' }
	] as Room[],
	materialTypes: [
		{ id: 5, name: 'Chiếu', unitOfMeasure: 'cái', isSerialized: false },
		{ id: 6, name: 'Chiếu', unitOfMeasure: 'bộ', isSerialized: false },
		{ id: 7, name: 'Gạo', unitOfMeasure: 'kg', isSerialized: false },
		{ id: 8, name: 'AK', isSerialized: true }
	]
})

function parse(...rows: unknown[][]) {
	const { headers, dataRows } = readTemplate(HEADERS, rows)
	return parseStockRows(headers, dataRows, lookups)
}

describe('parsing a stock import file', () => {
	it('resolves names to ids', () => {
		const { rows, errors } = parse(['Gạo', 'Đại đội 1', 'Kho A', 12, 'Khá'])

		expect(errors).toEqual([])
		expect(rows).toEqual([
			{
				materialTypeId: 7,
				unitId: 1,
				roomId: 10,
				quantity: 12,
				condition: 'fair'
			}
		])
	})

	it('tells apart types that share a name by their unit of measure', () => {
		const { rows, errors } = parse(
			['Chiếu (cái)', 'Đại đội 1'],
			['Chiếu (bộ)', 'Đại đội 1'],
			['Chiếu', 'Đại đội 1']
		)

		expect(rows.slice(0, 2).map((r) => r.materialTypeId)).toEqual([5, 6])
		expect(errors.map((e) => e.message)).toEqual([
			'Không tìm thấy loại vật tư "Chiếu" trong danh sách vật tư'
		])
	})

	it('only offers non-serialized types', () => {
		const { errors } = parse(['AK', 'Đại đội 1'])

		expect(errors).toHaveLength(1)
	})

	it('defaults a blank quantity to 1', () => {
		expect(parse(['Gạo', 'Đại đội 1', '', '']).rows[0].quantity).toBe(1)
	})

	it('accepts quantities typed as text', () => {
		expect(parse(['Gạo', 'Đại đội 1', '', '7']).rows[0].quantity).toBe(7)
	})

	it.each([0, -3, 'abc'])('rejects the quantity %s', (quantity) => {
		const { rows, errors } = parse(['Gạo', 'Đại đội 1', '', quantity])

		expect(errors.map((e) => e.message)).toEqual([
			`Số lượng "${quantity}" không hợp lệ - phải là số nguyên dương`
		])
		expect(rows[0].quantity).toBe(1)
	})

	it('looks rooms up inside the rows own unit', () => {
		const { rows, errors } = parse(['Gạo', 'Đại đội 1', 'Kho B'])

		expect(rows[0].roomId).toBeUndefined()
		expect(errors.map((e) => e.message)).toEqual([
			'Không tìm thấy vị trí "Kho B" thuộc đơn vị đã chọn'
		])
	})

	it('reports missing required cells', () => {
		expect(parse(['', '', '', 2]).errors.map((e) => e.message)).toEqual([
			'Vui lòng chọn loại vật tư',
			'Vui lòng chọn đơn vị'
		])
	})

	it('ignores rows the user left completely blank', () => {
		const { rows } = parse(['Gạo', 'Đại đội 1'], ['', '', '', '', ''])

		expect(rows).toHaveLength(1)
	})
})
