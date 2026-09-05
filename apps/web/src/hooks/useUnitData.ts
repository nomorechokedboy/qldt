import { GetUnit } from '@/api'
import type { units } from '@/api/client'
import { useQuery, type UseQueryOptions } from '@tanstack/react-query'

export default function useUnitData(
	params: units.GetUnitRequest & { alias: string },
	useQueryOptions?: Omit<UseQueryOptions, 'queryFn' | 'queryKey'>
) {
	return useQuery({
		...useQueryOptions,
		queryKey: ['unit', params],
		queryFn: () => GetUnit(params)
	})
}
