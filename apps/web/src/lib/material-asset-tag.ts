import type { MaterialAsset } from '@/types'

export const MATERIAL_ASSET_TAG_VERSION = 1 as const

// Payload for a printable per-asset QR tag, stuck onto the physical
// weapon/equipment. `condition` is a snapshot at print time - a convenience
// pre-fill for the inventory-session checklist, not a source of truth,
// since a physical tag can't update itself when the real condition changes
// later. Always reviewed/overridden at scan time, never trusted blindly.
// See docs/superpowers/specs/2026-09-09-scan-reconciliation-design.md's
// "Physical QR/barcode tags on weapons (future feature, compatible but
// separate)" note - this is that feature.
export interface MaterialAssetTagPayload {
	v: typeof MATERIAL_ASSET_TAG_VERSION
	serial: string
	condition: string
}

export function buildMaterialAssetTagPayload(
	asset: MaterialAsset
): MaterialAssetTagPayload {
	return {
		v: MATERIAL_ASSET_TAG_VERSION,
		serial: asset.serialNumber,
		condition: asset.condition ?? 'good'
	}
}
