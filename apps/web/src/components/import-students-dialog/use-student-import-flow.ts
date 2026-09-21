import { isSupportedSpreadsheet } from '@/components/material-import/read-spreadsheet'
import type {
	ImportResults,
	UploadStatus
} from '@/components/material-import/types'
import useCreateStudents from '@/hooks/useCreateStudents'
import type React from 'react'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
	parseImportFile,
	type ParseImportFileParams
} from './parse-import-file'
import { useReviewTableState } from './use-review-table-state'

export interface UseStudentImportFlowOptions {
	parseLookups: Omit<ParseImportFileParams, 'data'>
	onClose: () => void
	onSuccess?: (results: ImportResults) => void
}

// The dialog's whole upload -> review -> import lifecycle:
//   idle -> ready (parsed, awaiting review confirmation) -> uploading ->
//   success | error (error can also happen pre-parse, e.g. wrong file type)
export function useStudentImportFlow({
	parseLookups,
	onClose,
	onSuccess
}: UseStudentImportFlowOptions) {
	const { t } = useTranslation('io')
	const createStudents = useCreateStudents()
	const review = useReviewTableState()
	const { form, rows, errorRowCount, loadParsedFile, resetReview } = review

	const [selectedFile, setSelectedFile] = useState<File | null>(null)
	const [dragActive, setDragActive] = useState(false)
	const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle')
	const [uploadMessage, setUploadMessage] = useState('')
	const [importResults, setImportResults] = useState<ImportResults | null>(
		null
	)
	const fileInputRef = useRef<HTMLInputElement>(null)

	// Once a file has been parsed into `rows`, the dialog switches from the
	// upload step to the review step until the user either confirms the
	// import (-> success) or goes back to pick a different file.
	const isReviewing = rows.length > 0 && uploadStatus !== 'success'

	const failWith = (message: string) => {
		setUploadMessage(message)
		setUploadStatus('error')
	}

	const reset = () => {
		setSelectedFile(null)
		resetReview()
		setUploadStatus('idle')
		setUploadMessage('')
		setImportResults(null)
		setDragActive(false)
		if (fileInputRef.current) {
			fileInputRef.current.value = ''
		}
	}

	const handleClose = () => {
		reset()
		onClose()
	}

	const handleParsedData = (file: File, data: ArrayBuffer) => {
		try {
			const { students, rowErrors } = parseImportFile({
				data,
				...parseLookups
			})

			loadParsedFile(students, rowErrors)
			setSelectedFile(file)
			setUploadStatus('ready')
			if (rowErrors.length > 0) {
				setUploadMessage(
					t('importDialog.messages.refErrors', {
						count: rowErrors.length
					})
				)
			}
		} catch (error) {
			console.error('Error parsing file:', error)
			failWith(t('importDialog.messages.readFormat'))
		}
	}

	const handleFileSelect = (file: File) => {
		if (!file || !isSupportedSpreadsheet(file)) {
			failWith(t('importDialog.messages.invalidType'))
			return
		}

		reset()

		const reader = new FileReader()
		reader.onload = (e) =>
			handleParsedData(file, e.target?.result as ArrayBuffer)
		reader.onerror = (error) => {
			console.error('FileReader error:', error)
			failWith(t('importDialog.messages.readRetry'))
		}
		reader.readAsArrayBuffer(file)
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

		if (e.dataTransfer.files?.[0]) {
			handleFileSelect(e.dataTransfer.files[0])
		}
	}

	const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files?.[0]) {
			handleFileSelect(e.target.files[0])
		}
	}

	const handleImport = async () => {
		if (!selectedFile) {
			failWith(t('importDialog.messages.noFile'))
			return
		}

		if (errorRowCount > 0) {
			failWith(t('importDialog.messages.fixRefErrors'))
			setImportResults({
				successCount: 0,
				errorCount: errorRowCount,
				totalCount: rows.length,
				errors: review.collectErrors()
			})
			return
		}

		setUploadStatus('uploading')
		setUploadMessage(t('importDialog.messages.processing'))

		try {
			// Read the form's current values, not the frozen `rows` snapshot -
			// `rows` only exists to give the table a stable row count/index.
			const finalStudents = form.state.values.rows
			await createStudents.mutateAsync(finalStudents)

			const results: ImportResults = {
				successCount: finalStudents.length,
				errorCount: 0,
				totalCount: finalStudents.length,
				errors: []
			}

			setUploadStatus('success')
			setImportResults(results)
			setUploadMessage(
				t('importDialog.messages.done', {
					success: results.successCount,
					total: results.totalCount
				})
			)
			onSuccess?.(results)
		} catch (error) {
			console.error('Import error:', error)
			const message = (error as Error | undefined)?.message
			failWith(
				t('importDialog.messages.failed', {
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

	return {
		form,
		rows,
		validRowCount: review.validRowCount,
		errorRowCount,
		clearFieldError: review.clearFieldError,
		selectedFile,
		dragActive,
		uploadStatus,
		uploadMessage,
		importResults,
		fileInputRef,
		isReviewing,
		reset,
		handleClose,
		handleDrag,
		handleDrop,
		handleFileInputChange,
		handleImport
	}
}
