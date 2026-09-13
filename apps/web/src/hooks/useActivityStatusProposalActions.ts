import {
	ApproveActivityStatusProposal,
	CancelActivityStatusProposal,
	RejectActivityStatusProposal
} from '@/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useApproveActivityStatusProposal() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (id: number) => ApproveActivityStatusProposal(id),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['activity-status-proposals']
			})
		}
	})
}

export function useRejectActivityStatusProposal() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({ id, reason }: { id: number; reason: string }) =>
			RejectActivityStatusProposal(id, reason),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['activity-status-proposals']
			})
		}
	})
}

export function useCancelActivityStatusProposal() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (id: number) => CancelActivityStatusProposal(id),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['activity-status-proposals']
			})
		}
	})
}
