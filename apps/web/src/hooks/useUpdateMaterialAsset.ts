import { useMutation, useQueryClient } from '@tanstack/react-query'
import { UpdateMaterialAssets } from '@/api'
import type { materials } from '@/api/client'

export function useUpdateMaterialAsset() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (data: materials.UpdateMaterialAssetBody['data']) =>
			UpdateMaterialAssets(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['material-assets'] })
			queryClient.invalidateQueries({
				queryKey: ['material-asset-events']
			})
		}
	})
}
