import { GetActivityStatusProposal } from '@/api'
import { useQuery } from '@tanstack/react-query'

export default function useActivityStatusProposal(id: number | null) {
	return useQuery({
		queryKey: ['activity-status-proposals', 'detail', id],
		queryFn: () => GetActivityStatusProposal(id as number),
		enabled: id !== null
	})
}
