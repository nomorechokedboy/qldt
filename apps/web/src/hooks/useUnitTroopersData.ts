import { GetUnitTroopers } from '@/api'
import { useQuery, type UseQueryOptions } from '@tanstack/react-query'

export default function useUnitTroopersData(
	{ id }: { id: number },
	options?: Omit<UseQueryOptions, 'queryKey' | 'queryFn'>
) {
	return useQuery({
		queryKey: ['unitTroopers', id],
		queryFn: () => GetUnitTroopers({ id })
	})
}
