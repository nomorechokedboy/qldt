import { GetBuildings } from '@/api'
import { useQuery } from '@tanstack/react-query'

export default function useBuildingsData(options?: { enabled?: boolean }) {
	return useQuery({
		queryKey: ['buildings'],
		queryFn: () => GetBuildings(),
		enabled: options?.enabled
	})
}
