import { useMutation, useQueryClient } from '@tanstack/react-query'
import { DeleteMaterialAssets } from '@/api'

export function useDeleteMaterialAssets() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (ids: number[]) => DeleteMaterialAssets(ids),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['material-assets'] })
		}
	})
}
