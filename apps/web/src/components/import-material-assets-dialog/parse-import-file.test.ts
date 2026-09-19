import { readTemplate } from '@/components/material-import/spreadsheet-fixture'
import type { Room, Student } from '@/types'
import { describe, expect, it } from 'vitest'
import { buildAssetImportLookups } from './build-lookups'
import { parseAssetRows } from './parse-import-file'

const HEADERS = [
	'materialTypeName',
	'serialNumber',
	'unitName',
	'roomName',
	'condition',
	'status',
	'assignedTrooperName'
]

const lookups = buildAssetImportLookups({
	unitOptions: [
		{ id: 1, label: 'Đại đội 1' },
		{ id: 2, label: 'Đại đội 2' }
	],
	rooms: [
		{ id: 10, unitId: 1, name: 'Kho A' },
		{ id: 20, unitId: 2, name: 'Kho A' }
	] as Room[],
	students: [
		{ id: 100, unitId: 1, fullName: 'Nguyễn Văn A', studentId: 'A1' },
		{ id: 200, unitId: 2, fullName: 'Trần Văn B', studentId: 'B1' }
	] as Student[],
	materialTypes: [
		{ id: 5, name: 'AK', isSerialized: true },
		{ id: 6, name: 'Chiếu', isSerialized: false }
	]
})

function parse(...rows: unknown[][]) {
	const { headers, dataRows } = readTemplate(HEADERS, rows)
	return parseAssetRows(headers, dataRows, lookups)
}

describe('parsing an asset import file', () => {
	it('resolves names to ids', () => {
		const { rows, errors } = parse([
			'AK',
			'AK-1',
			'Đại đội 1',
			'Kho A',
			'Tốt',
			'Đang sử dụng',
			'Nguyễn Văn A'
		])

		expect(errors).toEqual([])
		expect(rows).toEqual([
			{
				materialTypeId: 5,
				serialNumber: 'AK-1',
				unitId: 1,
				roomId: 10,
				condition: 'good',
				status: 'in_service',
				assignedTrooperId: 100
			}
		])
	})

	it('matches names regardless of case and surrounding spaces', () => {
		const { rows, errors } = parse(['  ak ', 'AK-1', ' đại đội 2', 'kho a'])

		expect(errors).toEqual([])
		expect(rows[0]).toMatchObject({
			materialTypeId: 5,
			unitId: 2,
			roomId: 20
		})
	})

	it('looks rooms and troopers up inside the rows own unit', () => {
		const sameRoomName = parse(['AK', 'AK-1', 'Đại đội 2', 'Kho A'])
		expect(sameRoomName.rows[0].roomId).toBe(20)

		const foreignTrooper = parse([
			'AK',
			'AK-1',
			'Đại đội 1',
			'',
			'',
			'',
			'Trần Văn B'
		])
		expect(foreignTrooper.rows[0].assignedTrooperId).toBeUndefined()
		expect(foreignTrooper.errors.map((e) => e.message)).toEqual([
			'Không tìm thấy quân nhân "Trần Văn B" thuộc đơn vị đã chọn'
		])
	})

	it('only offers serialized types', () => {
		const { errors } = parse(['Chiếu', 'C-1', 'Đại đội 1'])

		expect(errors.map((e) => e.message)).toEqual([
			'Không tìm thấy loại khí tài "Chiếu" trong danh sách khí tài'
		])
	})

	it('reports missing required cells', () => {
		const { errors } = parse(['', ' ', ''])

		expect(errors.map((e) => e.message)).toEqual([
			'Vui lòng chọn loại khí tài',
			'Vui lòng nhập số sê-ri',
			'Vui lòng chọn đơn vị'
		])
	})

	it('rejects a serial number longer than the cap', () => {
		const { rows, errors } = parse(['AK', 'X'.repeat(21), 'Đại đội 1'])

		expect(errors.map((e) => e.message)).toEqual([
			'Số sê-ri tối đa 20 ký tự'
		])
		expect(rows[0].serialNumber).toBe('')
		expect(parse(['AK', 'X'.repeat(20), 'Đại đội 1']).errors).toEqual([])
	})

	it('cannot resolve a room when the unit is invalid', () => {
		const { errors } = parse(['AK', 'AK-1', 'Không có', 'Kho A'])

		expect(errors.map((e) => e.message)).toEqual([
			'Không tìm thấy đơn vị "Không có" trong danh sách đơn vị',
			'Không thể xác định vị trí vì chưa chọn được đơn vị hợp lệ'
		])
	})

	it('reports unknown condition and status values', () => {
		const { errors } = parse(['AK', 'AK-1', 'Đại đội 1', '', 'Xịn', 'Lạ'])

		expect(errors.map((e) => e.message)).toEqual([
			'Giá trị "Xịn" không hợp lệ cho Tình trạng',
			'Giá trị "Lạ" không hợp lệ cho Trạng thái sử dụng'
		])
	})

	it('numbers errors by row so each one can be shown next to its row', () => {
		const { errors } = parse(
			['AK', 'AK-1', 'Đại đội 1'],
			['AK', '', 'Đại đội 1'],
			['AK', 'AK-3', 'Đại đội 1'],
			['AK', 'AK-4', 'Sai']
		)

		const [second, fourth] = errors
		expect(fourth.row - second.row).toBe(2)
	})
})
