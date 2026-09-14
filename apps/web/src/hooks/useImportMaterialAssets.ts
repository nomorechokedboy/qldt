import { CreateMaterialAssets } from '@/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export default function useImportMaterialAssets() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: CreateMaterialAssets,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['material-assets'] })
		}
	})
}
