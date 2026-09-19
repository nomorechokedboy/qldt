import { createHmac, timingSafeEqual } from 'crypto'
import { appConfig } from '../configs'
import { AppError } from '../errors'
import { MaterialConditionName } from '../schema/material-stocks'

// See docs/superpowers/specs/2026-09-09-scan-reconciliation-design.md for
// why a single static QR (no multi-frame reassembly) is sufficient at
// platoon-armory scale, and why an HMAC signature is enough integrity
// protection given the phone never authenticates to apps/api. v2 added bulk
// stock counting alongside serialized assets - see
// docs/superpowers/specs/2026-09-10-inventory-session-stock-counts-design.md.
//
// v3 is the compact wire format: a single QR at level L holds at most 2,953
// bytes, and repeating every item's JSON keys and material type name blew
// past that for a ~40-asset room. Items are positional tuples, material type
// names are sent once in `types`, and conditions are sent as a code.
// apps/scan-app/src/lib/payload.ts mirrors these constants and tuple layouts.
export const INVENTORY_SESSION_PAYLOAD_VERSION = 3 as const

// Positions in this list ARE the wire codes - never reorder, only append.
export const CONDITION_CODES: readonly MaterialConditionName[] = [
	'good',
	'fair',
	'needs_maintenance',
	'damaged'
]

// Human-readable shapes: what the rest of the app works with.
export interface InventorySessionChallengeAsset {
	serial: string
	materialTypeName: string
	condition: MaterialConditionName
}

export interface InventorySessionChallengeStock {
	materialTypeId: number
	materialTypeName: string
	condition: MaterialConditionName
	expectedQuantity: number
}

export interface InventorySessionResultItem {
	serial: string
	observedCondition?: MaterialConditionName
}

export interface InventorySessionStockResultItem {
	materialTypeId: number
	condition: MaterialConditionName
	observedQuantity: number
}

// Wire shapes (what travels in the QR codes and the results request body).
// Rows are positional arrays:
//   expected:       [serial, typeIndex, conditionCode]
//   expectedStocks: [materialTypeId, typeIndex, conditionCode, expectedQuantity]
//   results:        [serial, observedConditionCode | null]
//   stockResults:   [materialTypeId, conditionCode, observedQuantity]
// typeIndex points into `types`. They are typed as loose arrays because
// Encore's schema parser has no tuple support; the decode* functions below
// check each row's shape.
export interface InventorySessionChallengePayload {
	v: typeof INVENTORY_SESSION_PAYLOAD_VERSION
	sid: number
	roomId: number
	types: string[]
	expected: (string | number)[][]
	expectedStocks: number[][]
	// Per-session HMAC key, derived from appConfig.HASH_SECRET (see
	// deriveSessionKey below) and included here so the phone - which never
	// has HASH_SECRET itself - can sign the results payload it produces.
	// This IS "the session secret" the design doc's Integrity section refers
	// to as "embedded only in the challenge QR, never transmitted any other
	// way".
	key: string
	sig: string
}

export interface InventorySessionResultsPayload {
	v: typeof INVENTORY_SESSION_PAYLOAD_VERSION
	sid: number
	results: (string | number | null)[][]
	stockResults: number[][]
	sig: string
}

function malformed(what: string): never {
	throw AppError.handleAppErr(
		AppError.invalidArgument(`Malformed payload: ${what}`)
	)
}

function conditionToCode(condition: MaterialConditionName): number {
	const code = CONDITION_CODES.indexOf(condition)
	if (code === -1) {
		throw AppError.handleAppErr(
			AppError.invalidArgument(`Unknown condition: ${condition}`)
		)
	}
	return code
}

function codeToCondition(code: number): MaterialConditionName {
	const condition = CONDITION_CODES[code]
	if (condition === undefined) {
		throw AppError.handleAppErr(
			AppError.invalidArgument(`Unknown condition code: ${code}`)
		)
	}
	return condition
}

// Derived per-session, never transmitted itself - only the challenge QR
// (signed with it) leaves the server, so a phone can prove a results QR
// corresponds to a session it was actually challenged for without ever
// holding a server-wide secret or talking to apps/api.
function deriveSessionKey(sessionId: number): string {
	return createHmac('sha256', appConfig.HASH_SECRET)
		.update(String(sessionId))
		.digest('hex')
}

// 8 bytes (16 hex chars) - see the design doc's "Integrity" section for why
// this is enough at this payload size/threat model.
function sign(sessionId: number, canonical: string): string {
	return createHmac('sha256', deriveSessionKey(sessionId))
		.update(canonical)
		.digest('hex')
		.slice(0, 16)
}

