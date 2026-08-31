import { GetUnitStatsMaterialStocks } from '@/api'
import { useQuery } from '@tanstack/react-query'

export default function useUnitStatsMaterialStocks(alias: string | undefined) {
	return useQuery({
		queryKey: ['unit-stats-material-stocks', alias],
		queryFn: () => GetUnitStatsMaterialStocks(alias!),
		enabled: alias !== undefined
	})
}
