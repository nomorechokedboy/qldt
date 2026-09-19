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
import { MAX_MATERIAL_ASSET_SERIAL_LENGTH } from '@/lib/material-limits'
import type { AssetImportLookups } from './build-lookups'
import type { MaterialAssetImportRow } from './types'

export function parseAssetRows(
	headers: string[],
	dataRows: unknown[][],
	lookups: AssetImportLookups
): ParsedRows<MaterialAssetImportRow> {
	const errors: ImportRowError[] = []

	const rows = dataRows.map((row, rowIndex) => {
		const fail = (message: string) =>
			errors.push({ row: rowNumberFor(rowIndex), message })
		const cell = (header: string) => {
			const index = headers.indexOf(header)
			return index >= 0 ? row[index] : ''
		}

		const asset: MaterialAssetImportRow = { serialNumber: '' }
		let resolvedUnitId: number | undefined

		headers.forEach((header, index) => {
			const value = row[index] ?? ''

			switch (header) {
				case 'materialTypeName':
					asset.materialTypeId = resolveRequired(
						value,
						lookups.materialTypeLabelToId,
						{
							missing: 'Vui lòng chọn loại khí tài',
							notFound: (v) =>
								`Không tìm thấy loại khí tài "${v}" trong danh sách khí tài`
						},
						fail
					)
					break

				case 'serialNumber': {
					const serial = String(value ?? '').trim()
					if (serial === '') {
						fail('Vui lòng nhập số sê-ri')
					} else if (
						[...serial.normalize('NFC')].length >
						MAX_MATERIAL_ASSET_SERIAL_LENGTH
					) {
						fail(
							`Số sê-ri tối đa ${MAX_MATERIAL_ASSET_SERIAL_LENGTH} ký tự`
						)
					} else {
						asset.serialNumber = serial
					}
					break
				}

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
					asset.unitId = resolvedUnitId
					break

				case 'condition':
					asset.condition = resolveOptional(
						value,
						lookups.conditionLabelToValue,
						(v) => `Giá trị "${v}" không hợp lệ cho Tình trạng`,
						fail
					)
					break

				case 'status':
					asset.status = resolveOptional(
						value,
						lookups.statusLabelToValue,
						(v) =>
							`Giá trị "${v}" không hợp lệ cho Trạng thái sử dụng`,
						fail
					)
					break
			}
		})

		// Room and trooper lists are scoped per unit, so they resolve only
		// once the row's unit is known.
		asset.roomId = resolveInUnit(
			cell('roomName'),
			resolvedUnitId,
			lookups.roomNameToIdByUnit,
			{
				noUnit: 'Không thể xác định vị trí vì chưa chọn được đơn vị hợp lệ',
				notFound: (v) =>
					`Không tìm thấy vị trí "${v}" thuộc đơn vị đã chọn`
			},
			fail
		)
		asset.assignedTrooperId = resolveInUnit(
			cell('assignedTrooperName'),
			resolvedUnitId,
			lookups.studentNameToIdByUnit,
			{
				noUnit: 'Không thể xác định quân nhân vì chưa chọn được đơn vị hợp lệ',
				notFound: (v) =>
					`Không tìm thấy quân nhân "${v}" thuộc đơn vị đã chọn`
			},
			fail
		)

		return asset
	})

	return { rows, errors }
}
