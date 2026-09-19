import useMaterialTypesData from '@/hooks/useMaterialTypesData'
import useRoomsData from '@/hooks/useRoomsData'
import useUnitOptions from '@/hooks/useUnitOptions'
import { useMemo } from 'react'
import { buildStockImportLookups } from './build-lookups'

export function useStockImportLookups(enabled: boolean) {
	const { units, options: unitOptions } = useUnitOptions({ enabled })
	const { data: rooms = [] } = useRoomsData(undefined, { enabled })
	const { data: materialTypes = [] } = useMaterialTypesData({ enabled })

	const lookups = useMemo(
		() =>
			buildStockImportLookups({
				unitOptions: unitOptions ?? [],
				rooms,
				materialTypes
			}),
		[unitOptions, rooms, materialTypes]
	)

	return { lookups, units }
}
