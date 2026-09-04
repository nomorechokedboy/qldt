import { useMutation } from '@tanstack/react-query'
import { UnlockLogin } from '@/api'

export function useUnlockUser() {
	return useMutation({
		mutationFn: (username: string) => UnlockLogin(username)
	})
}
