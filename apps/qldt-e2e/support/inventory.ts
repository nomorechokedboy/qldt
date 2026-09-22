import { createHmac } from 'node:crypto'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// The app renders results QR codes with QRCode.toCanvas in the browser; the
// test borrows the same package from apps/web (Node's own toBuffer needs no
// canvas) to build the still image the scanner's upload fallback decodes -
// see support/spreadsheet.ts for the same borrowing pattern with xlsx.
const requireFromWeb = createRequire(
	path.resolve(
		path.dirname(fileURLToPath(import.meta.url)),
		'../../web/package.json'
	)
)
const QRCode = requireFromWeb('qrcode') as typeof import('qrcode')

// Positional condition codes, from apps/api/inventory-sessions/payload.ts -
// never reorder, only append there.
export const GOOD = 0
export const FAIR = 1
export const NEEDS_MAINTENANCE = 2
export const DAMAGED = 3

// The wire shape POST /inventory-sessions responds with (see
// apps/api/inventory-sessions/payload.ts InventorySessionChallengePayload).
export interface Challenge {
	v: 3
	sid: number
	roomId: number
	types: string[]
	expected: [serial: string, typeIndex: number, conditionCode: number][]
	expectedStocks: [
		materialTypeId: number,
		typeIndex: number,
		conditionCode: number,
		expectedQuantity: number
	][]
	key: string
	sig: string
}

// Signs a results payload the same way the phone app does (see
// apps/scan-app/src/lib/payload.ts's signResults): HMAC-SHA256 keyed by the
// challenge's own per-session `key`, taken as raw UTF-8 bytes of that hex
// string (not hex-decoded) - Node's createHmac(string) already does this,
// so it doubles as a from-scratch reimplementation of the phone's signing
// step rather than a shortcut through it.
function sign(key: string, unsigned: object): string {
	return createHmac('sha256', key)
		.update(JSON.stringify(unsigned))
		.digest('hex')
		.slice(0, 16)
}

// Stands in for a trooper's offline count on the phone: builds a signed
// results payload the test controls directly, so a chapter can drive a
// specific mix of matched/missing/extra lines without a real camera or
// device. `assets` omits a serial entirely to mean "not found" (missing);
// `stocks` always lists every line the test wants counted, since an
// uncounted stock line silently reads as zero on the server, not "skip".
export function buildResults(
	challenge: Challenge,
	options: {
		assets?: [serial: string, conditionCode: number | null][]
		stocks?: [
			materialTypeId: number,
			conditionCode: number,
			observedQuantity: number
		][]
	}
) {
	const unsigned = {
		v: 3,
		sid: challenge.sid,
		results: options.assets ?? [],
		stockResults: options.stocks ?? []
	}
	return { ...unsigned, sig: sign(challenge.key, unsigned) }
}

// Renders a results payload as a QR code PNG - the same image the phone
// shows on screen - so the test can feed it through the scanner's "upload a
// photo instead" fallback rather than needing a real webcam.
export function resultsQrPng(payload: unknown): Promise<Buffer> {
	return QRCode.toBuffer(JSON.stringify(payload), {
		errorCorrectionLevel: 'L',
		margin: 2,
		width: 320
	})
}
