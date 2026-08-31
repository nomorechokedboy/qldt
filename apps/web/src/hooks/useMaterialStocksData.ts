import { GetMaterialStocks } from '@/api'
import type { materials } from '@/api/client'
import { useQuery } from '@tanstack/react-query'

export default function useMaterialStocksData(
	params?: materials.GetMaterialStocksQuery,
	options?: { enabled?: boolean }
) {
	return useQuery({
		queryKey: ['material-stocks', params],
		queryFn: () => GetMaterialStocks(params),
		enabled: options?.enabled
	})
}
