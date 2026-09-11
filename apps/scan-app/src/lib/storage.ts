import { isValidChallengePayload } from './payload'
import type { ChallengePayload, ResultsPayload } from './payload'
import type { ScanEntry } from './diff'

const STORAGE_KEY = 'inventory-session:current'
const RESULTS_KEY = 'inventory-session:results'

export interface SessionState {
	challenge: ChallengePayload
	scans: Record<string, ScanEntry>
	stockCounts: Record<string, number>
}

// Persisted via the webview's localStorage, not a Tauri plugin - this app
// only ever has one session in flight at a time, so a single key is enough.
// Survives an app kill mid-session (see the design doc's error handling
// section) since localStorage is disk-backed by the WebView, not memory-only.
export function loadSession(): SessionState | null {
	try {
		const raw = localStorage.getItem(STORAGE_KEY)
		if (!raw) return null
		const parsed = JSON.parse(raw) as SessionState
		// A session persisted by an older build of this app (e.g. from before
		// the challenge payload's `key` field existed) must not be silently
		// resumed - it would sign results with a broken key and the backend
		// would reject them with a confusing "invalid signature" error.
		if (!isValidChallengePayload(parsed?.challenge)) {
			localStorage.removeItem(STORAGE_KEY)
			return null
		}
		// A session persisted before stock counting existed (or with an empty
		// object omitted by some serializer) has no `stockCounts` at all -
		// default it to `{}` rather than resuming with `undefined`, which
		// would throw in computeStockDiff's `Object.keys(counts)` call.
		return { ...parsed, stockCounts: parsed.stockCounts ?? {} }
	} catch {
		return null
	}
}

export function saveSession(state: SessionState): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
	} catch {
		// Best-effort - losing persistence still leaves the in-memory session
		// usable for the rest of this run, it just won't survive a restart.
	}
}

export function clearSession(): void {
	try {
		localStorage.removeItem(STORAGE_KEY)
	} catch {
		// no-op
	}
}

// Signed results payload, held separately from the session so the
// checklist->results navigation doesn't need to pass a ~1KB blob through
// router search params - the results route just re-reads it from storage.
export function loadResultsPayload(): ResultsPayload | null {
	try {
		const raw = localStorage.getItem(RESULTS_KEY)
		if (!raw) return null
		return JSON.parse(raw) as ResultsPayload
	} catch {
		return null
	}
}

export function saveResultsPayload(payload: ResultsPayload): void {
	try {
		localStorage.setItem(RESULTS_KEY, JSON.stringify(payload))
	} catch {
		// no-op - worst case the results route has nothing to show and the
		// trooper re-finishes the checklist to regenerate it.
	}
}

export function clearResultsPayload(): void {
	try {
		localStorage.removeItem(RESULTS_KEY)
	} catch {
		// no-op
	}
}
