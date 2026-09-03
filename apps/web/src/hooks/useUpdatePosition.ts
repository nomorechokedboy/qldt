import { useMutation, useQueryClient } from '@tanstack/react-query'
import { UpdatePositions } from '@/api'
import type { positions } from '@/api/client'

export function useUpdatePosition() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (body: positions.UpdatePositionBody) =>
			UpdatePositions(body),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['positions'] })
		}
	})
}
