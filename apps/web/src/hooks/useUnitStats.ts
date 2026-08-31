import { GetUnitStats } from '@/api'
import { useQuery } from '@tanstack/react-query'

export default function useUnitStats(alias: string | undefined) {
	return useQuery({
		queryKey: ['unit-stats', alias],
		queryFn: () => GetUnitStats(alias!),
		enabled: alias !== undefined
	})
}
