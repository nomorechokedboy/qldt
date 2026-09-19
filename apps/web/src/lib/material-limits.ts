// Mirrors apps/api/materials/limits.ts: inventory-session QR codes must fit in
// one QR code, so the API rejects longer values.
export const MAX_MATERIAL_TYPE_NAME_LENGTH = 30
export const MAX_MATERIAL_ASSET_SERIAL_LENGTH = 20
