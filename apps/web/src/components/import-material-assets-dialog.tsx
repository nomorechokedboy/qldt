import React, { useState, useRef, useMemo } from 'react'
import ExcelJS from 'exceljs'
import * as XLSX from 'xlsx'
import {
	FileUp,
	Download,
	AlertCircle,
	CheckCircle,
	Upload,
	FileSpreadsheet,
	Info,
	ArrowRight,
	ArrowLeft,
	ClipboardList,
	Loader2
} from 'lucide-react'
import useImportMaterialAssets from '@/hooks/useImportMaterialAssets'
import useRoomsData from '@/hooks/useRoomsData'
import useMaterialTypesData from '@/hooks/useMaterialTypesData'
import useStudentData from '@/hooks/useStudents'
import {
	materialConditionOptions,
	materialAssetStatusOptions
} from '@/data/material-categories'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog'
import { DataTable } from '@/components/data-table'
import { reviewInputClass } from '@/components/import-students-dialog'
import type { ColumnDef } from '@tanstack/react-table'
import type { materials } from '@/api/client'
import type { Room, Student } from '@/types'
import useUnitOptions from '@/hooks/useUnitOptions'
import { MAX_MATERIAL_ASSET_SERIAL_LENGTH } from '@/lib/material-limits'
import { buildMaterialTypeOptions } from '@/lib/material-type-options'

export interface ImportMaterialAssetsDialogProps {
	unitId: number
	isOpen: boolean
	onClose: () => void
	onSuccess?: (results: {
		successCount: number
		errorCount: number
		totalCount: number
		errors: { row: number; message: string }[]
	}) => void
}

type MaterialConditionName = NonNullable<
	materials.MaterialAssetBody['condition']
>
type MaterialAssetStatus = NonNullable<materials.MaterialAssetBody['status']>

interface MaterialAssetImportRow {
	materialTypeId?: number
	serialNumber: string
	unitId?: number
	roomId?: number
	condition?: MaterialConditionName
	status?: MaterialAssetStatus
	assignedTrooperId?: number
}

