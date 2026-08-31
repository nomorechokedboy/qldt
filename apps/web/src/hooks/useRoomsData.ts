import { GetRooms } from '@/api'
import type { facilities } from '@/api/client'
import { useQuery } from '@tanstack/react-query'

export default function useRoomsData(
	params?: facilities.GetRoomsQuery,
	options?: { enabled?: boolean }
) {
	return useQuery({
		queryKey: ['rooms', params],
		queryFn: () => GetRooms(params),
		enabled: options?.enabled
	})
}
