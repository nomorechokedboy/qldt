import { useMutation, useQueryClient } from '@tanstack/react-query'
import { DeleteMaterialTypes } from '@/api'

export function useDeleteMaterialTypes() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (ids: number[]) => DeleteMaterialTypes(ids),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['material-types'] })
		}
	})
}
