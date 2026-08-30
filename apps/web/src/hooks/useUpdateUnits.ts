import { useMutation } from '@tanstack/react-query'
import { UpdateUnits } from '@/api'
import type { UnitBody } from '@/types'

export function useUpdateUnits() {
	return useMutation({
		mutationFn: (data: (Partial<UnitBody> & { id: number })[]) =>
			UpdateUnits({ data })
	})
}
