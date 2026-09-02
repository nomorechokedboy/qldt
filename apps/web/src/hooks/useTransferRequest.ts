import { GetTransferRequest } from '@/api'
import { useQuery } from '@tanstack/react-query'

export default function useTransferRequest(id: number | null) {
	return useQuery({
		queryKey: ['transfer-requests', 'detail', id],
		queryFn: () => GetTransferRequest(id as number),
		enabled: id !== null
	})
}
