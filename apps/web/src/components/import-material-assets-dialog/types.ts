import type { materials } from '@/api/client'

export type MaterialConditionName = NonNullable<
	materials.MaterialAssetBody['condition']
>
export type MaterialAssetStatus = NonNullable<
	materials.MaterialAssetBody['status']
>

export interface MaterialAssetImportRow {
	materialTypeId?: number
	serialNumber: string
	unitId?: number
	roomId?: number
	condition?: MaterialConditionName
	status?: MaterialAssetStatus
	assignedTrooperId?: number
}
