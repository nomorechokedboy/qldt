// Wire format for the scan-reconciliation QR round trip. Mirrors
// apps/api/inventory-sessions/payload.ts byte-for-byte (same field names,
// same JSON key order in the signed canonical string) since the two sides
// never share code - this app runs in a Tauri webview (Web Crypto), the
// backend runs in Node (`crypto`). See
// docs/superpowers/specs/2026-09-09-scan-reconciliation-design.md.
export const INVENTORY_SESSION_PAYLOAD_VERSION = 1 as const

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

export interface ChallengePayload {
	v: typeof INVENTORY_SESSION_PAYLOAD_VERSION
	sid: number
	roomId: number
	expected: ChallengeAsset[]
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

export interface ResultsPayload {
	v: typeof INVENTORY_SESSION_PAYLOAD_VERSION
	sid: number
	results: ResultItem[]
	sig: string
}

function bytesToHex(bytes: Uint8Array): string {
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('')
}

// Same canonicalization as canonicalResults() in apps/api/inventory-sessions/payload.ts -
// key order matters, it's part of what gets hashed.
function canonicalResults(sid: number, results: ResultItem[]): string {
	return JSON.stringify({
		v: INVENTORY_SESSION_PAYLOAD_VERSION,
		sid,
		results
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
	results: ResultItem[]
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
		new TextEncoder().encode(canonicalResults(sid, results))
	)
	return bytesToHex(new Uint8Array(sigBuffer)).slice(0, 16)
}

export async function buildResultsPayload(
	key: string,
	sid: number,
	results: ResultItem[]
): Promise<ResultsPayload> {
	const sig = await signResults(key, sid, results)
	return { v: INVENTORY_SESSION_PAYLOAD_VERSION, sid, results, sig }
}

// Best-effort validation of a scanned challenge QR - malformed/foreign QR
// codes should re-prompt "couldn't read that", not crash the app.
export function parseChallengePayload(text: string): ChallengePayload | null {
	try {
		const obj = JSON.parse(text)
		if (
			obj?.v !== INVENTORY_SESSION_PAYLOAD_VERSION ||
			typeof obj?.sid !== 'number' ||
			typeof obj?.roomId !== 'number' ||
			typeof obj?.key !== 'string' ||
			typeof obj?.sig !== 'string' ||
			!Array.isArray(obj?.expected)
		) {
			return null
		}
		return obj as ChallengePayload
	} catch {
		return null
	}
}
