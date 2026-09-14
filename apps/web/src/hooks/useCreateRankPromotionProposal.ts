import { CreateRankPromotionProposal } from '@/api'
import type { rank_promotion_proposals } from '@/api/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useCreateRankPromotionProposal() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (
			body: rank_promotion_proposals.CreateRankPromotionProposalBody
		) => CreateRankPromotionProposal(body),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['rank-promotion-proposals']
			})
		}
	})
}
