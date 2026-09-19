import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog'
import { unitLevelLabels, unitLevelOrder } from '@/data/unit-levels'
import useCreateStudents from '@/hooks/useCreateStudents'
import usePositionsData from '@/hooks/usePositionsData'
import useProvinces from '@/hooks/useProvinces'
import useUnitOptions from '@/hooks/useUnitOptions'
import useWards from '@/hooks/useWards'
import {
	AlertCircle,
	ArrowRight,
	CheckCircle,
	Loader2,
	Upload
} from 'lucide-react'
import type React from 'react'
import { useMemo, useRef, useState } from 'react'
import { downloadImportTemplate } from './build-import-template'
import { parseImportFile } from './parse-import-file'
import { reviewInputClass } from './review-input-class'
import { ReviewStep } from './review-step'
import { UploadStep } from './upload-step'
import { useReviewColumns } from './use-review-columns'
import { useReviewTableState } from './use-review-table-state'

export { reviewInputClass }

export interface ImportStudentsDialogProps {
	isOpen: boolean
	onClose: () => void
	onSuccess?: (results: {
		successCount: number
		errorCount: number
		totalCount: number
		errors: { row: number; message: string }[]
	}) => void
}

export function ImportStudentsDialog({
	isOpen,
	onClose,
	onSuccess
}: ImportStudentsDialogProps) {
	const { options: unitOptions } = useUnitOptions({ enabled: isOpen })
	const { data: positions = [] } = usePositionsData(undefined, {
		enabled: isOpen
	})
	const { data: provinces = [] } = useProvinces({ enabled: isOpen })
	// Unfiltered - the whole ward list is needed up front to build the
	// per-province cascading dropdown sheet and the name->code lookup used
	// when parsing the uploaded file back.
	const { data: wards = [] } = useWards(undefined, { enabled: isOpen })

	const positionOptions = useMemo(
		() =>
			[...(positions ?? [])]
				.sort((a, b) => {
					const levelDiff =
						unitLevelOrder.indexOf(a.level as never) -
						unitLevelOrder.indexOf(b.level as never)
					if (levelDiff !== 0) return levelDiff
					const groupDiff = (a.group ?? '').localeCompare(
						b.group ?? ''
					)
					if (groupDiff !== 0) return groupDiff
					return a.priority - b.priority
				})
				.map((p) => {
					const group = unitLevelLabels[p.level as never] ?? p.level
					return { id: p.id, label: `${group} - ${p.name}` }
				}),
		[positions]
	)

	// Same catalog as `positionOptions` above, shaped for the review
	// table's searchable combobox: level kept separate (as the group
	// heading) instead of folded into one label string, so the picker can
	// group + filter instead of forcing a scroll through a flat list of
	// every position across every unit level. Grouped strictly by unit
	// level (not `p.group`, which is an unrelated HSQ/CS-BS classification
	// override) so e.g. HSQ-flagged positions still sort under their own
	// level instead of being bucketed together under "HSQ".
	const positionComboboxOptions = useMemo(
		() =>
			[...(positions ?? [])]
				.sort((a, b) => {
					const levelDiff =
						unitLevelOrder.indexOf(a.level as never) -
						unitLevelOrder.indexOf(b.level as never)
					if (levelDiff !== 0) return levelDiff
					const groupDiff = (a.group ?? '').localeCompare(
						b.group ?? ''
					)
					if (groupDiff !== 0) return groupDiff
					return a.priority - b.priority
				})
				.map((p) => ({
					value: String(p.id),
					label: p.name,
					group: unitLevelLabels[p.level as never] ?? p.level
				})),
		[positions]
	)

	// label (lowercased, trimmed) -> id, used to resolve the dropdown's
	// human-readable choice back to a numeric foreign key on import.
	const unitLabelToId = useMemo(() => {
		const map = new Map<string, number>()
		unitOptions.forEach((o) => map.set(o.label.trim().toLowerCase(), o.id))
		return map
	}, [unitOptions])

	const positionLabelToId = useMemo(() => {
		const map = new Map<string, number>()
		positionOptions.forEach((o) =>
			map.set(o.label.trim().toLowerCase(), o.id)
		)
		return map
	}, [positionOptions])

	// wards grouped by provinceCode, in a stable order - used both to build
	// the per-province ward columns/named ranges in the template and as the
	// basis for wardNameToCode below.
	const wardsByProvinceCode = useMemo(() => {
		const map = new Map<string, typeof wards>()
		wards.forEach((w) => {
			const list = map.get(w.provinceCode) ?? []
			list.push(w)
			map.set(w.provinceCode, list)
		})
		return map
	}, [wards])

	// province display name (lowercased, trimmed) -> code, used to resolve
	// the imported "...ProvinceName" column back to a code.
	const provinceNameToCode = useMemo(() => {
		const map = new Map<string, string>()
		provinces.forEach((p) =>
			map.set(p.nameWithType.trim().toLowerCase(), p.code)
		)
		return map
	}, [provinces])

	// provinceCode -> (ward display name, lowercased/trimmed -> code). Ward
	// names aren't globally unique, so resolution must be scoped to the
	// row's already-resolved province.
	const wardNameToCodeByProvince = useMemo(() => {
		const map = new Map<string, Map<string, string>>()
		wardsByProvinceCode.forEach((provinceWards, provinceCode) => {
			const inner = new Map<string, string>()
			provinceWards.forEach((w) =>
				inner.set(w.nameWithType.trim().toLowerCase(), w.code)
			)
			map.set(provinceCode, inner)
		})
		return map
	}, [wardsByProvinceCode])

	const createStudentsMutation = useCreateStudents()
	const {
		form,
		rows,
		validRowCount,
		errorRowCount,
		loadParsedFile,
		resetReview,
		clearFieldError,
		collectErrors
	} = useReviewTableState()
	const [selectedFile, setSelectedFile] = useState<File | null>(null)
	const [dragActive, setDragActive] = useState(false)
	// idle -> ready (parsed, awaiting review confirmation) -> uploading ->
	// success | error (error can also happen pre-parse, e.g. wrong file type)
	const [uploadStatus, setUploadStatus] = useState<
		'idle' | 'ready' | 'uploading' | 'success' | 'error'
	>('idle')
	const [uploadMessage, setUploadMessage] = useState('')
	const [importResults, setImportResults] = useState<{
		successCount: number
		errorCount: number
		totalCount: number
		errors: { row: number; message: string }[]
	} | null>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)

	// Once a file has been parsed into `rows`, the dialog switches from the
	// upload step to the review step until the user either confirms the
	// import (-> success) or goes back to pick a different file.
	const isReviewing = rows.length > 0 && uploadStatus !== 'success'

	const downloadTemplate = () =>
		downloadImportTemplate({
			provinces,
			wardsByProvinceCode,
			unitOptions,
			positionOptions
		})

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
			handleFileSelect(e.dataTransfer.files[0])
		}
	}

	const handleFileSelect = (file: File) => {
		if (
			file &&
			(file.type === 'text/csv' ||
				file.name.endsWith('.csv') ||
				file.type === 'application/vnd.ms-excel' ||
				file.type ===
					'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
				file.name.endsWith('.xlsx') ||
				file.name.endsWith('.xls'))
		) {
			resetDialog()

			const reader = new FileReader()

			reader.onload = (e) => {
				try {
					const { students, rowErrors } = parseImportFile({
						data: e.target?.result as ArrayBuffer,
						unitLabelToId,
						positionLabelToId,
						provinceNameToCode,
						wardNameToCodeByProvince
					})

					loadParsedFile(students, rowErrors)
					setSelectedFile(file)
					setUploadStatus('ready')
					if (rowErrors.length > 0) {
						setUploadMessage(
							`Đã đọc file, nhưng có ${rowErrors.length} dòng chứa lỗi tham chiếu (đơn vị/chức vụ không hợp lệ).`
						)
					}
				} catch (error) {
					console.error('Error parsing file:', error)
					setUploadMessage(
						'Lỗi đọc file. Vui lòng kiểm tra định dạng file.'
					)
					setUploadStatus('error')
				}
			}

			reader.onerror = (error) => {
				console.error('FileReader error:', error)
				setUploadMessage('Lỗi đọc file. Vui lòng thử lại.')
				setUploadStatus('error')
			}

			reader.readAsArrayBuffer(file)
		} else {
			setUploadMessage('Vui lòng chọn file CSV hoặc Excel (.xlsx, .xls)')
			setUploadStatus('error')
		}
	}

	const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			handleFileSelect(e.target.files[0])
		}
	}

	const handleImport = async () => {
		if (!selectedFile) {
			setUploadMessage('Vui lòng chọn file để import')
			setUploadStatus('error')
			return
		}

		if (errorRowCount > 0) {
			setUploadMessage(
				'Vui lòng sửa các dòng có lỗi tham chiếu trước khi import.'
			)
			setUploadStatus('error')
			setImportResults({
				successCount: 0,
				errorCount: errorRowCount,
				totalCount: rows.length,
				errors: collectErrors()
			})
			return
		}

		setUploadStatus('uploading')
		setUploadMessage('Đang xử lý file...')

		try {
			// Read the form's current values, not the frozen `rows` snapshot -
			// `rows` only exists to give the table a stable row count/index.
			const finalStudents = form.state.values.rows
			await createStudentsMutation.mutateAsync(finalStudents)

			const results = {
				successCount: finalStudents.length,
				errorCount: 0,
				totalCount: finalStudents.length,
				errors: []
			}

			setUploadStatus('success')
			setImportResults(results)
			setUploadMessage(
				`Import hoàn tất! Thành công: ${results.successCount}/${results.totalCount} quân nhân`
			)
			onSuccess?.(results)
		} catch (error) {
			console.error('Import error:', error)
			setUploadStatus('error')
			setUploadMessage(`Lỗi import: ${error?.message || error}`)

			// Set error results
			const errorResults = {
				successCount: 0,
				errorCount: rows.length,
				totalCount: rows.length,
				errors: [{ row: 1, message: error?.message || 'Unknown error' }]
			}
			setImportResults(errorResults)
		}
	}

	const resetDialog = () => {
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
		resetDialog()
		onClose()
	}

	// Hoisted out of the column cells below: every ReviewSelectCell was
	// re-mapping its `options` array (unitOptions/provinces/wards -> {value,
	// label}) from scratch on EVERY row on EVERY render, since cell
	// renderers run per-row per-render. With hundreds of units/rows that's
	// hundreds of thousands of object allocations on every keystroke or
	// selection, which is what made picking an option feel like it locked
	// up the tab. Building each option list once here and reusing the same
	// array reference also lets ReviewSelectCell's internal filteredOptions
	// memo actually memoize instead of recomputing on every render.
	const unitSelectOptions = useMemo(
		() => unitOptions.map((o) => ({ value: String(o.id), label: o.label })),
		[unitOptions]
	)
	const provinceSelectOptions = useMemo(
		() => provinces.map((p) => ({ value: p.code, label: p.nameWithType })),
		[provinces]
	)
	const wardSelectOptionsByProvinceCode = useMemo(() => {
		const map = new Map<string, { value: string; label: string }[]>()
		wardsByProvinceCode.forEach((wardsForProvince, code) => {
			map.set(
				code,
				wardsForProvince.map((w) => ({
					value: w.code,
					label: w.nameWithType
				}))
			)
		})
		return map
	}, [wardsByProvinceCode])

	const reviewColumns = useReviewColumns({
		form,
		clearFieldError,
		unitSelectOptions,
		positionComboboxOptions,
		provinceSelectOptions,
		wardSelectOptionsByProvinceCode
	})

	if (!isOpen) return null

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) handleClose()
			}}
		>
			<DialogContent className='max-w-9/10'>
				<DialogHeader>
					<DialogTitle>Import danh sách quân nhân</DialogTitle>
					{!isReviewing && (
						<DialogDescription>
							Tải lên file Excel hoặc CSV để thêm nhiều quân nhân
							cùng lúc.
						</DialogDescription>
					)}
				</DialogHeader>

				<div className='space-y-6'>
					{!isReviewing && (
						<UploadStep
							downloadTemplate={downloadTemplate}
							selectedFile={selectedFile}
							dragActive={dragActive}
							fileInputRef={fileInputRef}
							onDrag={handleDrag}
							onDrop={handleDrop}
							onFileInputChange={handleFileInputChange}
						/>
					)}

					{isReviewing && (
						<ReviewStep
							rows={rows}
							validRowCount={validRowCount}
							errorRowCount={errorRowCount}
							resetDialog={resetDialog}
							isUploading={uploadStatus === 'uploading'}
							reviewColumns={reviewColumns}
						/>
					)}

					{/* Status message */}
					{uploadMessage && (
						<div className='flex items-center gap-2 rounded-lg border p-3 text-sm'>
							{uploadStatus === 'success' && (
								<CheckCircle className='h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400' />
							)}
							{uploadStatus === 'error' && (
								<AlertCircle className='h-5 w-5 flex-shrink-0 text-destructive' />
							)}
							{uploadStatus === 'uploading' && (
								<Loader2 className='h-5 w-5 flex-shrink-0 animate-spin text-primary' />
							)}
							<span
								className={
									uploadStatus === 'success'
										? 'text-green-700 dark:text-green-400'
										: uploadStatus === 'error'
											? 'text-destructive'
											: 'text-foreground'
								}
							>
								{uploadMessage}
							</span>
						</div>
					)}

					{/* Import results */}
					{importResults && (
						<div className='space-y-3 rounded-lg border bg-muted/30 p-4'>
							<h4 className='font-medium text-foreground'>
								Kết quả import:
							</h4>
							<div className='grid grid-cols-3 gap-4 text-sm'>
								<div className='text-center'>
									<div className='text-2xl font-bold text-green-600 dark:text-green-400'>
										{importResults.successCount}
									</div>
									<div className='text-muted-foreground'>
										Thành công
									</div>
								</div>
								<div className='text-center'>
									<div className='text-2xl font-bold text-destructive'>
										{importResults.errorCount}
									</div>
									<div className='text-muted-foreground'>
										Lỗi
									</div>
								</div>
								<div className='text-center'>
									<div className='text-2xl font-bold text-foreground'>
										{importResults.totalCount}
									</div>
									<div className='text-muted-foreground'>
										Tổng cộng
									</div>
								</div>
							</div>

							{importResults.errors &&
								importResults.errors.length > 0 && (
									<div className='space-y-2 pt-1'>
										<h5 className='font-medium text-destructive'>
											Chi tiết lỗi:
										</h5>
										<div className='max-h-32 overflow-y-auto space-y-1'>
											{importResults.errors.map(
												(error, index) => (
													<div
														key={index}
														className='rounded border bg-background p-2 text-sm text-destructive'
													>
														Dòng {error.row}:{' '}
														{error.message}
													</div>
												)
											)}
										</div>
									</div>
								)}
						</div>
					)}
				</div>

				<DialogFooter>
					<Button variant='secondary' onClick={handleClose}>
						{uploadStatus === 'success' ? 'Đóng' : 'Hủy'}
					</Button>

					{isReviewing && (
						<Button
							onClick={handleImport}
							disabled={
								errorRowCount > 0 ||
								uploadStatus === 'uploading'
							}
							title={
								errorRowCount > 0
									? 'Vui lòng sửa các dòng có lỗi trước khi import'
									: undefined
							}
						>
							{uploadStatus === 'uploading' ? (
								<>
									<Loader2 className='h-4 w-4 animate-spin' />
									Đang import...
								</>
							) : (
								<>
									<Upload className='h-4 w-4' />
									Xác nhận &amp; Import
									<ArrowRight className='h-4 w-4' />
								</>
							)}
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
