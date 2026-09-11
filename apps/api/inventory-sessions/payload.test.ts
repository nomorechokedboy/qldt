import { describe, expect, it } from 'vitest'
import {
	buildChallengePayload,
	buildResultsPayload,
	verifyResultsPayload,
	InventorySessionChallengeAsset,
	InventorySessionChallengeStock
} from './payload'
import { computeInventorySessionDiff } from './diff'
import { InventorySessionExpectedAssetDB } from '../schema/inventory-session-inspected-assets'
import { InventorySessionScanDB } from '../schema/inventory-session-scans'

// Proves the actual round trip this feature depends on, end to end at the
// data layer: PC builds a challenge -> phone (simulated, no real device)
// scans it offline and produces results -> PC verifies + diffs. This is the
// part of the design that carried real risk (signature scheme, payload
// shape, diff correctness) - QR rendering/decoding itself is a solved
// library problem and isn't exercised here.
describe('inventory session challenge/results round trip', () => {
	const expectedAssets: InventorySessionChallengeAsset[] = [
		{ serial: 'A808834', materialTypeName: 'AK', condition: 'good' },
		{ serial: 'KZ08029', materialTypeName: 'AK', condition: 'good' },
		{ serial: 'A081420', materialTypeName: 'M79', condition: 'fair' }
	]
	const expectedStocks: InventorySessionChallengeStock[] = [
		{
			materialTypeId: 1,
			materialTypeName: 'Đạn AK',
			condition: 'good',
			expectedQuantity: 500
		}
	]

	it('signs a challenge payload that stays under a single QR code budget', () => {
		const challenge = buildChallengePayload(
			1,
			42,
			expectedAssets,
			expectedStocks
		)

		expect(challenge.sig).toHaveLength(16)
		expect(challenge.expected).toHaveLength(3)
		expect(challenge.expectedStocks).toHaveLength(1)

		const bytes = Buffer.byteLength(JSON.stringify(challenge), 'utf8')
		// Comfortably under single-QR byte-mode capacity (~1700-2900 bytes) -
		// see the design doc's payload-size math.
		expect(bytes).toBeLessThan(1000)
	})

	// The fixture above is tiny (3 assets, 1 stock line, 2-char type names) -
	// it proves the wire shape round-trips but says nothing about whether a
	// real, near-full room's payload actually fits in one QR code. This test
	// builds a worst-case-realistic room instead: ~40 assets (the scale the
	// design doc's payload-size math assumes) and 10 stock lines, all with
	// real-length Vietnamese material type names, and checks both the
	// challenge and results payload stay under level-L byte-mode capacity
	// (2,953 bytes) - the threshold that matters now that ResultsQr.tsx and
	// qr-code-canvas.tsx render at errorCorrectionLevel 'L'.
	const QR_LEVEL_L_BYTE_CAPACITY = 2953

	const REALISTIC_MATERIAL_NAMES = [
		'Súng tiểu liên AK-47 cải tiến',
		'Súng trường tiến công M79 phóng lựu',
		'Súng máy hạng nhẹ RPD cỡ nòng 7.62mm',
		'Súng ngắn ổ quay K59 quân dụng',
		'Đạn súng bộ binh cỡ nòng 7.62x39mm',
		'Đạn súng ngắn cỡ nòng 9x19mm Parabellum',
		'Lựu đạn cầm tay phòng ngự F1',
		'Mặt nạ phòng độc cá nhân M17',
		'Áo giáp chống đạn cấp độ IIIA',
		'Ống nhòm quân sự đo xa laser'
	]

	function buildRealisticRoom() {
		const expectedAssets: InventorySessionChallengeAsset[] = Array.from(
			{ length: 40 },
			(_, i) => ({
				serial: `A${String(100000 + i).padStart(7, '0')}`,
				materialTypeName:
					REALISTIC_MATERIAL_NAMES[
						i % REALISTIC_MATERIAL_NAMES.length
					],
				condition: 'good' as const
			})
		)
		const expectedStocks: InventorySessionChallengeStock[] = Array.from(
			{ length: 10 },
			(_, i) => ({
				materialTypeId: i + 1,
				materialTypeName:
					REALISTIC_MATERIAL_NAMES[
						i % REALISTIC_MATERIAL_NAMES.length
					],
				condition: 'good' as const,
				expectedQuantity: 500 + i
			})
		)
		return { expectedAssets, expectedStocks }
	}

	it('keeps a realistic ~40-asset/10-stock-line challenge payload under the level-L QR byte budget', () => {
		const { expectedAssets, expectedStocks } = buildRealisticRoom()
		const challenge = buildChallengePayload(
			1,
			42,
			expectedAssets,
			expectedStocks
		)

		const bytes = Buffer.byteLength(JSON.stringify(challenge), 'utf8')
		expect(bytes).toBeLessThan(QR_LEVEL_L_BYTE_CAPACITY)
	})

	it('keeps a realistic ~40-asset/10-stock-line results payload under the level-L QR byte budget', () => {
		const { expectedAssets, expectedStocks } = buildRealisticRoom()

		const results = expectedAssets.map((a) => ({
			serial: a.serial,
			observedCondition: 'good' as const
		}))
		const stockResults = expectedStocks.map((s) => ({
			materialTypeId: s.materialTypeId,
			condition: s.condition,
			observedQuantity: s.expectedQuantity
		}))

		const payload = buildResultsPayload(1, results, stockResults)
		const bytes = Buffer.byteLength(JSON.stringify(payload), 'utf8')
		expect(bytes).toBeLessThan(QR_LEVEL_L_BYTE_CAPACITY)
	})

	it('signs and verifies a session with no stock lines (a room with no material_stocks rows)', () => {
		const challenge = buildChallengePayload(1, 42, expectedAssets, [])

		expect(challenge.expectedStocks).toEqual([])
		expect(verifyResultsPayload(buildResultsPayload(1, [], []))).toBe(true)
	})

	it('accepts a genuine results payload signed for the same session', () => {
		const challenge = buildChallengePayload(
			1,
			42,
			expectedAssets,
			expectedStocks
		)

		const results = buildResultsPayload(
			challenge.sid,
			[
				{ serial: 'A808834', observedCondition: 'good' }, // matched
				{ serial: 'A081420', observedCondition: 'damaged' }, // condition changed
				{ serial: 'ZZ99999', observedCondition: 'good' } // extra, unrecognized
				// KZ08029 never scanned -> missing
			],
			[{ materialTypeId: 1, condition: 'good', observedQuantity: 480 }]
		)

		expect(verifyResultsPayload(results)).toBe(true)
	})

	it('rejects a results payload tampered with after signing', () => {
		const results = buildResultsPayload(
			1,
			[{ serial: 'A808834', observedCondition: 'good' }],
			[]
		)

		const tampered = {
			...results,
			results: [
				{ serial: 'A808834', observedCondition: 'damaged' as const }
			]
		}

		expect(verifyResultsPayload(tampered)).toBe(false)
	})

	it('rejects a results payload whose stockResults were tampered with after signing', () => {
		const results = buildResultsPayload(
			1,
			[],
			[{ materialTypeId: 1, condition: 'good', observedQuantity: 480 }]
		)

		const tampered = {
			...results,
			stockResults: [
				{
					materialTypeId: 1,
					condition: 'good' as const,
					observedQuantity: 999
				}
			]
		}

		expect(verifyResultsPayload(tampered)).toBe(false)
	})

	it('rejects a genuine signature replayed under a forged session id', () => {
		const results = buildResultsPayload(
			1,
			[{ serial: 'A808834', observedCondition: 'good' }],
			[]
		)

		// Attacker takes a validly-signed payload and relabels it as belonging
		// to a different (e.g. still-open) session, keeping the original sig.
		const forged = { ...results, sid: 2 }

		expect(verifyResultsPayload(forged)).toBe(false)
	})

	it('computes the diff correctly and never blocks on extras', () => {
		const expected: InventorySessionExpectedAssetDB[] = [
			{
				id: 1,
				sessionId: 1,
				assetId: 10,
				serialNumber: 'A808834',
				conditionSnapshot: 'good',
				createdAt: '',
				updatedAt: ''
			},
			{
				id: 2,
				sessionId: 1,
				assetId: 11,
				serialNumber: 'KZ08029',
				conditionSnapshot: 'good',
				createdAt: '',
				updatedAt: ''
			},
			{
				id: 3,
				sessionId: 1,
				assetId: 12,
				serialNumber: 'A081420',
				conditionSnapshot: 'fair',
				createdAt: '',
				updatedAt: ''
			}
		]

		const scans: InventorySessionScanDB[] = [
			{
				id: 1,
				sessionId: 1,
				serialNumber: 'A808834',
				assetId: 10,
				observedCondition: 'good',
				scannedAt: ''
			},
			{
				id: 2,
				sessionId: 1,
				serialNumber: 'A081420',
				assetId: 12,
				observedCondition: 'damaged',
				scannedAt: ''
			},
			{
				id: 3,
				sessionId: 1,
				serialNumber: 'ZZ99999',
				assetId: null,
				observedCondition: 'good',
				scannedAt: ''
			}
		]

		const diff = computeInventorySessionDiff(expected, scans)
		const bySerial = new Map(diff.map((d) => [d.serial, d.status]))

		expect(bySerial.get('A808834')).toBe('matched')
		expect(bySerial.get('KZ08029')).toBe('missing')
		expect(bySerial.get('A081420')).toBe('condition_changed')
		expect(bySerial.get('ZZ99999')).toBe('extra')
		// An "extra" item is present in the diff but is just information -
		// nothing here represents a blocked/failed session state.
		expect(diff).toHaveLength(4)
	})
})
