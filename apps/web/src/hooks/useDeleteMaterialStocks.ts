import { useMutation, useQueryClient } from '@tanstack/react-query'
import { DeleteMaterialStocks } from '@/api'

export function useDeleteMaterialStocks() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (ids: number[]) => DeleteMaterialStocks(ids),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['material-stocks'] })
		}
	})
}
