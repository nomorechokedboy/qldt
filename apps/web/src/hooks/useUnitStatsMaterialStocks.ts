import { GetUnitStatsMaterialStocks } from '@/api'
import { useQuery } from '@tanstack/react-query'

export default function useUnitStatsMaterialStocks(id: number | undefined) {
	return useQuery({
		queryKey: ['unit-stats-material-stocks', id],
		queryFn: () => GetUnitStatsMaterialStocks(id!),
		enabled: id !== undefined
	})
}
