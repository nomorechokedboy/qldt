import { GetUnits } from '@/api'
import type { GetUnitQuery } from '@/types'
import { useQuery } from '@tanstack/react-query'

export default function useUnitsData(
	params?: GetUnitQuery,
	options?: { enabled?: boolean }
) {
	return useQuery({
		queryKey: ['units', params],
		queryFn: () => GetUnits(params),
		enabled: options?.enabled
	})
}
