import { GetUnitStatsMaterialAssets } from '@/api'
import { useQuery } from '@tanstack/react-query'

export default function useUnitStatsMaterialAssets(alias: string | undefined) {
	return useQuery({
		queryKey: ['unit-stats-material-assets', alias],
		queryFn: () => GetUnitStatsMaterialAssets(alias!),
		enabled: alias !== undefined
	})
}
