import i18n from '@/i18n'
import type React from 'react'
import { useCallback, useMemo, useRef, useState } from 'react'
import {
	isSupportedSpreadsheet,
	readSpreadsheetFile,
	SpreadsheetReadError
} from './read-spreadsheet'
import {
	rowIndexFor,
	rowNumberFor,
	type ImportResults,
	type ImportRowError,
	type ParsedRows,
	type UploadStatus
} from './types'

export interface UseImportDialogStateOptions<Row> {
	parseRows: (headers: string[], dataRows: unknown[][]) => ParsedRows<Row>
	describeReferenceErrors: (errorCount: number) => string
	importRows: (rows: Row[]) => Promise<unknown>
	itemNoun: string
	onClose: () => void
	onSuccess?: (results: ImportResults) => void
}

export function useImportDialogState<Row>({
	parseRows,
	describeReferenceErrors,
	importRows,
	itemNoun,
	onClose,
	onSuccess
}: UseImportDialogStateOptions<Row>) {
	const [rows, setRows] = useState<Row[]>([])
	const [selectedFile, setSelectedFile] = useState<File | null>(null)
	const [dragActive, setDragActive] = useState(false)
	const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle')
	const [uploadMessage, setUploadMessage] = useState('')
	const [parseErrors, setParseErrors] = useState<ImportRowError[]>([])
	const [importResults, setImportResults] = useState<ImportResults | null>(
		null
	)
	const fileInputRef = useRef<HTMLInputElement>(null)

	const isReviewing = rows.length > 0 && uploadStatus !== 'success'

	const errorsByRowIndex = useMemo(() => {
		const map = new Map<number, string[]>()
		parseErrors.forEach((e) => {
			const index = rowIndexFor(e.row)
			const list = map.get(index) ?? []
			list.push(e.message)
			map.set(index, list)
		})
		return map
	}, [parseErrors])

	const validRowCount = rows.length - errorsByRowIndex.size

	const reset = () => {
		setSelectedFile(null)
		setRows([])
		setUploadStatus('idle')
		setUploadMessage('')
		setImportResults(null)
		setParseErrors([])
		setDragActive(false)
		if (fileInputRef.current) {
			fileInputRef.current.value = ''
		}
	}

	const handleClose = () => {
		reset()
		onClose()
	}

	const failWith = (message: string) => {
		setUploadMessage(message)
		setUploadStatus('error')
	}

	const handleFileSelect = async (file: File) => {
		if (!file || !isSupportedSpreadsheet(file)) {
			failWith(i18n.t('materials:import.state.unsupportedFile'))
			return
		}

		reset()

		let parsed: ParsedRows<Row>
		try {
			const { headers, dataRows } = await readSpreadsheetFile(file)
			parsed = parseRows(headers, dataRows)
		} catch (error) {
			console.error('Error parsing file:', error)
			failWith(
				error instanceof SpreadsheetReadError
					? i18n.t('materials:import.state.readFailed')
					: i18n.t('materials:import.state.badFormat')
			)
			return
		}

		setRows(parsed.rows)
		setParseErrors(parsed.errors)
		setSelectedFile(file)
		setUploadStatus('ready')
		if (parsed.errors.length > 0) {
			setUploadMessage(describeReferenceErrors(parsed.errors.length))
		}
	}

	const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault()
		e.stopPropagation()
		if (e.type === 'dragenter' || e.type === 'dragover') {
			setDragActive(true)
		} else if (e.type === 'dragleave') {
			setDragActive(false)
		}
	}

	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault()
		e.stopPropagation()
		setDragActive(false)

		if (e.dataTransfer.files && e.dataTransfer.files[0]) {
			void handleFileSelect(e.dataTransfer.files[0])
		}
	}

	const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			void handleFileSelect(e.target.files[0])
		}
	}

	const handleImport = async () => {
		if (!selectedFile) {
			failWith(i18n.t('materials:import.state.noFile'))
			return
		}

		if (parseErrors.length > 0) {
			failWith(i18n.t('materials:import.state.fixReferenceErrors'))
			setImportResults({
				successCount: 0,
				errorCount: parseErrors.length,
				totalCount: rows.length,
				errors: parseErrors
			})
			return
		}

		setUploadStatus('uploading')
		setUploadMessage(i18n.t('materials:import.state.processing'))

		try {
			await importRows(rows)

			const results: ImportResults = {
				successCount: rows.length,
				errorCount: 0,
				totalCount: rows.length,
				errors: []
			}

			setUploadStatus('success')
			setImportResults(results)
			setUploadMessage(
				i18n.t('materials:import.state.done', {
					success: results.successCount,
					total: results.totalCount,
					itemNoun
				})
			)
			onSuccess?.(results)
		} catch (error) {
			console.error('Import error:', error)
			const message = (error as Error | undefined)?.message
			failWith(
				i18n.t('materials:import.state.failed', {
					message: message || String(error)
				})
			)
			setImportResults({
				successCount: 0,
				errorCount: rows.length,
				totalCount: rows.length,
				errors: [{ row: 1, message: message || 'Unknown error' }]
			})
		}
	}

	const updateRow = useCallback((index: number, patch: Partial<Row>) => {
		setRows((prev) =>
			prev.map((row, i) => (i === index ? { ...row, ...patch } : row))
		)
	}, [])

	// Editing a cell resolves the problem the parser reported for it, so the
	// row's matching errors go away (matched by a word in the message).
	const clearRowErrors = useCallback((index: number, keywords: string[]) => {
		setParseErrors((prev) =>
			prev.filter(
				(e) =>
					!(
						e.row === rowNumberFor(index) &&
						keywords.some((k) => e.message.includes(k))
					)
			)
		)
	}, [])

	return {
		rows,
		selectedFile,
		dragActive,
		uploadStatus,
		uploadMessage,
		parseErrors,
		importResults,
		fileInputRef,
		isReviewing,
		errorsByRowIndex,
		validRowCount,
		reset,
		handleClose,
		handleDrag,
		handleDrop,
		handleFileInputChange,
		handleImport,
		updateRow,
		clearRowErrors
	}
}

export type ImportDialogState<Row> = ReturnType<
	typeof useImportDialogState<Row>
>
