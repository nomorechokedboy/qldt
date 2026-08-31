import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CreateRoom } from '@/api'
import type { facilities } from '@/api/client'

export function useCreateRoom() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (body: facilities.RoomBody) => CreateRoom(body),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['rooms'] })
			queryClient.invalidateQueries({ queryKey: ['buildings'] })
		}
	})
}
