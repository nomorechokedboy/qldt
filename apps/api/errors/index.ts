import log from 'encore.dev/log'
import { mapAppErrorToAPIError } from '../utils/index'

// A stable, machine-readable cause the web UI translates into the user's own
// language. `message` stays as the English text for logs and API consumers;
// `reason` (snake_case, e.g. 'transfer_not_pending') plus `params` (the values
// the sentence needs) travel to the client in the error `details`.
export interface AppErrorMeta {
	reason: string
	params?: Record<string, string | number>
}

export class AppError extends Error {
	constructor(
		public readonly type: AppErrorType,
		public readonly message: string,
		public readonly meta?: AppErrorMeta
	) {
		super(message)
		this.name = 'AppError'
	}

	public static alreadyExists(msg: string, meta?: AppErrorMeta) {
		return new AppError('AlreadyExists', msg, meta)
	}

	public static invalidArgument(msg: string, meta?: AppErrorMeta) {
		return new AppError('InvalidArgument', msg, meta)
	}

	public static unavailable(msg: string, meta?: AppErrorMeta) {
		return new AppError('Unavailable', msg, meta)
	}

	public static permissionDenied(msg: string, meta?: AppErrorMeta) {
		return new AppError('PermissionDenied', msg, meta)
	}

	public static internal(msg: string, meta?: AppErrorMeta) {
		return new AppError('InternalError', msg, meta)
	}

	public static umimplemented(msg: string, meta?: AppErrorMeta) {
		return new AppError('Unimplemented', msg, meta)
	}

	public static unauthenticated(msg: string, meta?: AppErrorMeta) {
		return new AppError('Unauthenticated', msg, meta)
	}

	public static notFound(msg: string, meta?: AppErrorMeta) {
		return new AppError('NotFound', msg, meta)
	}

	public static unauthorized(msg: string, meta?: AppErrorMeta) {
		return new AppError('Unauthorized', msg, meta)
	}

	public static handleAppErr(err: unknown): never {
		console.error('handleAppErr - err:', err)

		log.error('Error from handleAppErr!', { err })

		if (err instanceof AppError) {
			throw mapAppErrorToAPIError(err)
		}

		// fallback (not expected to reach here)
		throw AppError.internal('Unknown error')
	}
}

export type AppErrorType =
	| 'AlreadyExists'
	| 'InternalError'
	| 'InvalidArgument'
	| 'NotFound'
	| 'PermissionDenied'
	| 'Unavailable'
	| 'Unimplemented'
	| 'Unauthenticated'
	| 'Unauthorized'
