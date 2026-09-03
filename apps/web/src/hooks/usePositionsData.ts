import { useQuery } from '@tanstack/react-query'
import { GetPositions } from '@/api'
import type { positions } from '@/api/client'

export default function usePositionsData(
	params?: positions.GetPositionsQuery,
	options?: { enabled?: boolean }
) {
	return useQuery({
		queryKey: ['positions', params],
		queryFn: () => GetPositions(params),
		enabled: options?.enabled
	})
}
