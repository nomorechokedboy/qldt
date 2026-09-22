import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
	ApplyInventorySessionResults,
	CreateInventorySession,
	GetInventorySessionReview,
	GetInventorySessionsForRoom,
	GetOpenInventorySession,
	MarkInventorySessionReviewed,
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

// Checked when a room's inventory dialog opens, so a session left open by a
// closed tab or a restarted PC can be resumed instead of starting a
// duplicate one. Not refetched in the background - only relevant at the
// moment the dialog opens.
export function useOpenInventorySession(
	roomId: number | undefined,
	options?: { enabled?: boolean }
) {
	return useQuery({
		queryKey: ['inventory-session-open', roomId],
		queryFn: () => GetOpenInventorySession(roomId as number),
		enabled: (options?.enabled ?? true) && roomId !== undefined,
		staleTime: 0,
		refetchOnWindowFocus: false
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

// Terminal step of the flow: a reviewer signs off on the diff shown by
// useInventorySessionReview. Does not itself touch material_assets.
export function useMarkInventorySessionReviewed() {
	return useMutation({
		mutationFn: (id: number) => MarkInventorySessionReviewed(id)
	})
}

// The reviewer's explicit follow-up step after markReviewed - syncs the
// diff into material_assets/material_stocks (missing -> lost and condition
// changes apply automatically server-side; extra assets/stock lines only for
// whatever resolutions the caller passes). Invalidates the stocks/assets
// lists on success: nothing else notifies an already-mounted view (e.g. a
// company's facilities tab open behind this dialog) that quantities or
// asset statuses just changed underneath it.
export function useApplyInventorySessionResults() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: ({
			id,
			...params
		}: {
			id: number
		} & inventory_sessions.ApplyInventorySessionResultsParams) =>
			ApplyInventorySessionResults(id, params),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['material-stocks'] })
			queryClient.invalidateQueries({ queryKey: ['material-assets'] })
		}
	})
}

// Backs the room's "Lịch sử kiểm kê" history sheet - filtered (status, date
// range) and paginated, newest first. Session summaries only; a given
// session's diff is fetched separately (useInventorySessionReview) only once
// a reviewer expands that entry.
export function useInventorySessionsForRoom(
	roomId: number | undefined,
	params: inventory_sessions.GetInventorySessionsForRoomParams,
	options?: { enabled?: boolean }
) {
	return useQuery({
		queryKey: ['inventory-sessions-for-room', roomId, params],
		queryFn: () => GetInventorySessionsForRoom(roomId as number, params),
		enabled: (options?.enabled ?? true) && roomId !== undefined
	})
}
