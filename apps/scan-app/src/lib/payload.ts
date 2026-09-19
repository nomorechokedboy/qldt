// Wire format for the scan-reconciliation QR round trip. Mirrors
// apps/api/inventory-sessions/payload.ts byte-for-byte (same field names,
// same JSON key order in the signed canonical string) since the two sides
// never share code - this app runs in a Tauri webview (Web Crypto), the
// backend runs in Node (`crypto`). v2 adds bulk stock counting alongside
// serialized assets. v3 is the compact wire format: items are positional
// arrays, material type names are sent once in `types`, and conditions are
// sent as codes, so a full room fits in one QR code. See
// docs/superpowers/specs/2026-09-09-scan-reconciliation-design.md and
// docs/superpowers/specs/2026-09-10-inventory-session-stock-counts-design.md.
export const INVENTORY_SESSION_PAYLOAD_VERSION = 3 as const

// Positions in this list ARE the wire codes - keep identical to
// CONDITION_CODES in apps/api/inventory-sessions/payload.ts.
const CONDITION_CODES: readonly MaterialConditionName[] = [
	'good',
	'fair',
	'needs_maintenance',
	'damaged'
]

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

// What the rest of the app works with (and what is kept in localStorage):
// the challenge QR expanded back into readable items.
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

// Rows of the challenge QR, as scanned:
//   expected:       [serial, typeIndex, conditionCode]
//   expectedStocks: [materialTypeId, typeIndex, conditionCode, expectedQuantity]
interface ChallengeWire {
	v: typeof INVENTORY_SESSION_PAYLOAD_VERSION
	sid: number
	roomId: number
	types: string[]
	expected: unknown[]
	expectedStocks: unknown[]
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

// The results QR, as sent. Rows are positional arrays, matching the API:
//   results:      [serial, observedConditionCode | null]
//   stockResults: [materialTypeId, conditionCode, observedQuantity]
export interface ResultsPayload {
	v: typeof INVENTORY_SESSION_PAYLOAD_VERSION
	sid: number
	results: (string | number | null)[][]
	stockResults: number[][]
	sig: string
}

function conditionToCode(condition: MaterialConditionName): number {
	return CONDITION_CODES.indexOf(condition)
}

function codeToCondition(code: unknown): MaterialConditionName | null {
	return typeof code === 'number' ? (CONDITION_CODES[code] ?? null) : null
}

function encodeResults(
	results: ResultItem[],
	stockResults: StockResultItem[]
): Pick<ResultsPayload, 'results' | 'stockResults'> {
	return {
		results: results.map((r) => [
			r.serial,
			r.observedCondition === undefined
				? null
				: conditionToCode(r.observedCondition)
		]),
		stockResults: stockResults.map((r) => [
			r.materialTypeId,
			conditionToCode(r.condition),
			r.observedQuantity
		])
	}
}

function bytesToHex(bytes: Uint8Array): string {
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('')
}

// Same canonicalization as canonicalResults() in
// apps/api/inventory-sessions/payload.ts - key order and row layout are part
// of what gets hashed.
function canonicalResults(
	sid: number,
	results: ResultsPayload['results'],
	stockResults: ResultsPayload['stockResults']
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
	results: ResultsPayload['results'],
	stockResults: ResultsPayload['stockResults']
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
	const encoded = encodeResults(results, stockResults)
	const sig = await signResults(
		key,
		sid,
		encoded.results,
		encoded.stockResults
	)
	return {
		v: INVENTORY_SESSION_PAYLOAD_VERSION,
		sid,
		...encoded,
		sig
	}
}

// Shared by parseChallengePayload (a freshly scanned QR) and
// storage.ts's loadSession (a session resumed from localStorage after an
// app kill) - a resumed session is just as untrustworthy as a scanned QR
// until checked. Without this, a session persisted by an older build (e.g.
// a v2 session, from before the compact format) gets silently resumed with
// a broken/missing shape, producing a results signature the backend
// correctly rejects. The `v` check rejects those.
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

function expandChallenge(wire: ChallengeWire): ChallengePayload | null {
	if (
		wire.v !== INVENTORY_SESSION_PAYLOAD_VERSION ||
		typeof wire.sid !== 'number' ||
		typeof wire.roomId !== 'number' ||
		typeof wire.key !== 'string' ||
		typeof wire.sig !== 'string' ||
		!Array.isArray(wire.types) ||
		!Array.isArray(wire.expected) ||
		!Array.isArray(wire.expectedStocks)
	) {
		return null
	}

	const nameOf = (index: unknown) =>
		typeof index === 'number' ? wire.types[index] : undefined

	const expected: ChallengeAsset[] = []
	for (const row of wire.expected) {
		if (!Array.isArray(row)) return null
		const [serial, type, code] = row
		const materialTypeName = nameOf(type)
		const condition = codeToCondition(code)
		if (
			typeof serial !== 'string' ||
			materialTypeName === undefined ||
			condition === null
		) {
			return null
		}
		expected.push({ serial, materialTypeName, condition })
	}

	const expectedStocks: ChallengeStock[] = []
	for (const row of wire.expectedStocks) {
		if (!Array.isArray(row)) return null
		const [materialTypeId, type, code, expectedQuantity] = row
		const materialTypeName = nameOf(type)
		const condition = codeToCondition(code)
		if (
			typeof materialTypeId !== 'number' ||
			typeof expectedQuantity !== 'number' ||
			materialTypeName === undefined ||
			condition === null
		) {
			return null
		}
		expectedStocks.push({
			materialTypeId,
			materialTypeName,
			condition,
			expectedQuantity
		})
	}

	return {
		v: wire.v,
		sid: wire.sid,
		roomId: wire.roomId,
		expected,
		expectedStocks,
		key: wire.key,
		sig: wire.sig
	}
}

// Best-effort validation of a scanned challenge QR - malformed/foreign QR
// codes should re-prompt "couldn't read that", not crash the app.
export function parseChallengePayload(text: string): ChallengePayload | null {
	try {
		const obj = JSON.parse(text)
		if (typeof obj !== 'object' || obj === null) return null
		return expandChallenge(obj as ChallengeWire)
	} catch {
		return null
	}
}
