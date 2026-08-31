import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AddMaterialStock } from '@/api'
import type { materials } from '@/api/client'

export function useAddMaterialStock() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (body: materials.MaterialStockBody) =>
			AddMaterialStock(body),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['material-stocks'] })
		}
	})
}
