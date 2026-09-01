import {
	materialAssetStatusLabels,
	materialConditionLabels
} from '@/data/material-categories'
import type { MaterialAsset } from '@/types'

export interface MaterialAssetExportField {
	key: string
	label: string
	getValue: (asset: MaterialAsset) => string
}

export const materialAssetExportFields: MaterialAssetExportField[] = [
	{
		key: 'serialNumber',
		label: 'Số sê-ri',
		getValue: (asset) => asset.serialNumber ?? ''
	},
	{
		key: 'materialType',
		label: 'Loại khí tài',
		getValue: (asset) => asset.materialType?.name ?? ''
	},
	{
		key: 'unit',
		label: 'Đơn vị',
		getValue: (asset) => asset.unit?.name ?? ''
	},
	{
		key: 'room',
		label: 'Phòng',
		getValue: (asset) => asset.room?.name ?? ''
	},
	{
		key: 'assignedTrooper',
		label: 'Cấp phát cho',
		getValue: (asset) => asset.assignedTrooper?.fullName ?? ''
	},
	{
		key: 'condition',
		label: 'Tình trạng',
		getValue: (asset) =>
			asset.condition
				? (materialConditionLabels[asset.condition] ?? asset.condition)
				: ''
	},
	{
		key: 'status',
		label: 'Trạng thái',
		getValue: (asset) =>
			asset.status
				? (materialAssetStatusLabels[asset.status] ?? asset.status)
				: ''
	}
]

export function buildMaterialAssetExportRow(
	asset: MaterialAsset,
	selectedKeys?: string[]
): Record<string, string> {
	const fields = selectedKeys
		? materialAssetExportFields.filter((f) => selectedKeys.includes(f.key))
		: materialAssetExportFields

	return Object.fromEntries(
		fields.map((field) => [field.label, field.getValue(asset)])
	)
}