function timingSafeEqualHex(a: string, b: string): boolean {
	if (a.length !== b.length) return false
	return timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

function canonicalChallenge(
	payload: Omit<InventorySessionChallengePayload, 'sig' | 'key'>
): string {
	return JSON.stringify({
		v: payload.v,
		sid: payload.sid,
		roomId: payload.roomId,
		types: payload.types,
		expected: payload.expected,
		expectedStocks: payload.expectedStocks
	})
}

// Tuples are positional, so unlike object items they survive Encore's
// request-body parsing (which alphabetizes object keys) unchanged - the
// canonical string the phone signed can be rebuilt as-is.
function canonicalResults(
	payload: Omit<InventorySessionResultsPayload, 'sig'>
): string {
	return JSON.stringify({
		v: payload.v,
		sid: payload.sid,
		results: payload.results,
		stockResults: payload.stockResults
	})
}

export function buildChallengePayload(
	sessionId: number,
	roomId: number,
	expected: InventorySessionChallengeAsset[],
	expectedStocks: InventorySessionChallengeStock[]
): InventorySessionChallengePayload {
	const types: string[] = []
	const typeIndex = (name: string) => {
		const existing = types.indexOf(name)
		if (existing !== -1) return existing
		types.push(name)
		return types.length - 1
	}

	const unsigned = {
		v: INVENTORY_SESSION_PAYLOAD_VERSION,
		sid: sessionId,
		roomId,
		types,
		expected: expected.map((a) => [
			a.serial,
			typeIndex(a.materialTypeName),
			conditionToCode(a.condition)
		]),
		expectedStocks: expectedStocks.map((s) => [
			s.materialTypeId,
			typeIndex(s.materialTypeName),
			conditionToCode(s.condition),
			s.expectedQuantity
		])
	}
	return {
		...unsigned,
		key: deriveSessionKey(sessionId),
		sig: sign(sessionId, canonicalChallenge(unsigned))
	}
}

export function decodeChallengePayload(
	payload: InventorySessionChallengePayload
): {
	expected: InventorySessionChallengeAsset[]
	expectedStocks: InventorySessionChallengeStock[]
} {
	const nameOf = (index: unknown) => {
		const name =
			typeof index === 'number' ? payload.types[index] : undefined
		if (name === undefined) malformed(`unknown type index ${index}`)
		return name
	}

	return {
		expected: payload.expected.map((row) => {
			const [serial, type, condition] = row
			if (typeof serial !== 'string' || typeof condition !== 'number') {
				malformed('expected row')
			}
			return {
				serial,
				materialTypeName: nameOf(type),
				condition: codeToCondition(condition)
			}
		}),
		expectedStocks: payload.expectedStocks.map((row) => {
			const [materialTypeId, type, condition, expectedQuantity] = row
			if (row.length !== 4) malformed('expectedStocks row')
			return {
				materialTypeId,
				materialTypeName: nameOf(type),
				condition: codeToCondition(condition),
				expectedQuantity
			}
		})
	}
}

// Test-only helper simulating the phone side of the round trip via Node's
// `crypto` + a live HASH_SECRET, neither of which the real phone app has.
// The real implementation (apps/scan-app, Tauri/browser environment) signs
// with the `key` field off the scanned challenge payload directly via
// Web Crypto's HMAC, instead of re-deriving it - see apps/scan-app/src/lib/payload.ts.
export function buildResultsPayload(
	sessionId: number,
	results: InventorySessionResultItem[],
	stockResults: InventorySessionStockResultItem[]
): InventorySessionResultsPayload {
	const unsigned = {
		v: INVENTORY_SESSION_PAYLOAD_VERSION,
		sid: sessionId,
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
	return { ...unsigned, sig: sign(sessionId, canonicalResults(unsigned)) }
}

export function decodeResultsPayload(payload: InventorySessionResultsPayload): {
	results: InventorySessionResultItem[]
	stockResults: InventorySessionStockResultItem[]
} {
	return {
		results: payload.results.map((row) => {
			const [serial, condition] = row
			if (
				typeof serial !== 'string' ||
				(condition !== null && typeof condition !== 'number')
			) {
				malformed('results row')
			}
			return {
				serial,
				observedCondition:
					condition === null ? undefined : codeToCondition(condition)
			}
		}),
		stockResults: payload.stockResults.map((row) => {
			const [materialTypeId, condition, observedQuantity] = row
			if (row.length !== 3) malformed('stockResults row')
			return {
				materialTypeId,
				condition: codeToCondition(condition),
				observedQuantity
			}
		})
	}
}

export function verifyResultsPayload(
	payload: InventorySessionResultsPayload
): boolean {
	const { sig, ...unsigned } = payload
	const expectedSig = sign(payload.sid, canonicalResults(unsigned))
	return timingSafeEqualHex(sig, expectedSig)
}
