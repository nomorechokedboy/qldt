import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CreateUnit } from '@/api'
import type { UnitBody } from '@/types'

export function useCreateUnit() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (body: UnitBody) => CreateUnit(body),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['units'] })
		}
	})
}
