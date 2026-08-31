import { useMutation, useQueryClient } from '@tanstack/react-query'
import { UpdateRooms } from '@/api'
import type { facilities } from '@/api/client'

export function useUpdateRoom() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (body: facilities.UpdateRoomBody) => UpdateRooms(body),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['rooms'] })
			queryClient.invalidateQueries({ queryKey: ['buildings'] })
		}
	})
}
