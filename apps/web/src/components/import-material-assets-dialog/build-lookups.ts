import {
	materialAssetStatusOptionsVi,
	materialConditionOptionsVi
} from '@/data/material-categories'
import {
	buildLabelMap,
	groupByUnit,
	indexNamesByUnit
} from '@/components/material-import/lookups'
import { buildMaterialTypeOptions } from '@/lib/material-type-options'
import type { Room, Student } from '@/types'
import type { MaterialAssetStatus, MaterialConditionName } from './types'

export const studentLabel = (s: Student) => s.fullName || s.studentId

export interface AssetImportSources {
	unitOptions: { id: number; label: string }[]
	rooms: Room[]
	students: Student[]
	materialTypes: {
		id: number
		name: string
		unitOfMeasure?: string | null
		isSerialized?: boolean
	}[]
}

// Everything the template builder, the file parser and the review table need
// to translate between what people read (names) and what the API stores
// (ids). Names aren't unique across units, so rooms and troopers are always
// looked up inside a row's own unit.
export function buildAssetImportLookups({
	unitOptions,
	rooms,
	students,
	materialTypes
}: AssetImportSources) {
	// Bulk asset import only ever creates serialized items (weapons,
	// vehicles, etc.) - non-serialized supplies go through the stock import.
	const materialTypeOptions = buildMaterialTypeOptions(
		materialTypes.filter((t) => t.isSerialized)
	)
	const roomsByUnitId = groupByUnit(rooms, (r) => r.unitId)
	const studentsByUnitId = groupByUnit(students, (s) => s.unitId)

	return {
		unitOptions,
		materialTypeOptions,
		roomsByUnitId,
		studentsByUnitId,
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
		studentNameToIdByUnit: indexNamesByUnit(
			studentsByUnitId,
			studentLabel,
			(s) => s.id
		),
		conditionLabelToValue: buildLabelMap(
			materialConditionOptionsVi,
			(o) => o.label,
			(o) => o.value as MaterialConditionName
		),
		statusLabelToValue: buildLabelMap(
			materialAssetStatusOptionsVi,
			(o) => o.label,
			(o) => o.value as MaterialAssetStatus
		)
	}
}

export type AssetImportLookups = ReturnType<typeof buildAssetImportLookups>
