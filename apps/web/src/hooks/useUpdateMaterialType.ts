import { useMutation, useQueryClient } from '@tanstack/react-query'
import { UpdateMaterialTypes } from '@/api'
import type { materials } from '@/api/client'

export function useUpdateMaterialType() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (body: materials.UpdateMaterialTypeBody) =>
			UpdateMaterialTypes(body),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['material-types'] })
		}
	})
}
