import type { StudentBody } from '@/types'
import { useForm, useStore } from '@tanstack/react-form'
import { useCallback, useMemo, useState } from 'react'

export interface ParseError {
	row: number
	message: string
}

// Fields a parse error can attach to. Most map onto a real review-table
// column; `_politicalOrg` is a pseudo field (no dedicated column exists for
// Đoàn/Đảng in the review table today) used only so its error still counts
// toward a row's error state - `form.setFieldMeta`/`getFieldMeta` work on
// any string key regardless of whether a `<form.Field>` for it is mounted.
export const TRACKED_ERROR_FIELDS = [
	'unitId',
	'positionId',
	'activityStatus',
	'birthPlaceProvinceCode',
	'birthPlaceWardCode',
	'addressProvinceCode',
	'addressWardCode',
	'_politicalOrg'
] as const

export type TrackedErrorField = (typeof TRACKED_ERROR_FIELDS)[number]

// Maps a parser error message (see parse-import-file.ts) back to the field
// it should be attached to, via the same substring checks the pre-migration
// code used to decide which cell's error to clear.
function errorFieldForMessage(message: string): TrackedErrorField | undefined {
	if (message.includes('đơn vị')) return 'unitId'
	if (message.includes('chức vụ')) return 'positionId'
	if (message.includes('Tình trạng')) return 'activityStatus'
	if (message.includes('Đoàn/Đảng')) return '_politicalOrg'
	if (message.includes('Quê quán')) {
		return message.startsWith('Không tìm thấy Phường/Xã')
			? 'birthPlaceWardCode'
			: 'birthPlaceProvinceCode'
	}
	if (message.includes('Trú quán')) {
		return message.startsWith('Không tìm thấy Phường/Xã')
			? 'addressWardCode'
			: 'addressProvinceCode'
	}
	return undefined
}

type FieldMetaMap = Record<string, { errors?: unknown[] } | undefined>

// Same convention as ErrorMessages in FormComponents.tsx: a manually-set
// `errorMap` entry (via `setFieldMeta`, same as student-form.tsx's
// validateAndSetErrors) carries `{ message }` objects, not bare strings -
// filtering for `typeof m === "string"` alone silently drops every one of
// them.
function errorMessage(error: unknown): string | undefined {
	if (typeof error === 'string') return error
	if (
		error &&
		typeof error === 'object' &&
		'message' in error &&
		typeof (error as { message: unknown }).message === 'string'
	) {
		return (error as { message: string }).message
	}
	return undefined
}

export function fieldErrorMessages(
	fieldMeta: FieldMetaMap,
	index: number,
	field: TrackedErrorField
): string[] {
	return (fieldMeta[`rows[${index}].${field}`]?.errors ?? [])
		.map(errorMessage)
		.filter((m): m is string => m !== undefined)
}

// Plain length check, no `fieldErrorMessages` - that helper allocates two
// throwaway arrays (map + filter) per field per row, which is wasted work
// here: `errorRowCount` below runs this over every row in the file, and its
// `useStore` selector re-runs on every single form notification (any
// keystroke/selection anywhere in the table, not just tracked fields), so
// for a several-hundred-row import that was several thousand array
// allocations on every edit - a cost `fieldErrorMessages` callers that only
// look at a handful of visible rows (RowStatusCell, collectErrors) don't
// pay in the same proportion.
function fieldHasError(
	fieldMeta: FieldMetaMap,
	index: number,
	field: TrackedErrorField
): boolean {
	const errors = fieldMeta[`rows[${index}].${field}`]?.errors
	return !!errors && errors.length > 0
}

export function rowHasError(fieldMeta: FieldMetaMap, index: number): boolean {
	return TRACKED_ERROR_FIELDS.some((field) =>
		fieldHasError(fieldMeta, index, field)
	)
}

export type ReviewForm = ReturnType<typeof useForm<{ rows: StudentBody[] }>>

// Owns the review table's data. TanStack Form already holds the real,
// live-edited rows (`form.state.values.rows`) - mirroring a second copy of
// that data here would be pure duplication. The only thing this hook keeps
// of its own is `rowCount`: DataTable still needs an array reference for its
// `data` prop, but every cell reads/writes through TanStack Form by
// `row.index` (see use-review-columns.tsx), never `row.original` - so that
// array only needs to exist and have the right length, not hold real values.
// Feeding `form.state.values.rows` straight to DataTable would reintroduce
// the original perf bug: TanStack Form's immutable updates give that array a
// new reference on every keystroke, forcing TanStack Table to recompute its
// whole row model each time. `tableRows` is a placeholder array, sized only
// by `rowCount` and re-created only when a file is loaded/reset, so it's
// exactly as stable as the old frozen snapshot without duplicating any data.
export function useReviewTableState() {
	const [rowCount, setRowCount] = useState(0)
	const form = useForm({
		defaultValues: { rows: [] as StudentBody[] }
	})

	const tableRows = useMemo(
		() => Array.from({ length: rowCount }, () => ({}) as StudentBody),
		[rowCount]
	)

	const errorRowCount = useStore(form.store, (state) => {
		let count = 0
		for (let index = 0; index < rowCount; index++) {
			if (rowHasError(state.fieldMeta, index)) count++
		}
		return count
	})
	const validRowCount = rowCount - errorRowCount

	const loadParsedFile = useCallback(
		(students: StudentBody[], parseErrors: ParseError[]) => {
			setRowCount(students.length)
			form.reset({ rows: students })
			for (const error of parseErrors) {
				const index = error.row - 4
				const field = errorFieldForMessage(error.message)
				if (field === undefined) continue
				form.setFieldMeta(
					`rows[${index}].${field}` as never,
					(prev) => ({
						...prev,
						errorMap: { onSubmit: { message: error.message } },
						isTouched: true
					})
				)
			}
		},
		[form]
	)

	const resetReview = useCallback(() => {
		setRowCount(0)
		form.reset({ rows: [] })
	}, [form])

	// Only unit/position/place edits clear their own error on a valid pick,
	// matching the pre-migration behavior (activityStatus's parse error was
	// never cleared by editing it either - not something this refactor
	// changes).
	const clearFieldError = useCallback(
		(index: number, field: TrackedErrorField) => {
			form.setFieldMeta(`rows[${index}].${field}` as never, (prev) => ({
				...prev,
				errorMap: {}
			}))
		},
		[form]
	)

	// One-off (non-reactive) read used only when building the "Chi tiết lỗi"
	// list for the import guard/failure display - not for driving render.
	const collectErrors = useCallback((): ParseError[] => {
		const fieldMeta = form.store.state.fieldMeta as FieldMetaMap
		const errors: ParseError[] = []
		for (let index = 0; index < rowCount; index++) {
			for (const field of TRACKED_ERROR_FIELDS) {
				for (const message of fieldErrorMessages(
					fieldMeta,
					index,
					field
				)) {
					errors.push({ row: index + 4, message })
				}
			}
		}
		return errors
	}, [form, rowCount])

	return {
		form,
		rows: tableRows,
		validRowCount,
		errorRowCount,
		loadParsedFile,
		resetReview,
		clearFieldError,
		collectErrors
	}
}
