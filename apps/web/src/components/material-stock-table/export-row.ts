import { materialConditionLabels } from '@/data/material-categories'
import type { MaterialStock } from '@/types'

export interface MaterialStockExportField {
	key: string
	label: string
	getValue: (stock: MaterialStock) => string
}

export const materialStockExportFields: MaterialStockExportField[] = [
	{
		key: 'materialType',
		label: 'Loại vật tư',
		getValue: (stock) => stock.materialType?.name ?? ''
	},
	{
		key: 'unit',
		label: 'Đơn vị',
		getValue: (stock) => stock.unit?.name ?? ''
	},
	{
		key: 'room',
		label: 'Phòng',
		getValue: (stock) => stock.room?.name ?? ''
	},
	{
		key: 'quantity',
		label: 'Số lượng',
		getValue: (stock) =>
			`${stock.quantity} ${stock.materialType?.unitOfMeasure ?? ''}`.trim()
	},
	{
		key: 'condition',
		label: 'Tình trạng',
		getValue: (stock) =>
			stock.condition
				? (materialConditionLabels[stock.condition] ?? stock.condition)
				: ''
	}
]

export function buildMaterialStockExportRow(
	stock: MaterialStock,
	selectedKeys?: string[]
): Record<string, string> {
	const fields = selectedKeys
		? materialStockExportFields.filter((f) => selectedKeys.includes(f.key))
		: materialStockExportFields

	return Object.fromEntries(
		fields.map((field) => [field.label, field.getValue(stock)])
	)
}
