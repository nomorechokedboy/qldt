import { GetMaterialAssetEvents } from '@/api'
import { useQuery } from '@tanstack/react-query'

export default function useMaterialAssetEvents(
	assetId?: number,
	options?: { enabled?: boolean }
) {
	return useQuery({
		queryKey: ['material-asset-events', assetId],
		queryFn: () => GetMaterialAssetEvents(assetId as number),
		enabled: (options?.enabled ?? true) && assetId !== undefined
	})
}
