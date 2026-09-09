import { useMutation, useQuery } from '@tanstack/react-query'
import {
	CreateInventorySession,
	GetInventorySessionReview,
	SubmitInventorySessionResults
} from '@/api'
import type { inventory_sessions } from '@/api/client'

export function useCreateInventorySession() {
	return useMutation({
		mutationFn: (roomId: number) => CreateInventorySession(roomId)
	})
}

export function useSubmitInventorySessionResults() {
	return useMutation({
		mutationFn: (
			payload: inventory_sessions.InventorySessionResultsPayload
		) => SubmitInventorySessionResults(payload)
	})
}

export function useInventorySessionReview(
	sessionId: number | undefined,
	options?: { enabled?: boolean }
) {
	return useQuery({
		queryKey: ['inventory-session-review', sessionId],
		queryFn: () => GetInventorySessionReview(sessionId as number),
		enabled: (options?.enabled ?? true) && sessionId !== undefined
	})
}
