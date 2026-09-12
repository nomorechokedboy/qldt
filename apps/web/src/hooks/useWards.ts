import { GetWards } from '@/api'
import { useQuery } from '@tanstack/react-query'

export default function useWards(
	provinceCode?: string,
	options?: { enabled?: boolean }
) {
	return useQuery({
		queryKey: ['wards', provinceCode],
		queryFn: () => GetWards(provinceCode ? { provinceCode } : {}),
		enabled: options?.enabled ?? provinceCode !== undefined
	})
}
