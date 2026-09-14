import { GetRankPromotionProposal } from '@/api'
import { useQuery } from '@tanstack/react-query'

export default function useRankPromotionProposal(id: number | null) {
	return useQuery({
		queryKey: ['rank-promotion-proposals', 'detail', id],
		queryFn: () => GetRankPromotionProposal(id as number),
		enabled: id !== null
	})
}
