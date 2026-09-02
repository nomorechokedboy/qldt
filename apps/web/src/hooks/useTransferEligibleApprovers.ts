import { GetTransferEligibleApprovers } from '@/api'
import type { transfer_requests } from '@/api/client'
import { useQuery } from '@tanstack/react-query'

export default function useTransferEligibleApprovers(
	params: transfer_requests.GetTransferEligibleApproversQuery | null,
	options?: { enabled?: boolean }
) {
	return useQuery({
		queryKey: ['transfer-eligible-approvers', params],
		queryFn: () => GetTransferEligibleApprovers(params!),
		enabled: (options?.enabled ?? true) && params !== null
	})
}
