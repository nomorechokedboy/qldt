import { IsInitRootUnit } from '@/api'
import { useQuery } from '@tanstack/react-query'

export default function useIsInitRootUnit() {
	return useQuery({
		queryKey: ['isInitRootUnit'],
		queryFn: IsInitRootUnit,
		retry: false,
		refetchOnWindowFocus: false
	})
}
