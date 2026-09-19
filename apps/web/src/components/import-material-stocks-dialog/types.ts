import type { materials } from '@/api/client'

export type MaterialConditionName = NonNullable<
	materials.MaterialStockBody['condition']
>

export interface MaterialStockImportRow {
	materialTypeId?: number
	unitId?: number
	roomId?: number
	quantity: number
	condition?: MaterialConditionName
}
