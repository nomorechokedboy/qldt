import { useMutation, useQueryClient } from '@tanstack/react-query'
import { UpdateBuildings } from '@/api'
import type { facilities } from '@/api/client'

export function useUpdateBuilding() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (body: facilities.UpdateBuildingBody) =>
			UpdateBuildings(body),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['buildings'] })
		}
	})
}
