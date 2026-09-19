import { AppError } from '../errors'

// Inventory-session QR codes carry these values verbatim and must fit in a
// single level-L QR code (2,953 bytes), so their length is capped where they
// are created. See inventory-sessions/payload.ts.
export const MAX_MATERIAL_TYPE_NAME_LENGTH = 30
export const MAX_MATERIAL_ASSET_SERIAL_LENGTH = 20

// Counted in characters as a person sees them: a Vietnamese letter counts
// once whether the client sent it precomposed or decomposed.
export function assertMaxLength(
	field: string,
	value: unknown,
	max: number
): void {
	if (typeof value !== 'string') return

	if ([...value.normalize('NFC')].length > max) {
		throw AppError.handleAppErr(
			AppError.invalidArgument(
				`${field} must be at most ${max} characters`
			)
		)
	}
}
