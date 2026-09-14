import {
	ApproveRankPromotionProposal,
	CancelRankPromotionProposal,
	RejectRankPromotionProposal
} from '@/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useApproveRankPromotionProposal() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (id: number) => ApproveRankPromotionProposal(id),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['rank-promotion-proposals']
			})
		}
	})
}

export function useRejectRankPromotionProposal() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({ id, reason }: { id: number; reason: string }) =>
			RejectRankPromotionProposal(id, reason),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['rank-promotion-proposals']
			})
		}
	})
}

export function useCancelRankPromotionProposal() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (id: number) => CancelRankPromotionProposal(id),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['rank-promotion-proposals']
			})
		}
	})
}
