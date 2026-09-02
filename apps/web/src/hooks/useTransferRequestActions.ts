import {
	ApproveTransferRequest,
	CancelTransferRequest,
	RejectTransferRequest
} from '@/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useApproveTransferRequest() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (id: number) => ApproveTransferRequest(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['transfer-requests'] })
		}
	})
}

export function useRejectTransferRequest() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({ id, reason }: { id: number; reason: string }) =>
			RejectTransferRequest(id, reason),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['transfer-requests'] })
		}
	})
}

export function useCancelTransferRequest() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (id: number) => CancelTransferRequest(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['transfer-requests'] })
		}
	})
}
