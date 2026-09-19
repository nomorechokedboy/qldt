import {
	resolveInUnit,
	resolveOptional,
	resolveRequired
} from '@/components/material-import/parse-cells'
import {
	rowNumberFor,
	type ImportRowError,
	type ParsedRows
} from '@/components/material-import/types'
import type { StockImportLookups } from './build-lookups'
import type { MaterialStockImportRow } from './types'

export function parseStockRows(
	headers: string[],
	dataRows: unknown[][],
	lookups: StockImportLookups
): ParsedRows<MaterialStockImportRow> {
	const errors: ImportRowError[] = []

	const rows = dataRows.map((row, rowIndex) => {
		const fail = (message: string) =>
			errors.push({ row: rowNumberFor(rowIndex), message })

		const stock: MaterialStockImportRow = { quantity: 1 }
		let resolvedUnitId: number | undefined

		headers.forEach((header, index) => {
			const value = row[index] ?? ''

			switch (header) {
				case 'materialTypeName':
					stock.materialTypeId = resolveRequired(
						value,
						lookups.materialTypeLabelToId,
						{
							missing: 'Vui lòng chọn loại vật tư',
							notFound: (v) =>
								`Không tìm thấy loại vật tư "${v}" trong danh sách vật tư`
						},
						fail
					)
					break

				case 'unitName':
					resolvedUnitId = resolveRequired(
						value,
						lookups.unitLabelToId,
						{
							missing: 'Vui lòng chọn đơn vị',
							notFound: (v) =>
								`Không tìm thấy đơn vị "${v}" trong danh sách đơn vị`
						},
						fail
					)
					stock.unitId = resolvedUnitId
					break

				case 'quantity': {
					// A blank quantity means 1; anything else must be a
					// positive whole number.
					if (typeof value === 'string' && value.trim() === '') {
						stock.quantity = 1
						break
					}
					const parsed =
						typeof value === 'number'
							? value
							: Number.parseInt(String(value), 10)
					if (Number.isNaN(parsed) || parsed <= 0) {
						fail(
							`Số lượng "${value}" không hợp lệ - phải là số nguyên dương`
						)
						stock.quantity = 1
					} else {
						stock.quantity = parsed
					}
					break
				}

				case 'condition':
					stock.condition = resolveOptional(
						value,
						lookups.conditionLabelToValue,
						(v) => `Giá trị "${v}" không hợp lệ cho Tình trạng`,
						fail
					)
					break
			}
		})

		// Room names are scoped per unit, so the room resolves only once the
		// row's unit is known.
		const roomIndex = headers.indexOf('roomName')
		stock.roomId = resolveInUnit(
			roomIndex >= 0 ? row[roomIndex] : '',
			resolvedUnitId,
			lookups.roomNameToIdByUnit,
			{
				noUnit: 'Không thể xác định vị trí vì chưa chọn được đơn vị hợp lệ',
				notFound: (v) =>
					`Không tìm thấy vị trí "${v}" thuộc đơn vị đã chọn`
			},
			fail
		)

		return stock
	})

	return { rows, errors }
}
