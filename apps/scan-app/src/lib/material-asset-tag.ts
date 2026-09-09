import type { MaterialConditionName } from './payload'

// Mirrors apps/web/src/lib/material-asset-tag.ts's MaterialAssetTagPayload -
// the printable per-asset QR tag stuck onto the physical weapon/equipment.
// `condition` is a print-time snapshot, used here only as a pre-fill
// default; the user can still change it via the normal condition buttons
// after a scan records it.
export const MATERIAL_ASSET_TAG_VERSION = 1 as const

export interface MaterialAssetTagPayload {
	v: typeof MATERIAL_ASSET_TAG_VERSION
	serial: string
	condition: MaterialConditionName
}

const VALID_CONDITIONS: MaterialConditionName[] = [
	'good',
	'fair',
	'needs_maintenance',
	'damaged'
]

// Best-effort validation of a scanned asset-tag QR - malformed/foreign QR
// codes (including a challenge QR scanned by mistake) should re-prompt
// rather than crash the app.
export function parseMaterialAssetTagPayload(
	text: string
): MaterialAssetTagPayload | null {
	try {
		const obj = JSON.parse(text)
		if (
			obj?.v !== MATERIAL_ASSET_TAG_VERSION ||
			typeof obj?.serial !== 'string' ||
			!VALID_CONDITIONS.includes(obj?.condition)
		) {
			return null
		}
		return obj as MaterialAssetTagPayload
	} catch {
		return null
	}
}
