import { GetUnitStatsPeriod } from '@/api'
import { useQuery } from '@tanstack/react-query'

export default function useUnitStatsPeriod(
	id: number | undefined,
	range: { from: string; to: string }
) {
	return useQuery({
		queryKey: ['unit-stats-period', id, range.from, range.to],
		queryFn: () => GetUnitStatsPeriod(id!, range.from, range.to),
		enabled: id !== undefined
	})
}
