import { GetUnitStatsMaterialAssets } from '@/api'
import { useQuery } from '@tanstack/react-query'

export default function useUnitStatsMaterialAssets(id: number | undefined) {
	return useQuery({
		queryKey: ['unit-stats-material-assets', id],
		queryFn: () => GetUnitStatsMaterialAssets(id!),
		enabled: id !== undefined
	})
}
