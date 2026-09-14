import { GetRankPromotionProposals } from '@/api'
import type { rank_promotion_proposals } from '@/api/client'
import { useQuery } from '@tanstack/react-query'

export default function useRankPromotionProposals(
	params?: rank_promotion_proposals.GetRankPromotionProposalsQuery,
	options?: { enabled?: boolean }
) {
	return useQuery({
		queryKey: ['rank-promotion-proposals', params],
		queryFn: () => GetRankPromotionProposals(params),
		enabled: options?.enabled
	})
}
