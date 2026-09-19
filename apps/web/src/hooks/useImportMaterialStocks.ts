import { AddMaterialStocks } from '@/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export default function useImportMaterialStocks() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: AddMaterialStocks,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['material-stocks'] })
		}
	})
}
