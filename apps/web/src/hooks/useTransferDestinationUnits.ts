import { GetTransferDestinationUnits } from '@/api'
import { useQuery } from '@tanstack/react-query'

export default function useTransferDestinationUnits(options?: {
	enabled?: boolean
}) {
	return useQuery({
		queryKey: ['transfer-destination-units'],
		queryFn: () => GetTransferDestinationUnits(),
		enabled: options?.enabled
	})
}
