import { useMutation, useQueryClient } from '@tanstack/react-query'
import { UpdateMaterialStocks } from '@/api'
import type { materials } from '@/api/client'

export function useUpdateMaterialStock() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (data: materials.UpdateMaterialStockBody['data']) =>
			UpdateMaterialStocks(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['material-stocks'] })
		}
	})
}
