import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CreatePosition } from '@/api'
import type { positions } from '@/api/client'

export function useCreatePosition() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (body: positions.PositionBody) => CreatePosition(body),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['positions'] })
		}
	})
}
