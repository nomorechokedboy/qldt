import { toast } from 'sonner'
import { ErrCode, isAPIError } from '@/api/client'
import i18n from '@/i18n'

// Spelled out because Vietnamese is the only language the server writes
// hand-made messages in (see getErrorMessage).
const VIETNAMESE_DIACRITICS =
	/[àáạảãăằắặẳẵâầấậẩẫèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i

type Params = Record<string, string | number>

function readReason(
	details: unknown
): { reason: string; params: Params } | undefined {
	if (typeof details !== 'object' || details === null) return undefined
	const { reason, params } = details as { reason?: unknown; params?: unknown }
	if (typeof reason !== 'string') return undefined

	return {
		reason,
		params:
			typeof params === 'object' && params !== null
				? (params as Params)
				: {}
	}
}

// A few params name a thing (a column, a field, a side of a transfer) rather
// than carry a value, so they are turned into words in the active language.
function localizeParams(reason: string, params: Params): Params {
	const out: Params = { ...params }

	if (reason === 'unique_violation') {
		const key = String(params.field ?? '').replace('.', '_')
		out.field = i18n.exists(`errors:fields.${key}`)
			? i18n.t(`errors:fields.${key}`)
			: i18n.t('errors:fields.unknown')
	}
	if (reason === 'too_long') {
		const field = String(params.field ?? '')
		out.field = i18n.exists(`errors:fieldNames.${field}`)
			? i18n.t(`errors:fieldNames.${field}`)
			: field
	}
	if (
		'side' in params ||
		reason === 'unit_not_found' ||
		reason === 'transfer_unit_level_too_small'
	) {
		const side = String(params.side ?? '')
		// Leading space so the sentence reads the same with no side at all.
		out.side = i18n.exists(`errors:sides.${side}`)
			? ` ${i18n.t(`errors:sides.${side}`)}`
			: ''
	}

	return out
}

// What went wrong, in the user's language, or undefined when the error says
// nothing worth showing (a bug in this app rather than a failed request).
export function describeApiError(err: unknown): string | undefined {
	if (isAPIError(err)) {
		const detail = readReason(err.details)
		if (detail && i18n.exists(`errors:reasons.${detail.reason}`)) {
			return i18n.t(`errors:reasons.${detail.reason}`, {
				...localizeParams(detail.reason, detail.params),
				interpolation: { escapeValue: false }
			})
		}

		// Hand-written Vietnamese messages from the server (e.g. trooper
		// validation) are already specific, so they beat a generic sentence.
		if (i18n.language === 'vi' && VIETNAMESE_DIACRITICS.test(err.message)) {
			return err.message
		}

		switch (err.code) {
			case ErrCode.InvalidArgument:
			case ErrCode.OutOfRange:
			case ErrCode.FailedPrecondition:
				return i18n.t('errors:codes.invalid_argument')
			case ErrCode.NotFound:
				return i18n.t('errors:codes.not_found')
			case ErrCode.AlreadyExists:
				return i18n.t('errors:codes.already_exists')
			case ErrCode.PermissionDenied:
				return i18n.t('errors:codes.permission_denied')
			case ErrCode.Unauthenticated:
				return i18n.t('errors:codes.unauthenticated')
			case ErrCode.Unavailable:
				return i18n.t('errors:codes.unavailable')
			default:
				return i18n.t('errors:codes.internal')
		}
	}

	// fetch rejects with a TypeError when the request never got an answer.
	if (err instanceof TypeError) return i18n.t('errors:codes.network')

	return undefined
}

// The action that failed is the title; the reason, when there is one, tells
// the user what to change.
export function toastApiError(title: string, err: unknown) {
	const description = describeApiError(err)
	toast.error(title, description ? { description } : undefined)
}
