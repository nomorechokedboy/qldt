import { createHmac, timingSafeEqual } from 'crypto'
import { appConfig } from '../configs'
import { MaterialConditionName } from '../schema/material-stocks'

// See docs/superpowers/specs/2026-09-09-scan-reconciliation-design.md for
// why a single static QR (no multi-frame reassembly) is sufficient at
// platoon-armory scale, and why an HMAC signature is enough integrity
// protection given the phone never authenticates to apps/api.
export const INVENTORY_SESSION_PAYLOAD_VERSION = 1 as const

export interface InventorySessionChallengeAsset {
	serial: string
	materialTypeName: string
	condition: MaterialConditionName
}

export interface InventorySessionChallengePayload {
	v: typeof INVENTORY_SESSION_PAYLOAD_VERSION
	sid: number
	roomId: number
	expected: InventorySessionChallengeAsset[]
	// Per-session HMAC key, derived from appConfig.HASH_SECRET (see
	// deriveSessionKey below) and included here so the phone - which never
	// has HASH_SECRET itself - can sign the results payload it produces.
	// This IS "the session secret" the design doc's Integrity section refers
	// to as "embedded only in the challenge QR, never transmitted any other
	// way".
	key: string
	sig: string
}

export interface InventorySessionResultItem {
	serial: string
	observedCondition?: MaterialConditionName
}

export interface InventorySessionResultsPayload {
	v: typeof INVENTORY_SESSION_PAYLOAD_VERSION
	sid: number
	results: InventorySessionResultItem[]
	sig: string
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
	payload: Omit<InventorySessionChallengePayload, 'sig'>
): string {
	return JSON.stringify({
		v: payload.v,
		sid: payload.sid,
		roomId: payload.roomId,
		expected: payload.expected
	})
}

function canonicalResults(
	payload: Omit<InventorySessionResultsPayload, 'sig'>
): string {
	return JSON.stringify({
		v: payload.v,
		sid: payload.sid,
		// Rebuild each item with an explicit key order rather than passing
		// `payload.results` straight through - Encore's request-body parsing
		// reconstructs incoming JSON objects with alphabetized keys
		// (observedCondition before serial), not the wire order the phone
		// actually signed with. Passing the reordered objects to
		// JSON.stringify silently produces a different canonical string (and
		// thus signature) than the phone computed, even when every value
		// matches. Caught by comparing a live device's signed `results`
		// field against the backend's canonicalized string side by side.
		results: payload.results.map((r) => ({
			serial: r.serial,
			observedCondition: r.observedCondition
		}))
	})
}

export function buildChallengePayload(
	sessionId: number,
	roomId: number,
	expected: InventorySessionChallengeAsset[]
): InventorySessionChallengePayload {
	const unsigned = {
		v: INVENTORY_SESSION_PAYLOAD_VERSION,
		sid: sessionId,
		roomId,
		expected
	}
	return {
		...unsigned,
		key: deriveSessionKey(sessionId),
		sig: sign(sessionId, canonicalChallenge(unsigned))
	}
}

// Test-only helper simulating the phone side of the round trip via Node's
// `crypto` + a live HASH_SECRET, neither of which the real phone app has.
// The real implementation (apps/scan-app, Tauri/browser environment) signs
// with the `key` field off the scanned challenge payload directly via
// Web Crypto's HMAC, instead of re-deriving it - see apps/scan-app/src/lib/payload.ts.
export function buildResultsPayload(
	sessionId: number,
	results: InventorySessionResultItem[]
): InventorySessionResultsPayload {
	const unsigned = {
		v: INVENTORY_SESSION_PAYLOAD_VERSION,
		sid: sessionId,
		results
	}
	return { ...unsigned, sig: sign(sessionId, canonicalResults(unsigned)) }
}

export function verifyResultsPayload(
	payload: InventorySessionResultsPayload
): boolean {
	const { sig, ...unsigned } = payload
	const expectedSig = sign(payload.sid, canonicalResults(unsigned))
	return timingSafeEqualHex(sig, expectedSig)
}
