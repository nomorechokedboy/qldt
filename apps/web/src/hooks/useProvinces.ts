import { GetProvinces } from '@/api'
import { useQuery } from '@tanstack/react-query'

export default function useProvinces(options?: { enabled?: boolean }) {
	return useQuery({
		queryKey: ['provinces'],
		queryFn: () => GetProvinces(),
		enabled: options?.enabled
	})
}
