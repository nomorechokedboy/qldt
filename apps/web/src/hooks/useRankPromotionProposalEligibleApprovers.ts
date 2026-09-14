import { GetRankPromotionProposalEligibleApprovers } from '@/api'
import type { rank_promotion_proposals } from '@/api/client'
import { useQuery } from '@tanstack/react-query'

export default function useRankPromotionProposalEligibleApprovers(
	params: rank_promotion_proposals.GetRankPromotionProposalEligibleApproversQuery | null,
	options?: { enabled?: boolean }
) {
	return useQuery({
		queryKey: ['rank-promotion-proposal-eligible-approvers', params],
		queryFn: () => GetRankPromotionProposalEligibleApprovers(params!),
		enabled: (options?.enabled ?? true) && params !== null
	})
}
