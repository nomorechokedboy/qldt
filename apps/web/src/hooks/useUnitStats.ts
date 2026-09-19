import { GetUnitStats } from '@/api'
import { useQuery } from '@tanstack/react-query'

export default function useUnitStats(id: number | undefined) {
	return useQuery({
		queryKey: ['unit-stats', id],
		queryFn: () => GetUnitStats(id!),
		enabled: id !== undefined
	})
}
