import { useMutation } from '@tanstack/react-query'
import { DeleteUnits } from '@/api'

export function useDeleteUnits() {
	return useMutation({
		mutationFn: (ids: number[]) => DeleteUnits(ids)
	})
}