export function ImportMaterialAssetsDialog({
	isOpen,
	unitId,
	onClose,
	onSuccess
}: ImportMaterialAssetsDialogProps) {
	const { unitsById, options: unitOptions } = useUnitOptions({
		enabled: isOpen
	})
	const { data: rooms = [] } = useRoomsData(undefined, { enabled: isOpen })
	const { data: materialTypes = [] } = useMaterialTypesData({
		enabled: isOpen
	})
	const { data: allStudents = [] } = useStudentData(undefined, {
		enabled: isOpen
	})

	// Bulk asset import only ever creates serialized items (weapons,
	// vehicles, etc.) - non-serialized supplies go through
	// ImportMaterialStocksDialog instead.
	const materialTypeOptions = useMemo(
		() =>
			buildMaterialTypeOptions(
				materialTypes.filter((t) => t.isSerialized)
			),
		[materialTypes]
	)

	const unitLabelToId = useMemo(() => {
		const map = new Map<string, number>()
		unitOptions?.forEach((o) => map.set(o.label.trim().toLowerCase(), o.id))
		return map
	}, [unitOptions])

	const materialTypeLabelToId = useMemo(() => {
		const map = new Map<string, number>()
		materialTypeOptions.forEach((o) =>
			map.set(o.label.trim().toLowerCase(), o.id)
		)
		return map
	}, [materialTypeOptions])

	// Rooms and troopers grouped by unitId - the basis both for the
	// per-unit dropdown columns/named ranges in the template and for
	// resolving roomName/trooperName back to ids scoped to each row's own
	// unit (names aren't globally unique, so lookups never cross units).
	const roomsByUnitId = useMemo(() => {
		const map = new Map<number, Room[]>()
		rooms.forEach((r) => {
			const list = map.get(r.unitId) ?? []
			list.push(r)
			map.set(r.unitId, list)
		})
		return map
	}, [rooms])

	const roomNameToIdByUnit = useMemo(() => {
		const map = new Map<number, Map<string, number>>()
		roomsByUnitId.forEach((unitRooms, unitId) => {
			const inner = new Map<string, number>()
			unitRooms.forEach((r) =>
				inner.set(r.name.trim().toLowerCase(), r.id)
			)
			map.set(unitId, inner)
		})
		return map
	}, [roomsByUnitId])

	const studentsByUnitId = useMemo(() => {
		const map = new Map<number, Student[]>()
		allStudents.forEach((s) => {
			if (s.unitId === undefined) return
			const list = map.get(s.unitId) ?? []
			list.push(s)
			map.set(s.unitId, list)
		})
		return map
	}, [allStudents])

	const studentLabel = (s: Student) => s.fullName || s.studentId

	const studentNameToIdByUnit = useMemo(() => {
		const map = new Map<number, Map<string, number>>()
		studentsByUnitId.forEach((unitStudents, unitId) => {
			const inner = new Map<string, number>()
			unitStudents.forEach((s) =>
				inner.set(studentLabel(s).trim().toLowerCase(), s.id)
			)
			map.set(unitId, inner)
		})
		return map
	}, [studentsByUnitId])

	const conditionLabelToValue = useMemo(() => {
		const map = new Map<string, MaterialConditionName>()
		materialConditionOptions.forEach((o) =>
			map.set(
				o.label.trim().toLowerCase(),
				o.value as MaterialConditionName
			)
		)
		return map
	}, [])

	const statusLabelToValue = useMemo(() => {
		const map = new Map<string, MaterialAssetStatus>()
		materialAssetStatusOptions.forEach((o) =>
			map.set(
				o.label.trim().toLowerCase(),
				o.value as MaterialAssetStatus
			)
		)
		return map
	}, [])

	const createAssetsMutation = useImportMaterialAssets()
	const [assets, setAssets] = useState<MaterialAssetImportRow[]>([])
	const [selectedFile, setSelectedFile] = useState<File | null>(null)
	const [dragActive, setDragActive] = useState(false)
	const [uploadStatus, setUploadStatus] = useState<
		'idle' | 'ready' | 'uploading' | 'success' | 'error'
	>('idle')
	const [uploadMessage, setUploadMessage] = useState('')
	const [parseErrors, setParseErrors] = useState<
		{ row: number; message: string }[]
	>([])
	const [importResults, setImportResults] = useState<{
		successCount: number
		errorCount: number
		totalCount: number
		errors: { row: number; message: string }[]
	} | null>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)

	const isReviewing = assets.length > 0 && uploadStatus !== 'success'

	const errorsByRowIndex = useMemo(() => {
		const map = new Map<number, string[]>()
		parseErrors.forEach((e) => {
			const index = e.row - 4
			const list = map.get(index) ?? []
			list.push(e.message)
			map.set(index, list)
		})
		return map
	}, [parseErrors])

	const validRowCount = assets.length - errorsByRowIndex.size

	const downloadTemplate = async () => {
		try {
			const workbook = new ExcelJS.Workbook()

			const headers = [
				'materialTypeName',
				'serialNumber',
				'unitName',
				'roomName',
				'condition',
				'status',
				'assignedTrooperName'
			]
			const vietnameseHeaders = [
				'Loại khí tài',
				'Số sê-ri',
				'Đơn vị',
				'Vị trí',
				'Tình trạng',
				'Trạng thái sử dụng',
				'Cấp phát cho quân nhân'
			]

			const sampleData = [
				materialTypeOptions.length ? materialTypeOptions[0].label : '',
				'AK-000001',
				unitOptions?.length ? unitOptions[0].label : '',
				'',
				'Tốt',
				'Đang sử dụng',
				''
			]

			const sheet = workbook.addWorksheet('Mẫu Import')
			const headerRowVN = sheet.addRow(vietnameseHeaders)
			const headerRowAPI = sheet.addRow(headers)
			headerRowAPI.hidden = true

			headerRowVN.eachCell((cell) => {
				cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
				cell.fill = {
					type: 'pattern',
					pattern: 'solid',
					fgColor: { argb: '4472C4' }
				}
				cell.alignment = { horizontal: 'center', vertical: 'middle' }
			})

			headerRowAPI.eachCell((cell) => {
				cell.font = { bold: true, color: { argb: 'FF2F5597' } }
				cell.fill = {
					type: 'pattern',
					pattern: 'solid',
					fgColor: { argb: 'D9E1F2' }
				}
				cell.alignment = { horizontal: 'center', vertical: 'middle' }
			})

			// ===== Sheet Đơn vị (reference list + dropdown source for
			// unitName, and the id/label lookup the room/trooper cascades
			// below resolve through) =====
			const unitSheet = workbook.addWorksheet('Danh sách đơn vị')
			unitSheet.addRow(['ID', 'Tên đơn vị'])
			unitOptions?.forEach((u) => unitSheet.addRow([u.id, u.label]))
			unitSheet.getColumn(1).width = 10
			unitSheet.getColumn(2).width = 50
			const lastUnitRow = unitOptions.length + 1

			// ===== Sheet Khí tài (reference list + dropdown source for
			// materialTypeName) =====
			const materialTypeSheet = workbook.addWorksheet('Danh sách khí tài')
			materialTypeSheet.addRow(['ID', 'Tên khí tài'])
			materialTypeOptions.forEach((t) =>
				materialTypeSheet.addRow([t.id, t.label])
			)
			materialTypeSheet.getColumn(1).width = 10
			materialTypeSheet.getColumn(2).width = 50

			// ===== Sheet Phòng - one column per unit that has rooms, each
			// also a named range "R<unitId>" - cascades Vị trí off the
			// row's chosen Đơn vị via INDIRECT, same technique the student
			// template uses for province->ward. =====
			const roomSheet = workbook.addWorksheet('Danh sách phòng')
			let roomCol = 0
			unitOptions.forEach((u) => {
				const unitRooms = roomsByUnitId.get(u.id) ?? []
				roomCol += 1
				roomSheet.getCell(1, roomCol).value = u.label
				unitRooms.forEach((r, rowIdx) => {
					roomSheet.getCell(rowIdx + 2, roomCol).value = r.name
				})
				roomSheet.getColumn(roomCol).width = 30
				const colLetter = roomSheet.getColumn(roomCol).letter
				const lastRow = Math.max(unitRooms.length, 1) + 1
				workbook.definedNames.add(
					`'Danh sách phòng'!$${colLetter}$2:$${colLetter}$${lastRow}`,
					`Room${u.id}`
				)
			})

			// ===== Sheet Quân nhân - same cascade technique, named range
			// "S<unitId>", cascades Cấp phát cho quân nhân off Đơn vị. =====
			const studentSheet = workbook.addWorksheet('Danh sách quân nhân')
			let studentCol = 0
			unitOptions.forEach((u) => {
				const unitStudents = studentsByUnitId.get(u.id) ?? []
				studentCol += 1
				studentSheet.getCell(1, studentCol).value = u.label
				unitStudents.forEach((s, rowIdx) => {
					studentSheet.getCell(rowIdx + 2, studentCol).value =
						studentLabel(s)
				})
				studentSheet.getColumn(studentCol).width = 30
				const colLetter = studentSheet.getColumn(studentCol).letter
				const lastRow = Math.max(unitStudents.length, 1) + 1
				workbook.definedNames.add(
					`'Danh sách quân nhân'!$${colLetter}$2:$${colLetter}$${lastRow}`,
					`Trooper${u.id}`
				)
			})

			const unitCol = headers.indexOf('unitName')
			if (unitCol >= 0 && unitOptions.length) {
				const colLetter = sheet.getColumn(unitCol + 1).letter
				sheet.dataValidations.add(`${colLetter}4:${colLetter}1000`, {
					type: 'list',
					allowBlank: true,
					formulae: [`'Danh sách đơn vị'!$B$2:$B$${lastUnitRow}`]
				})
			}

			const materialTypeCol = headers.indexOf('materialTypeName')
			if (materialTypeCol >= 0 && materialTypeOptions.length) {
				const colLetter = sheet.getColumn(materialTypeCol + 1).letter
				const lastRow = materialTypeOptions.length + 1
				sheet.dataValidations.add(`${colLetter}4:${colLetter}1000`, {
					type: 'list',
					allowBlank: true,
					formulae: [`'Danh sách khí tài'!$B$2:$B$${lastRow}`]
				})
			}

			const roomNameCol = headers.indexOf('roomName')
			if (unitCol >= 0 && roomNameCol >= 0 && unitOptions.length) {
				const unitColLetter = sheet.getColumn(unitCol + 1).letter
				const roomColLetter = sheet.getColumn(roomNameCol + 1).letter
				sheet.dataValidations.add(
					`${roomColLetter}4:${roomColLetter}1000`,
					{
						type: 'list',
						allowBlank: true,
						formulae: [
							`INDIRECT("Room"&INDEX('Danh sách đơn vị'!$A$2:$A$${lastUnitRow},MATCH(${unitColLetter}4,'Danh sách đơn vị'!$B$2:$B$${lastUnitRow},0)))`
						]
					}
				)
			}

			const trooperCol = headers.indexOf('assignedTrooperName')
			if (unitCol >= 0 && trooperCol >= 0 && unitOptions.length) {
				const unitColLetter = sheet.getColumn(unitCol + 1).letter
				const trooperColLetter = sheet.getColumn(trooperCol + 1).letter
				sheet.dataValidations.add(
					`${trooperColLetter}4:${trooperColLetter}1000`,
					{
						type: 'list',
						allowBlank: true,
						formulae: [
							`INDIRECT("Trooper"&INDEX('Danh sách đơn vị'!$A$2:$A$${lastUnitRow},MATCH(${unitColLetter}4,'Danh sách đơn vị'!$B$2:$B$${lastUnitRow},0)))`
						]
					}
				)
			}

			const conditionCol = headers.indexOf('condition')
			if (conditionCol >= 0) {
				const colLetter = sheet.getColumn(conditionCol + 1).letter
				sheet.dataValidations.add(`${colLetter}4:${colLetter}1000`, {
					type: 'list',
					allowBlank: true,
					formulae: [
						`"${materialConditionOptions.map((o) => o.label).join(',')}"`
					]
				})
			}

			const statusCol = headers.indexOf('status')
			if (statusCol >= 0) {
				const colLetter = sheet.getColumn(statusCol + 1).letter
				sheet.dataValidations.add(`${colLetter}4:${colLetter}1000`, {
					type: 'list',
					allowBlank: true,
					formulae: [
						`"${materialAssetStatusOptions.map((o) => o.label).join(',')}"`
					]
				})
			}

			headers.forEach((_, index) => {
				sheet.getColumn(index + 1).width = 26
			})

			const instructionSheet = workbook.addWorksheet('Hướng dẫn')
			;[
				['📘 HƯỚNG DẪN NHẬP VŨ KHÍ/TRANG BỊ'],
				[''],
				[
					'1. Dòng thứ 3 chỉ là dữ liệu mẫu, KHÔNG được copy/sửa/xóa. ' +
						'Khi nhập xong toàn bộ dữ liệu có thể xóa dòng này đi, hoặc giữ nguyên thì khí tài đó sẽ được thêm vào hệ thống.'
				],
				[''],
				[
					'2. Cột Loại khí tài và Đơn vị là danh sách chọn (dropdown) hiển thị tên thay vì mã số - vui lòng chỉ chọn từ danh sách có sẵn.'
				],
				[''],
				[
					'3. Cột Vị trí và Cấp phát cho quân nhân là danh sách chọn phụ thuộc vào Đơn vị đã chọn ở cùng dòng - vui lòng chọn Đơn vị trước, sau đó danh sách sẽ tự động lọc theo đơn vị đó. Có thể để trống nếu chưa xác định.'
				],
				[''],
				['4. Cột Số sê-ri bắt buộc và phải là duy nhất.'],
				[''],
				[
					'5. Cột Tình trạng và Trạng thái sử dụng là dropdown tuỳ chọn.'
				],
				[''],
				[
					'6. KHÔNG được thay đổi tên cột (row 1, row 2) và chỉ nhập dữ liệu từ dòng 4 trở đi.'
				],
				[''],
				[
					'7. Sau khi tải file lên, hệ thống sẽ hiển thị bảng xem trước để kiểm tra dữ liệu trước khi import vào hệ thống.'
				],
				['']
			].forEach((r) => instructionSheet.addRow(r))
			instructionSheet.getColumn(1).width = 100

			sheet.addRow(sampleData)

			const buffer = await workbook.xlsx.writeBuffer()
			const blob = new Blob([buffer], {
				type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
			})
			const url = URL.createObjectURL(blob)

			const link = document.createElement('a')
			link.href = url
			const templateSuffix = unitsById.get(unitId)?.alias ?? unitId
			link.download = `Mau_Import_Vu_Khi_Trang_Bi_${templateSuffix}.xlsx`
			link.click()
			URL.revokeObjectURL(url)
		} catch (err) {
			console.error('Error:', err)
			alert('Lỗi tạo file: ' + err.message)
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
					const data = new Uint8Array(e.target.result)
					const workbook = XLSX.read(data, { type: 'array' })
					const sheetName = workbook.SheetNames[0]
					const worksheet = workbook.Sheets[sheetName]

					const jsonData = XLSX.utils.sheet_to_json(worksheet, {
						defval: '',
						header: 1
					})
					const dataRows = jsonData
						.slice(2)
						.filter((row) =>
							row.some((cell) => cell !== '' && cell != null)
						)

					const headers = jsonData[1]

					const rowErrors: { row: number; message: string }[] = []

					const parsedAssets = dataRows.map((row, rowIndex) => {
						const asset: MaterialAssetImportRow = {
							serialNumber: ''
						}
						let resolvedUnitId: number | undefined

						headers.forEach((header, index) => {
							const value = row[index] ?? ''

							if (header === 'materialTypeName') {
								if (
									typeof value === 'string' &&
									value.trim() !== ''
								) {
									const id = materialTypeLabelToId.get(
										value.trim().toLowerCase()
									)
									if (id === undefined) {
										rowErrors.push({
											row: rowIndex + 4,
											message: `Không tìm thấy loại khí tài "${value}" trong danh sách khí tài`
										})
									} else {
										asset.materialTypeId = id
									}
								} else {
									rowErrors.push({
										row: rowIndex + 4,
										message: 'Vui lòng chọn loại khí tài'
									})
								}
							}

							if (header === 'serialNumber') {
								const serial = String(value ?? '').trim()
								if (serial === '') {
									rowErrors.push({
										row: rowIndex + 4,
										message: 'Vui lòng nhập số sê-ri'
									})
								} else if (
									[...serial.normalize('NFC')].length >
									MAX_MATERIAL_ASSET_SERIAL_LENGTH
								) {
									rowErrors.push({
										row: rowIndex + 4,
										message: `Số sê-ri tối đa ${MAX_MATERIAL_ASSET_SERIAL_LENGTH} ký tự`
									})
								} else {
									asset.serialNumber = serial
								}
							}

							if (header === 'unitName') {
								if (
									typeof value === 'string' &&
									value.trim() !== ''
								) {
									const id = unitLabelToId.get(
										value.trim().toLowerCase()
									)
									if (id === undefined) {
										rowErrors.push({
											row: rowIndex + 4,
											message: `Không tìm thấy đơn vị "${value}" trong danh sách đơn vị`
										})
									} else {
										asset.unitId = id
										resolvedUnitId = id
									}
								} else {
									rowErrors.push({
										row: rowIndex + 4,
										message: 'Vui lòng chọn đơn vị'
									})
								}
							}

							if (header === 'condition') {
								if (
									typeof value === 'string' &&
									value.trim() !== ''
								) {
									const match = conditionLabelToValue.get(
										value.trim().toLowerCase()
									)
									if (match === undefined) {
										rowErrors.push({
											row: rowIndex + 4,
											message: `Giá trị "${value}" không hợp lệ cho Tình trạng`
										})
									} else {
										asset.condition = match
									}
								}
							}

							if (header === 'status') {
								if (
									typeof value === 'string' &&
									value.trim() !== ''
								) {
									const match = statusLabelToValue.get(
										value.trim().toLowerCase()
									)
									if (match === undefined) {
										rowErrors.push({
											row: rowIndex + 4,
											message: `Giá trị "${value}" không hợp lệ cho Trạng thái sử dụng`
										})
									} else {
										asset.status = match
									}
								}
							}
						})

						// roomName / assignedTrooperName resolution happens
						// after the row's unit is known, since both lists
						// are scoped per unit.
						const roomNameIndex = headers.indexOf('roomName')
						const roomNameValue =
							roomNameIndex >= 0 ? row[roomNameIndex] : ''
						if (
							typeof roomNameValue === 'string' &&
							roomNameValue.trim() !== ''
						) {
							if (resolvedUnitId === undefined) {
								rowErrors.push({
									row: rowIndex + 4,
									message:
										'Không thể xác định vị trí vì chưa chọn được đơn vị hợp lệ'
								})
							} else {
								const roomId = roomNameToIdByUnit
									.get(resolvedUnitId)
									?.get(roomNameValue.trim().toLowerCase())
								if (roomId === undefined) {
									rowErrors.push({
										row: rowIndex + 4,
										message: `Không tìm thấy vị trí "${roomNameValue}" thuộc đơn vị đã chọn`
									})
								} else {
									asset.roomId = roomId
								}
							}
						}

						const trooperNameIndex = headers.indexOf(
							'assignedTrooperName'
						)
						const trooperNameValue =
							trooperNameIndex >= 0 ? row[trooperNameIndex] : ''
						if (
							typeof trooperNameValue === 'string' &&
							trooperNameValue.trim() !== ''
						) {
							if (resolvedUnitId === undefined) {
								rowErrors.push({
									row: rowIndex + 4,
									message:
										'Không thể xác định quân nhân vì chưa chọn được đơn vị hợp lệ'
								})
							} else {
								const trooperId = studentNameToIdByUnit
									.get(resolvedUnitId)
									?.get(trooperNameValue.trim().toLowerCase())
								if (trooperId === undefined) {
									rowErrors.push({
										row: rowIndex + 4,
										message: `Không tìm thấy quân nhân "${trooperNameValue}" thuộc đơn vị đã chọn`
									})
								} else {
									asset.assignedTrooperId = trooperId
								}
							}
						}

						return asset
					})

					setAssets(parsedAssets)
					setParseErrors(rowErrors)
					setSelectedFile(file)
					setUploadStatus('ready')
					if (rowErrors.length > 0) {
						setUploadMessage(
							`Đã đọc file, nhưng có ${rowErrors.length} dòng chứa lỗi tham chiếu (khí tài/đơn vị/vị trí/quân nhân không hợp lệ).`
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

		if (parseErrors.length > 0) {
			setUploadMessage(
				'Vui lòng sửa các dòng có lỗi tham chiếu trước khi import.'
			)
			setUploadStatus('error')
			setImportResults({
				successCount: 0,
				errorCount: parseErrors.length,
				totalCount: assets.length,
				errors: parseErrors
			})
			return
		}

		setUploadStatus('uploading')
		setUploadMessage('Đang xử lý file...')

		try {
			await createAssetsMutation.mutateAsync(
				assets as materials.MaterialAssetBody[]
			)

			const results = {
				successCount: assets.length,
				errorCount: 0,
				totalCount: assets.length,
				errors: []
			}

			setUploadStatus('success')
			setImportResults(results)
			setUploadMessage(
				`Import hoàn tất! Thành công: ${results.successCount}/${results.totalCount} khí tài`
			)
			onSuccess?.(results)
		} catch (error) {
			console.error('Import error:', error)
			setUploadStatus('error')
			setUploadMessage(`Lỗi import: ${error?.message || error}`)

			const errorResults = {
				successCount: 0,
				errorCount: assets.length,
				totalCount: assets.length,
				errors: [{ row: 1, message: error?.message || 'Unknown error' }]
			}
			setImportResults(errorResults)
		}
	}

	const resetDialog = () => {
		setSelectedFile(null)
		setAssets([])
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
		resetDialog()
		onClose()
	}

	const updateAssetField = <K extends keyof MaterialAssetImportRow>(
		index: number,
		field: K,
		value: MaterialAssetImportRow[K]
	) => {
		setAssets((prev) =>
			prev.map((a, i) => (i === index ? { ...a, [field]: value } : a))
		)
	}

	const handleMaterialTypeChange = (index: number, value: string) => {
		const id = value === '' ? undefined : Number(value)
		updateAssetField(index, 'materialTypeId', id)
		if (id !== undefined) {
			setParseErrors((prev) =>
				prev.filter(
					(e) =>
						!(e.row === index + 4 && e.message.includes('khí tài'))
				)
			)
		}
	}

	const handleUnitChange = (index: number, value: string) => {
		const id = value === '' ? undefined : Number(value)
		setAssets((prev) =>
			prev.map((a, i) =>
				i === index
					? {
							...a,
							unitId: id,
							roomId: undefined,
							assignedTrooperId: undefined
						}
					: a
			)
		)
		if (id !== undefined) {
			setParseErrors((prev) =>
				prev.filter(
					(e) =>
						!(
							e.row === index + 4 &&
							(e.message.includes('đơn vị') ||
								e.message.includes('vị trí') ||
								e.message.includes('quân nhân'))
						)
				)
			)
		}
	}

	const handleRoomChange = (index: number, value: string) => {
		const id = value === '' ? undefined : Number(value)
		updateAssetField(index, 'roomId', id)
		setParseErrors((prev) =>
			prev.filter(
				(e) => !(e.row === index + 4 && e.message.includes('vị trí'))
			)
		)
	}

	const handleTrooperChange = (index: number, value: string) => {
		const id = value === '' ? undefined : Number(value)
		updateAssetField(index, 'assignedTrooperId', id)
		setParseErrors((prev) =>
			prev.filter(
				(e) => !(e.row === index + 4 && e.message.includes('quân nhân'))
			)
		)
	}

	const reviewColumns = useMemo<ColumnDef<MaterialAssetImportRow>[]>(
		() => [
			{
				id: 'index',
				header: '#',
				cell: ({ row }) => (
					<span className='text-muted-foreground'>
						{row.index + 1}
					</span>
				)
			},
			{
				id: 'status',
				header: 'Trạng thái',
				cell: ({ row }) => {
					const rowErrors = errorsByRowIndex.get(row.index)
					return rowErrors !== undefined ? (
						<span
							className='flex items-center gap-1 text-destructive'
							title={rowErrors.join('\n')}
						>
							<AlertCircle className='h-4 w-4 flex-shrink-0' />
							Lỗi
						</span>
					) : (
						<span className='flex items-center gap-1 text-green-700 dark:text-green-400'>
							<CheckCircle className='h-4 w-4 flex-shrink-0' />
							OK
						</span>
					)
				}
			},
			{
				accessorKey: 'materialTypeId',
				header: 'Loại khí tài',
				cell: ({ row }) => (
					<select
						className={reviewInputClass}
						value={row.original.materialTypeId ?? ''}
						onChange={(e) =>
							handleMaterialTypeChange(row.index, e.target.value)
						}
					>
						<option value=''>-- Chọn loại khí tài --</option>
						{materialTypeOptions.map((o) => (
							<option key={o.id} value={o.id}>
								{o.label}
							</option>
						))}
					</select>
				)
			},
			{
				accessorKey: 'serialNumber',
				header: 'Số sê-ri',
				cell: ({ row }) => (
					<input
						type='text'
						className={reviewInputClass}
						value={row.original.serialNumber}
						maxLength={MAX_MATERIAL_ASSET_SERIAL_LENGTH}
						onChange={(e) =>
							updateAssetField(
								row.index,
								'serialNumber',
								e.target.value
							)
						}
					/>
				)
			},
			{
				accessorKey: 'unitId',
				header: 'Đơn vị',
				cell: ({ row }) => (
					<select
						className={reviewInputClass}
						value={row.original.unitId ?? ''}
						onChange={(e) =>
							handleUnitChange(row.index, e.target.value)
						}
					>
						<option value=''>-- Chọn đơn vị --</option>
						{unitOptions.map((o) => (
							<option key={o.id} value={o.id}>
								{o.label}
							</option>
						))}
					</select>
				)
			},
			{
				accessorKey: 'roomId',
				header: 'Vị trí',
				cell: ({ row }) => {
					const unitId = row.original.unitId
					const options =
						unitId !== undefined
							? (roomsByUnitId.get(unitId) ?? [])
							: []
					return (
						<select
							className={reviewInputClass}
							value={row.original.roomId ?? ''}
							disabled={unitId === undefined}
							onChange={(e) =>
								handleRoomChange(row.index, e.target.value)
							}
						>
							<option value=''>Chưa có vị trí cụ thể</option>
							{options.map((r) => (
								<option key={r.id} value={r.id}>
									{r.name}
								</option>
							))}
						</select>
					)
				}
			},
			{
				accessorKey: 'condition',
				header: 'Tình trạng',
				cell: ({ row }) => (
					<select
						className={reviewInputClass}
						value={row.original.condition ?? ''}
						onChange={(e) =>
							updateAssetField(
								row.index,
								'condition',
								(e.target.value ||
									undefined) as MaterialConditionName
							)
						}
					>
						<option value=''>-- Mặc định (Tốt) --</option>
						{materialConditionOptions.map((o) => (
							<option key={o.value} value={o.value}>
								{o.label}
							</option>
						))}
					</select>
				)
			},
			{
				accessorKey: 'assetStatus',
				header: 'Trạng thái sử dụng',
				cell: ({ row }) => (
					<select
						className={reviewInputClass}
						value={row.original.status ?? ''}
						onChange={(e) =>
							updateAssetField(
								row.index,
								'status',
								(e.target.value ||
									undefined) as MaterialAssetStatus
							)
						}
					>
						<option value=''>-- Mặc định (Đang sử dụng) --</option>
						{materialAssetStatusOptions.map((o) => (
							<option key={o.value} value={o.value}>
								{o.label}
							</option>
						))}
					</select>
				)
			},
			{
				accessorKey: 'assignedTrooperId',
				header: 'Cấp phát cho quân nhân',
				cell: ({ row }) => {
					const unitId = row.original.unitId
					const options =
						unitId !== undefined
							? (studentsByUnitId.get(unitId) ?? [])
							: []
					return (
						<select
							className={reviewInputClass}
							value={row.original.assignedTrooperId ?? ''}
							disabled={unitId === undefined}
							onChange={(e) =>
								handleTrooperChange(row.index, e.target.value)
							}
						>
							<option value=''>Chưa cấp phát</option>
							{options.map((s) => (
								<option key={s.id} value={s.id}>
									{studentLabel(s)}
								</option>
							))}
						</select>
					)
				}
			}
		],
		[
			errorsByRowIndex,
			materialTypeOptions,
			unitOptions,
			roomsByUnitId,
			studentsByUnitId
		]
	)

	if (!isOpen) return null

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => {
				if (!open) handleClose()
			}}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Import vũ khí/trang bị</DialogTitle>
					{!isReviewing && (
						<DialogDescription>
							Tải lên file Excel hoặc CSV để thêm nhiều khí tài
							cùng lúc.
						</DialogDescription>
					)}
				</DialogHeader>

				<div className='space-y-6'>
					{!isReviewing && (
						<>
							<div className='flex items-start gap-3 rounded-lg border bg-muted/30 p-4'>
								<Info className='h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0' />
								<ol className='space-y-1.5 text-sm text-muted-foreground'>
									<li>
										<span className='font-medium text-foreground'>
											1.
										</span>{' '}
										Tải xuống file mẫu
									</li>
									<li>
										<span className='font-medium text-foreground'>
											2.
										</span>{' '}
										Điền thông tin khí tài theo định dạng
										mẫu
									</li>
									<li>
										<span className='font-medium text-foreground'>
											3.
										</span>{' '}
										Tải file lên và nhấn Import
									</li>
								</ol>
							</div>

							<div className='flex items-center justify-between rounded-lg border p-4'>
								<div className='flex items-center space-x-3'>
									<FileSpreadsheet className='h-8 w-8 text-emerald-600 dark:text-emerald-500' />
									<div>
										<h3 className='font-medium text-foreground'>
											File mẫu Excel
										</h3>
										<p className='text-sm text-muted-foreground'>
											Tải xuống để có cấu trúc dữ liệu
											chính xác
										</p>
									</div>
								</div>
								<Button
									variant='outline'
									onClick={downloadTemplate}
								>
									<Download className='h-4 w-4' />
									Tải xuống
								</Button>
							</div>

							<div className='space-y-4'>
								<h3 className='font-medium text-foreground'>
									Chọn file để import
								</h3>

								<div
									className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
										dragActive
											? 'border-primary bg-primary/5'
											: selectedFile
												? 'border-green-400 bg-green-50 dark:bg-green-950/30'
												: 'border-border hover:border-muted-foreground'
									}`}
									onDragEnter={handleDrag}
									onDragLeave={handleDrag}
									onDragOver={handleDrag}
									onDrop={handleDrop}
								>
									<input
										ref={fileInputRef}
										type='file'
										accept='.csv,.xlsx,.xls'
										onChange={handleFileInputChange}
										className='hidden'
									/>

									{selectedFile ? (
										<div className='space-y-3'>
											<CheckCircle className='h-12 w-12 text-green-500 mx-auto' />
											<div>
												<p className='font-medium text-green-700 dark:text-green-400'>
													{selectedFile.name}
												</p>
												<p className='text-sm text-muted-foreground'>
													{(
														selectedFile.size /
														1024 /
														1024
													).toFixed(2)}{' '}
													MB
												</p>
											</div>
											<Button
												variant='ghost'
												size='sm'
												onClick={() =>
													fileInputRef.current?.click()
												}
											>
												Chọn file khác
											</Button>
										</div>
									) : (
										<div className='space-y-3'>
											<FileUp className='h-12 w-12 text-muted-foreground mx-auto' />
											<div>
												<p className='text-muted-foreground'>
													Kéo thả file vào đây hoặc{' '}
													<button
														onClick={() =>
															fileInputRef.current?.click()
														}
														className='text-primary hover:underline font-medium'
													>
														chọn file
													</button>
												</p>
												<p className='text-sm text-muted-foreground mt-1'>
													Hỗ trợ file CSV, Excel
													(.xlsx, .xls)
												</p>
											</div>
										</div>
									)}
								</div>
							</div>
						</>
					)}

					{isReviewing && (
						<div className='space-y-4'>
							<div className='flex items-center justify-between'>
								<div className='flex items-center space-x-3'>
									<ClipboardList className='h-6 w-6 text-primary' />
									<div>
										<h3 className='font-medium text-foreground'>
											Xem trước dữ liệu import
										</h3>
										<p className='text-sm text-muted-foreground'>
											Kiểm tra và chỉnh sửa dữ liệu bên
											dưới trước khi import vào hệ thống
										</p>
									</div>
								</div>
								<Button
									variant='ghost'
									size='sm'
									onClick={resetDialog}
									disabled={uploadStatus === 'uploading'}
								>
									<ArrowLeft className='h-4 w-4' />
									Chọn file khác
								</Button>
							</div>

							<div className='flex flex-wrap items-center gap-3 text-sm'>
								<span className='text-muted-foreground'>
									Tổng số:{' '}
									<span className='font-medium text-foreground'>
										{assets.length}
									</span>
								</span>
								<Badge
									variant='outline'
									className='gap-1 border-green-400 text-green-700 dark:border-green-800 dark:text-green-400'
								>
									<CheckCircle className='h-3.5 w-3.5' />
									Hợp lệ: {validRowCount}
								</Badge>
								{errorsByRowIndex.size > 0 && (
									<Badge
										variant='destructive'
										className='gap-1'
									>
										<AlertCircle className='h-3.5 w-3.5' />
										Lỗi: {errorsByRowIndex.size}
									</Badge>
								)}
							</div>

							<DataTable
								columns={reviewColumns}
								data={assets}
								toolbarVisible={false}
								placeholder='Không có dữ liệu'
								getRowClassName={(_asset, index) =>
									errorsByRowIndex.has(index)
										? 'bg-destructive/5 hover:bg-destructive/10'
										: undefined
								}
							/>

							{errorsByRowIndex.size > 0 && (
								<p className='text-sm text-muted-foreground'>
									Di chuột vào nhãn "Lỗi" của từng dòng để xem
									chi tiết.
								</p>
							)}
						</div>
					)}

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
								parseErrors.length > 0 ||
								uploadStatus === 'uploading'
							}
							title={
								parseErrors.length > 0
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
