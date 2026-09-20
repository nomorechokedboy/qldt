import {
	buildLabelMap,
	groupByUnit,
	indexNamesByUnit
} from '@/components/material-import/lookups'
import { materialConditionOptionsVi } from '@/data/material-categories'
import { buildMaterialTypeOptions } from '@/lib/material-type-options'
import type { Room } from '@/types'
import type { MaterialConditionName } from './types'

export interface StockImportSources {
	unitOptions: { id: number; label: string }[]
	rooms: Room[]
	materialTypes: {
		id: number
		name: string
		unitOfMeasure?: string | null
		isSerialized?: boolean
	}[]
}

// Everything the template builder, the file parser and the review table need
// to translate between what people read (names) and what the API stores
// (ids). Room names aren't unique across units, so rooms are always looked
// up inside a row's own unit.
export function buildStockImportLookups({
	unitOptions,
	rooms,
	materialTypes
}: StockImportSources) {
	// Bulk stock import only ever creates non-serialized supplies - serialized
	// types (weapons etc.) go through the asset import instead.
	const materialTypeOptions = buildMaterialTypeOptions(
		materialTypes.filter((t) => !t.isSerialized)
	)
	const roomsByUnitId = groupByUnit(rooms, (r) => r.unitId)

	return {
		unitOptions,
		materialTypeOptions,
		roomsByUnitId,
		unitLabelToId: buildLabelMap(
			unitOptions,
			(o) => o.label,
			(o) => o.id
		),
		materialTypeLabelToId: buildLabelMap(
			materialTypeOptions,
			(o) => o.label,
			(o) => o.id
		),
		roomNameToIdByUnit: indexNamesByUnit(
			roomsByUnitId,
			(r) => r.name,
			(r) => r.id
		),
		conditionLabelToValue: buildLabelMap(
			materialConditionOptionsVi,
			(o) => o.label,
			(o) => o.value as MaterialConditionName
		)
	}
}

export type StockImportLookups = ReturnType<typeof buildStockImportLookups>
