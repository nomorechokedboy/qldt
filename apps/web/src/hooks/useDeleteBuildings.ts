import { useMutation, useQueryClient } from '@tanstack/react-query'
import { DeleteBuildings } from '@/api'

export function useDeleteBuildings() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (ids: number[]) => DeleteBuildings(ids),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['buildings'] })
		}
	})
}
