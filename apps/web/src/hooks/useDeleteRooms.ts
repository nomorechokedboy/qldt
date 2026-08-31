import { useMutation, useQueryClient } from '@tanstack/react-query'
import { DeleteRooms } from '@/api'

export function useDeleteRooms() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (ids: number[]) => DeleteRooms(ids),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['rooms'] })
			queryClient.invalidateQueries({ queryKey: ['buildings'] })
		}
	})
}
