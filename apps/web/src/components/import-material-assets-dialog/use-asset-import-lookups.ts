import useMaterialTypesData from '@/hooks/useMaterialTypesData'
import useRoomsData from '@/hooks/useRoomsData'
import useStudentData from '@/hooks/useStudents'
import useUnitOptions from '@/hooks/useUnitOptions'
import { useMemo } from 'react'
import { buildAssetImportLookups } from './build-lookups'

export function useAssetImportLookups(enabled: boolean) {
	const { unitsById, options: unitOptions } = useUnitOptions({ enabled })
	const { data: rooms = [] } = useRoomsData(undefined, { enabled })
	const { data: materialTypes = [] } = useMaterialTypesData({ enabled })
	const { data: students = [] } = useStudentData(undefined, { enabled })

	const lookups = useMemo(
		() =>
			buildAssetImportLookups({
				unitOptions: unitOptions ?? [],
				rooms,
				students,
				materialTypes
			}),
		[unitOptions, rooms, students, materialTypes]
	)

	return { lookups, unitsById }
}
