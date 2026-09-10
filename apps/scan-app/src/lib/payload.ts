// Wire format for the scan-reconciliation QR round trip. Mirrors
// apps/api/inventory-sessions/payload.ts byte-for-byte (same field names,
// same JSON key order in the signed canonical string) since the two sides
// never share code - this app runs in a Tauri webview (Web Crypto), the
// backend runs in Node (`crypto`). v2 adds bulk stock counting alongside
// serialized assets. See
// docs/superpowers/specs/2026-09-09-scan-reconciliation-design.md and
// docs/superpowers/specs/2026-09-10-inventory-session-stock-counts-design.md.
export const INVENTORY_SESSION_PAYLOAD_VERSION = 2 as const

export type MaterialConditionName =
	| 'good'
	| 'fair'
	| 'needs_maintenance'
	| 'damaged'

export interface ChallengeAsset {
	serial: string
	materialTypeName: string
	condition: MaterialConditionName
}

export interface ChallengeStock {
	materialTypeId: number
	materialTypeName: string
	condition: MaterialConditionName
	expectedQuantity: number
}

export interface ChallengePayload {
	v: typeof INVENTORY_SESSION_PAYLOAD_VERSION
	sid: number
	roomId: number
	expected: ChallengeAsset[]
	expectedStocks: ChallengeStock[]
	// Per-session HMAC key, embedded by the PC in the challenge QR. This app
	// never talks to apps/api and never sees HASH_SECRET - this key is the
	// only thing that lets it sign a results payload the server will accept.
	key: string
	sig: string
}

export interface ResultItem {
	serial: string
	observedCondition?: MaterialConditionName
}

export interface StockResultItem {
	materialTypeId: number
	condition: MaterialConditionName
	observedQuantity: number
}

export interface ResultsPayload {
	v: typeof INVENTORY_SESSION_PAYLOAD_VERSION
	sid: number
	results: ResultItem[]
	stockResults: StockResultItem[]
	sig: string
}

function bytesToHex(bytes: Uint8Array): string {
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('')
}

// Same canonicalization as canonicalResults() in
// apps/api/inventory-sessions/payload.ts - key order matters, it's part of
// what gets hashed. Unlike the server side, this doesn't need to rebuild
// each item with an explicit key order: these objects are constructed by
// this app right before signing (never round-tripped through Encore's
// alphabetizing request parser), so JSON.stringify's insertion-order
// behavior is already exactly the order these interfaces declare.
function canonicalResults(
	sid: number,
	results: ResultItem[],
	stockResults: StockResultItem[]
): string {
	return JSON.stringify({
		v: INVENTORY_SESSION_PAYLOAD_VERSION,
		sid,
		results,
		stockResults
	})
}

// 16 hex chars (8 bytes), matching the server's sign()/verifyResultsPayload().
//
// The `key` here is deriveSessionKey()'s output: a hex-digest *string*. The
// server's sign() passes that string straight into Node's createHmac(),
// which treats a string key as raw UTF-8 bytes of the hex characters
// themselves - NOT as hex-decoded bytes. Getting this wrong (hex-decoding
// the key before HMAC-ing) silently produces a signature the server
// rejects; verified against the real backend in
// apps/api/inventory-sessions/__scratch_wire_verify.test.ts during
// development.
async function signResults(
	key: string,
	sid: number,
	results: ResultItem[],
	stockResults: StockResultItem[]
): Promise<string> {
	const cryptoKey = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(key) as BufferSource,
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	)
	const sigBuffer = await crypto.subtle.sign(
		'HMAC',
		cryptoKey,
		new TextEncoder().encode(canonicalResults(sid, results, stockResults))
	)
	return bytesToHex(new Uint8Array(sigBuffer)).slice(0, 16)
}

export async function buildResultsPayload(
	key: string,
	sid: number,
	results: ResultItem[],
	stockResults: StockResultItem[]
): Promise<ResultsPayload> {
	const sig = await signResults(key, sid, results, stockResults)
	return {
		v: INVENTORY_SESSION_PAYLOAD_VERSION,
		sid,
		results,
		stockResults,
		sig
	}
}

// Shared by parseChallengePayload (a freshly scanned QR) and
// storage.ts's loadSession (a session resumed from localStorage after an
// app kill) - a resumed session is just as untrustworthy as a scanned QR
// until checked. Without this, a session persisted by an older build (e.g.
// a v1 session, from before `expectedStocks`/`key` existed) gets silently
// resumed with a broken/missing shape, producing a results signature the
// backend correctly rejects - the bug this was added to catch. The `v`
// check alone already rejects any pre-stock-counts (v1) session.
export function isValidChallengePayload(obj: unknown): obj is ChallengePayload {
	if (typeof obj !== 'object' || obj === null) return false
	const o = obj as Record<string, unknown>
	return (
		o.v === INVENTORY_SESSION_PAYLOAD_VERSION &&
		typeof o.sid === 'number' &&
		typeof o.roomId === 'number' &&
		typeof o.key === 'string' &&
		typeof o.sig === 'string' &&
		Array.isArray(o.expected) &&
		Array.isArray(o.expectedStocks)
	)
}

// Best-effort validation of a scanned challenge QR - malformed/foreign QR
// codes should re-prompt "couldn't read that", not crash the app.
export function parseChallengePayload(text: string): ChallengePayload | null {
	try {
		const obj = JSON.parse(text)
		return isValidChallengePayload(obj) ? obj : null
	} catch {
		return null
	}
}
