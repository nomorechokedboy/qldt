import { GetUnit } from '@/api'
import { useQuery, type UseQueryOptions } from '@tanstack/react-query'

export default function useUnitData(
	params: { id: number },
	useQueryOptions?: Omit<UseQueryOptions, 'queryFn' | 'queryKey'>
) {
	return useQuery({
		...useQueryOptions,
		queryKey: ['unit', params],
		queryFn: () => GetUnit(params.id)
	})
}
