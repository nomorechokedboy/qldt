import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CreateMaterialType } from '@/api'
import type { materials } from '@/api/client'

export function useCreateMaterialType() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (body: materials.MaterialTypeBody) =>
			CreateMaterialType(body),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['material-types'] })
		}
	})
}
