import { GetMaterialAssets } from '@/api'
import type { materials } from '@/api/client'
import { useQuery } from '@tanstack/react-query'

export default function useMaterialAssetsData(
	params?: materials.GetMaterialAssetsQuery,
	options?: { enabled?: boolean }
) {
	return useQuery({
		queryKey: ['material-assets', params],
		queryFn: () => GetMaterialAssets(params),
		enabled: options?.enabled
	})
}
