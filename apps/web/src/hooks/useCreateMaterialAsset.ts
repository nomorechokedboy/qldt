import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CreateMaterialAsset } from '@/api'
import type { materials } from '@/api/client'

export function useCreateMaterialAsset() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (body: materials.MaterialAssetBody) =>
			CreateMaterialAsset(body),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['material-assets'] })
		}
	})
}
