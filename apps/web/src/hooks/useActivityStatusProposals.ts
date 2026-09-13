import { GetActivityStatusProposals } from '@/api'
import type { activity_status_proposals } from '@/api/client'
import { useQuery } from '@tanstack/react-query'

export default function useActivityStatusProposals(
	params?: activity_status_proposals.GetActivityStatusProposalsQuery
) {
	return useQuery({
		queryKey: ['activity-status-proposals', params],
		queryFn: () => GetActivityStatusProposals(params)
	})
}
