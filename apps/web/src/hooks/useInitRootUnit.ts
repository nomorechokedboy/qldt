import { useMutation, useQueryClient } from '@tanstack/react-query'
import { InitRootUnit } from '@/api'
import type { InitRootUnitBody } from '@/types'

export function useInitRootUnit() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (body: InitRootUnitBody) => InitRootUnit(body),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['isInitRootUnit'] })
		}
	})
}
