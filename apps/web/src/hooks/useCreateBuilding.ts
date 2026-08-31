import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CreateBuilding } from '@/api'
import type { facilities } from '@/api/client'

export function useCreateBuilding() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (body: facilities.BuildingBody) => CreateBuilding(body),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['buildings'] })
		}
	})
}
