import { GetLockedLoginUsernames } from '@/api'
import { useQuery } from '@tanstack/react-query'

export const LOCKED_USERS_QUERY_KEY = ['users', 'locked'] as const

export default function useLockedUsers() {
	return useQuery({
		queryKey: LOCKED_USERS_QUERY_KEY,
		queryFn: GetLockedLoginUsernames,
		refetchInterval: 30 * 1000
	})
}
