import { CreateActivityStatusProposal } from '@/api'
import type { activity_status_proposals } from '@/api/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useCreateActivityStatusProposal() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (
			body: activity_status_proposals.CreateActivityStatusProposalBody
		) => CreateActivityStatusProposal(body),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['activity-status-proposals']
			})
		}
	})
}
