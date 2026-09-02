import { CreateTransferRequest } from '@/api'
import type { transfer_requests } from '@/api/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useCreateTransferRequest() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (body: transfer_requests.CreateTransferRequestBody) =>
			CreateTransferRequest(body),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['transfer-requests'] })
		}
	})
}
