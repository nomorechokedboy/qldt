import { GetTransferRequests } from '@/api'
import type { transfer_requests } from '@/api/client'
import { useQuery } from '@tanstack/react-query'

export default function useTransferRequests(
	params?: transfer_requests.GetTransferRequestsQuery
) {
	return useQuery({
		queryKey: ['transfer-requests', params],
		queryFn: () => GetTransferRequests(params)
	})
}
