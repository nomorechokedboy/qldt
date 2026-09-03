import { useMutation, useQueryClient } from '@tanstack/react-query'
import { DeletePositions } from '@/api'

export function useDeletePositions() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (ids: number[]) => DeletePositions(ids),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['positions'] })
		}
	})
}
