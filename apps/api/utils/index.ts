import { LibsqlError } from '@libsql/client'
import { DrizzleQueryError } from 'drizzle-orm/errors'
import { APIError } from 'encore.dev/api'
import log from 'encore.dev/log'
import * as v from 'valibot'
import { AppError } from '../errors/index'

export type SQLiteErrorCode =
	| 'SQLITE_CONSTRAINT_UNIQUE'
	| 'SQLITE_BUSY'
	| 'SQLITE_CONSTRAINT'
	| 'SQLITE_CONSTRAINT_NOTNULL'
	| 'SQLITE_READONLY'
	| 'SQLITE_CANTOPEN'
	| 'SQLITE_CORRUPT'
	| 'SQLITE_MISMATCH'
	| 'SQLITE_AUTH'
	| 'SQLITE_NOTADB'
	| 'SQLITE_RANGE'
	| 'SQLITE_TOOBIG'
	| 'SQLITE_ERROR'

// Human-readable (Vietnamese - the app's users don't read English) label for
// each column that has a UNIQUE constraint, keyed by the "table.column"
// SQLite reports in its "UNIQUE constraint failed" message - used to turn
// that into a specific "X đã được sử dụng" message instead of a generic one,
// so the end user knows exactly what to change.
const UNIQUE_FIELD_LABELS: Record<string, string> = {
	'material_assets.serialNumber': 'Số hiệu (serial) này',
	'material_types.name': 'Tên loại vật tư này',
	'units.alias': 'Mã đơn vị này',
	'units.name': 'Tên đơn vị này',
	'users.username': 'Tên đăng nhập này',
	'roles.name': 'Tên vai trò này',
	'permissions.name': 'Tên quyền này',
	'actions.name': 'Tên hành động này',
	'resources.name': 'Tên tài nguyên này'
}

function handleLibsqlError(code: SQLiteErrorCode, message?: string): AppError {
	switch (code) {
		case 'SQLITE_CONSTRAINT_UNIQUE': {
			// A composite unique index reports all its columns, comma-separated
			// (e.g. "units.alias, units.parentId") - the first is the one worth
			// naming in the error, so stop at the comma as well as whitespace.
			const field = message?.match(
				/UNIQUE constraint failed: ([^,\s]+)/
			)?.[1]
			const label = field ? UNIQUE_FIELD_LABELS[field] : undefined
			return AppError.alreadyExists(
				`${label ?? 'Giá trị này'} đã được sử dụng, vui lòng chọn giá trị khác`
			)
		}

		case 'SQLITE_ERROR':
			return AppError.internal('Internal err')

		case 'SQLITE_CONSTRAINT_NOTNULL':
			return AppError.invalidArgument('Thiếu thông tin bắt buộc')

		case 'SQLITE_BUSY':
			return AppError.unavailable('Database is busy, try again')

		case 'SQLITE_CANTOPEN':
			return AppError.internal('Could not open database file')

		case 'SQLITE_READONLY':
			return AppError.permissionDenied('Database is read-only')

		case 'SQLITE_MISMATCH':
			return AppError.internal('Type mismatch in query')

		case 'SQLITE_AUTH':
			return AppError.permissionDenied('Not authorized')

		case 'SQLITE_NOTADB':
			return AppError.internal('File is not a valid SQLite database')

		case 'SQLITE_CORRUPT':
			return AppError.internal('Database file is corrupt')

		case 'SQLITE_TOOBIG':
			return AppError.internal('Query or data too large')

		case 'SQLITE_RANGE':
			return AppError.invalidArgument('Parameter index out of range')

		case 'SQLITE_CONSTRAINT':
			return AppError.invalidArgument('Database constraint violated')

		default:
			return AppError.internal(`Unhandled SQLite error: ${code}`)
	}
}

export function mapAppErrorToAPIError(error: AppError): APIError {
	switch (error.type) {
		case 'AlreadyExists':
			return APIError.alreadyExists(error.message)
		case 'InvalidArgument':
			return APIError.invalidArgument(error.message)
		case 'Unavailable':
			return APIError.unavailable(error.message)
		case 'PermissionDenied':
			return APIError.permissionDenied(error.message)
		case 'Unimplemented':
			return APIError.unimplemented(error.message)
		case 'Unauthenticated':
			return APIError.unauthenticated(error.message)
		case 'Unauthorized':
			return APIError.permissionDenied(error.message)
		case 'NotFound':
			return APIError.notFound(error.message)
		case 'InternalError':
		default:
			return APIError.internal(error.message)
	}
}

export function handleDatabaseErr(err: unknown): never {
	log.error(err, 'handleDatabaseErr: ')

	if (!(err instanceof DrizzleQueryError)) {
		throw AppError.internal('Internal error')
	}

	const libsqlErr = err.cause
	if (!(libsqlErr instanceof LibsqlError)) {
		throw AppError.internal('Internal error')
	}

	const appErr = handleLibsqlError(
		libsqlErr.code as SQLiteErrorCode,
		libsqlErr.message
	)
	throw appErr
}

export async function getTypedRequestBody<T>(
	req: any,
	schema: v.BaseSchema<unknown, T, v.BaseIssue<unknown>>
): Promise<T> {
	const chunks: Buffer[] = []

	req.on('data', (chunk: Buffer) => {
		chunks.push(chunk)
	})

	await new Promise<void>((resolve, reject) => {
		req.on('end', () => resolve())
		req.on('error', reject)
	})

	const body = Buffer.concat(chunks).toString('utf-8')

	try {
		const rawBody = JSON.parse(body)

		const result = v.safeParse(schema, rawBody)

		if (!result.success) {
			log.error('Request body validation failed', {
				issues: result.issues
			})
			throw AppError.invalidArgument(
				`Invalid request body: ${result.issues.map((issue) => issue.message).join(', ')}`
			)
		}

		return result.output
	} catch (error) {
		if (error instanceof SyntaxError) {
			log.error('Invalid JSON in request body', { error, body })
			throw AppError.invalidArgument('Invalid JSON body')
		}
		throw error
	}
}
