import { useCallback, useState } from 'react'
import { clearSession, loadSession, saveSession } from '@/lib/storage'
import type { SessionState } from '@/lib/storage'

// Thin state wrapper around the localStorage-backed session (see
// src/lib/storage.ts) - each route reads/writes through this instead of a
// router-level context, since localStorage is already this app's single
// source of truth for "what session is in progress" across app restarts.
export default function useInventorySession() {
	const [session, setSessionState] = useState<SessionState | null>(() =>
		loadSession()
	)

	const setSession = useCallback((next: SessionState | null) => {
		if (next) saveSession(next)
		else clearSession()
		setSessionState(next)
	}, [])

	return { session, setSession }
}
