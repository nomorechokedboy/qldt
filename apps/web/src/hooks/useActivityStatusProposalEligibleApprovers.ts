import { GetActivityStatusProposalEligibleApprovers } from '@/api'
import type { activity_status_proposals } from '@/api/client'
import { useQuery } from '@tanstack/react-query'

export default function useActivityStatusProposalEligibleApprovers(
	params: activity_status_proposals.GetActivityStatusProposalEligibleApproversQuery | null,
	options?: { enabled?: boolean }
) {
	return useQuery({
		queryKey: ['activity-status-proposal-eligible-approvers', params],
		queryFn: () => GetActivityStatusProposalEligibleApprovers(params!),
		enabled: (options?.enabled ?? true) && params !== null
	})
}
