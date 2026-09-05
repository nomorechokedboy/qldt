import React, { useState, useRef, useMemo } from 'react'
import ExcelJS from 'exceljs'
import * as XLSX from 'xlsx'
import {
	FileUp,
	Download,
	AlertCircle,
	CheckCircle,
	X,
	Upload,
	FileSpreadsheet,
	Info,
	Users,
	ArrowRight
} from 'lucide-react'
import useCreateStudents from '@/hooks/useCreateStudents'
import { toIsoDate } from '@/common'
import type { StudentBody } from '@/types'
import useUnitsData from '@/hooks/useUnitsData'
import usePositionsData from '@/hooks/usePositionsData'
import type { Unit } from '@/types'
import { unitLevelLabels, unitLevelOrder } from '@/data/unit-levels'

// Mirrors personal-step.tsx's flattenUnitOptions - every unit at every level
// is a valid assignment target, not just squads.
function flattenUnitOptions(unit: Unit): { id: number; label: string }[] {
	const self = {
		id: unit.id,
		label: `${unit.name} (${unitLevelLabels[unit.level]})`
	}
	return [self, ...(unit.children ?? []).flatMap(flattenUnitOptions)]
}

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
	const { data: units = [] } = useUnitsData(undefined, { enabled: isOpen })
	const { data: positions = [] } = usePositionsData(undefined, {
		enabled: isOpen
	})

	const unitOptions = useMemo(
		() => units.flatMap(flattenUnitOptions),
		[units]
	)

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
					const group =
						p.group ?? unitLevelLabels[p.level as never] ?? p.level
					return { id: p.id, label: `${group} - ${p.name}` }
				}),
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

	const createStudentsMutation = useCreateStudents()
	const [students, setStudents] = useState<StudentBody[]>([])
	const [selectedFile, setSelectedFile] = useState(null)
	const [dragActive, setDragActive] = useState(false)
	const [uploadStatus, setUploadStatus] = useState('idle') // idle, uploading, success, error
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
	const fileInputRef = useRef(null)

	const downloadTemplate = async () => {
		try {
			const workbook = new ExcelJS.Workbook()

			// Headers mapping
			const headers = [
				'fullName',
				'studentId',
				'birthPlace',
				'address',
				'dob',
				'rank',
				'positionId',
				'previousUnit',
				'previousPosition',
				'ethnic',
				'religion',
				'enlistmentPeriod',
				'politicalOrg',
				'politicalOrgOfficialDate',
				'cpvId',
				'educationLevel',
				'schoolName',
				'major',
				'isGraduated',
				'talent',
				'shortcoming',
				'policyBeneficiaryGroup',
				'fatherName',
				'fatherDob',
				'fatherPhoneNumber',
				'fatherJob',
				'motherName',
				'motherDob',
				'motherPhoneNumber',
				'motherJob',
				'isMarried',
				'spouseName',
				'spouseDob',
				'spouseJob',
				'spousePhoneNumber',
				'familySize',
				'familyBackground',
				'familyBirthOrder',
				'achievement',
				'disciplinaryHistory',
				'childrenInfos',
				'phone',
				'unitId'
			]

			const vietnameseHeaders = [
				'Họ và tên',
				'Mã học viên',
				'Nơi sinh',
				'Địa chỉ',
				'Ngày sinh',
				'Cấp bậc',
				'Chức vụ',
				'Đơn vị cũ',
				'Chức vụ cũ',
				'Dân tộc',
				'Tôn giáo',
				'Thời gian nhập ngũ',
				'Đoàn/Đảng',
				'Ngày chính thức vào Đảng/Đoàn',
				'ID Đảng viên',
				'Trình độ học vấn',
				'Tên trường',
				'Chuyên ngành',
				'Đã tốt nghiệp',
				'Tài năng',
				'Thiếu sót',
				'Nhóm thụ hưởng chính sách',
				'Tên cha',
				'Ngày sinh cha',
				'SĐT cha',
				'Nghề nghiệp cha',
				'Tên mẹ',
				'Ngày sinh mẹ',
				'SĐT mẹ',
				'Nghề nghiệp mẹ',
				'Đã kết hôn',
				'Tên vợ/chồng',
				'Ngày sinh vợ/chồng',
				'Nghề nghiệp vợ/chồng',
				'SĐT vợ/chồng',
				'Số lượng thành viên gia đình',
				'Hoàn cảnh gia đình',
				'Thứ tự sinh',
				'Thành tích',
				'Lịch sử kỷ luật',
				'Thông tin con cái',
				'Số điện thoại',
				'Đơn vị'
			]

			const sampleData = [
				'Nguyễn Văn A',
				'',
				'Hà Nội',
				'123 Đường ABC',
				'01/01/2000',
				'Binh nhất',
				positionOptions.length ? positionOptions[0].label : '',
				'Đại đội 1',
				'',
				'Kinh',
				'Không',
				'2024',
				'Đoàn',
				'26/03/2020',
				'',
				'12/12',
				'THPT Hà Nội',
				'Toán',
				'Không',
				'Văn nghệ',
				'Chưa có',
				'Không',
				'Nguyễn Văn B',
				'01/01/1970',
				'0912345678',
				'Công nhân',
				'Trần Thị C',
				'02/02/1972',
				'0987654321',
				'Giáo viên',
				'Không',
				'',
				'',
				'',
				'',
				'4',
				'Không',
				'Con cả',
				'Học sinh giỏi',
				'',
				[],
				'0911222333',
				unitOptions.length ? unitOptions[0].label : ''
			]

			// ===== Sheet Mẫu Import =====
			const sheet = workbook.addWorksheet('Mẫu Import')
			const headerRowVN = sheet.addRow(vietnameseHeaders)
			const headerRowAPI = sheet.addRow(headers)
			sheet.addRow(sampleData)

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

			// Dropdown lists (inline lists - short enough to fit the ~255 char
			// formula limit for the "list" validation type)
			const dropdowns: Record<string, string[]> = {
				rank: [
					'Binh nhất',
					'Binh nhì',
					'Hạ sĩ',
					'Trung sĩ',
					'Thượng sĩ',
					'Thiếu úy chuyên nghiệp',
					'Trung úy chuyên nghiệp',
					'Thượng úy chuyên nghiệp',
					'Đại úy chuyên nghiệp',
					'Thiếu tá chuyên nghiệp',
					'Trung tá chuyên nghiệp',
					'Thượng tá chuyên nghiệp'
				],
				religion: [
					'Không',
					'Phật giáo',
					'Công giáo',
					'Cao Đài',
					'Tin Lành',
					'Hòa Hảo'
				],
				educationLevel: [
					'9/12',
					'10/12',
					'11/12',
					'12/12',
					'Cao đẳng',
					'Đại học',
					'Sau đại học'
				],
				ethnic: [
					'Kinh',
					'Tày',
					'Thái',
					'Mường',
					'Hoa',
					'Khơ-me',
					'Nùng',
					'H’mông'
				],
				isGraduated: ['Có', 'Không'],
				isMarried: ['Có', 'Không'],
				// Backend requires politicalOrg to be exactly 'hcyu'/'cpv'
				// (NOT NULL, no default - see schema/student.ts) - there is
				// no "not yet joined" state, so don't offer one here.
				politicalOrg: ['Đoàn', 'Đảng']
			}

			Object.entries(dropdowns).forEach(([field, values]) => {
				const col = headers.indexOf(field)
				if (col >= 0) {
					const colLetter = sheet.getColumn(col + 1).letter
					sheet.dataValidations.add(
						`${colLetter}4:${colLetter}1000`,
						{
							type: 'list',
							allowBlank: true,
							formulae: [`"${values.join(',')}"`]
						}
					)
				}
			})

			// ===== Sheet Đơn vị (reference list + dropdown source for unitId) =====
			const unitSheet = workbook.addWorksheet('Danh sách đơn vị')
			unitSheet.addRow(['ID', 'Tên đơn vị'])
			unitOptions.forEach((u) => unitSheet.addRow([u.id, u.label]))
			unitSheet.getColumn(1).width = 10
			unitSheet.getColumn(2).width = 50

			// ===== Sheet Chức vụ (reference list + dropdown source for positionId) =====
			const positionSheet = workbook.addWorksheet('Danh sách chức vụ')
			positionSheet.addRow(['ID', 'Chức vụ'])
			positionOptions.forEach((p) =>
				positionSheet.addRow([p.id, p.label])
			)
			positionSheet.getColumn(1).width = 10
			positionSheet.getColumn(2).width = 50

			// Dropdown cho unitId - the picker shows the unit's name (label),
			// which is resolved back to the numeric unitId on import.
			const unitCol = headers.indexOf('unitId')
			if (unitCol >= 0 && unitOptions.length) {
				const colLetter = sheet.getColumn(unitCol + 1).letter
				const lastRow = unitOptions.length + 1
				sheet.dataValidations.add(`${colLetter}4:${colLetter}1000`, {
					type: 'list',
					allowBlank: true,
					formulae: [`'Danh sách đơn vị'!$B$2:$B$${lastRow}`]
				})
			}

			// Dropdown cho positionId - same treatment as unitId, for the same
			// UX reason (pick a readable label instead of a raw numeric id).
			const positionCol = headers.indexOf('positionId')
			if (positionCol >= 0 && positionOptions.length) {
				const colLetter = sheet.getColumn(positionCol + 1).letter
				const lastRow = positionOptions.length + 1
				sheet.dataValidations.add(`${colLetter}4:${colLetter}1000`, {
					type: 'list',
					allowBlank: true,
					formulae: [`'Danh sách chức vụ'!$B$2:$B$${lastRow}`]
				})
			}

			const textDateFields = [
				'dob',
				'politicalOrgOfficialDate',
				'fatherDob',
				'motherDob',
				'spouseDob'
			]
			const numberFields = ['familySize']

			// set format cho từng column
			headers.forEach((field, index) => {
				const col = sheet.getColumn(index + 1)
				if (textDateFields.includes(field)) {
					col.numFmt = '@' // format text
				}
				if (numberFields.includes(field)) {
					col.numFmt = '0' // number format
				}
				col.width = 20 // cho dễ nhìn
			})
			// ===== Sheet Hướng dẫn =====
			const instructionData = [
				['📘 HƯỚNG DẪN NHẬP THÔNG TIN QUÂN NHÂN'],
				[''],
				[
					'1. Dòng thứ 3 (Nguyễn Văn A) chỉ là dữ liệu mẫu, KHÔNG được copy/sửa/xóa. ' +
						'Khi nhập xong toàn bộ dữ liệu có thể xóa dòng này đi, hoặc giữ nguyên thì quân nhân đó sẽ được thêm vào hệ thống.'
				],
				[''],
				[
					'2. Các cột ngày (dob, fatherDob, motherDob, spouseDob, politicalOrgOfficialDate...) ' +
						'bắt buộc nhập theo định dạng DD/MM/YYYY. Chỉ nhập dữ liệu, KHÔNG được đổi định dạng ô.'
				],
				[''],
				[
					'3. Trường childrenInfos: luôn nhập giá trị mặc định [] (nếu chưa có dữ liệu), nếu có dữ liệu sẽ được bổ sung sau trên hệ thống.'
				],
				[''],
				[
					'4. Cột Chức vụ và Đơn vị là danh sách chọn (dropdown) hiển thị tên thay vì mã số - vui lòng chỉ chọn từ danh sách có sẵn (xem thêm ở sheet "Danh sách đơn vị" / "Danh sách chức vụ").'
				],
				[''],
				[
					'5. Các cột có danh sách chọn (dropdown) khác vui lòng chỉ chọn từ danh sách có sẵn.'
				],
				[''],
				[
					'6. KHÔNG được thay đổi tên cột (row 1, row 2) và chỉ nhập dữ liệu từ dòng 4 trở đi.'
				],
				[''],
				[
					'7. Nếu có thắc mắc, vui lòng liên hệ bộ phận IT để được hỗ trợ.'
				],
				['']
			]

			const instructionSheet = workbook.addWorksheet('Hướng dẫn')
			instructionData.forEach((r) => instructionSheet.addRow(r))
			instructionSheet.getColumn(1).width = 100

			// Export file
			const buffer = await workbook.xlsx.writeBuffer()
			const blob = new Blob([buffer], {
				type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
			})
			const url = URL.createObjectURL(blob)

			const link = document.createElement('a')
			link.href = url
			link.download = 'Mau_Import_Hoc_Vien_Co_Dropdown.xlsx'
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

	const handleFileSelect = (file) => {
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

					const headers = jsonData[1] // API field names

					const booleanFields = ['isGraduated', 'isMarried']
					const dateFields = [
						'dob',
						'fatherDob',
						'motherDob',
						'spouseDob',
						'politicalOrgOfficialDate'
					]

					const rowErrors: { row: number; message: string }[] = []

					const students = dataRows.map((row, rowIndex) => {
						const student: Record<string, any> = {}

						headers.forEach((header, index) => {
							let value = row[index] ?? ''

							// Đoàn/Đảng → hcyu/cpv (backend enum, required)
							if (header === 'politicalOrg') {
								if (typeof value === 'string') {
									const normalized = value
										.trim()
										.toLowerCase()

									if (
										normalized.includes('đoàn') ||
										normalized === 'hcyu'
									) {
										value = 'hcyu'
									} else if (
										normalized.includes('đảng') ||
										normalized === 'cpv'
									) {
										value = 'cpv'
									} else {
										// Backend requires exactly 'hcyu'/'cpv' (NOT NULL,
										// no default) - anything else fails the whole insert batch.
										rowErrors.push({
											row: rowIndex + 4,
											message: `Giá trị "${value}" không hợp lệ cho Đoàn/Đảng - chỉ chấp nhận "Đoàn" hoặc "Đảng"`
										})
										value = ''
									}
								}
							}

							// ✅ Boolean fields
							if (booleanFields.includes(header)) {
								if (typeof value === 'string') {
									const normalized = value
										.trim()
										.toLowerCase()
									if (
										normalized === 'có' ||
										normalized === 'true'
									)
										value = true
									else if (
										normalized === 'không' ||
										normalized === 'false'
									)
										value = false
									else value = false // mặc định false nếu không hợp lệ
								}
							}

							// ✅ familySize → số
							if (header === 'familySize') {
								if (typeof value === 'string') {
									const parsed = parseInt(value, 10)
									value = isNaN(parsed) ? 0 : parsed
								} else if (typeof value !== 'number') {
									value = 0
								}
							}

							// ✅ cpvId luôn string
							if (header === 'cpvId') {
								value = value != null ? String(value) : ''
							}

							// ✅ unitId: dropdown giá trị là tên đơn vị, resolve
							// ngược lại về id qua unitLabelToId.
							if (header === 'unitId') {
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
										value = undefined
									} else {
										value = id
									}
								} else {
									value = undefined
								}
							}

							// ✅ positionId: dropdown giá trị là tên chức vụ,
							// resolve ngược lại về id qua positionLabelToId.
							if (header === 'positionId') {
								if (
									typeof value === 'string' &&
									value.trim() !== ''
								) {
									const id = positionLabelToId.get(
										value.trim().toLowerCase()
									)
									if (id === undefined) {
										rowErrors.push({
											row: rowIndex + 4,
											message: `Không tìm thấy chức vụ "${value}" trong danh sách chức vụ`
										})
										value = undefined
									} else {
										value = id
									}
								} else {
									value = undefined
								}
							}

							// ✅ childrenInfos
							if (header === 'childrenInfos') {
								value = []
							}

							// ✅ studentId luôn string
							if (header === 'studentId') {
								value = value != null ? String(value) : ''
							}

							// ✅ Date fields
							if (dateFields.includes(header)) {
								value = toIsoDate(value)
							}
							student[header] = value
						})

						return student as StudentBody
					})

					setStudents(students)
					setParseErrors(rowErrors)
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

		if (parseErrors.length > 0) {
			setUploadMessage(
				'Vui lòng sửa các dòng có lỗi tham chiếu trước khi import.'
			)
			setUploadStatus('error')
			setImportResults({
				successCount: 0,
				errorCount: parseErrors.length,
				totalCount: students.length,
				errors: parseErrors
			})
			return
		}

		setUploadStatus('uploading')
		setUploadMessage('Đang xử lý file...')

		try {
			await createStudentsMutation.mutateAsync(students)

			const mockResults = {
				successCount: students.length,
				errorCount: 0,
				totalCount: students.length,
				errors: []
			}

			setUploadStatus('success')
			setImportResults(mockResults)
			setUploadMessage(
				`Import hoàn tất! Thành công: ${mockResults.successCount}/${mockResults.totalCount} quân nhân`
			)
			onSuccess?.(mockResults)
		} catch (error) {
			console.error('Import error:', error)
			setUploadStatus('error')
			setUploadMessage(`Lỗi import: ${error?.message || error}`)

			// Set error results
			const errorResults = {
				successCount: 0,
				errorCount: students.length,
				totalCount: students.length,
				errors: [{ row: 1, message: error?.message || 'Unknown error' }]
			}
			setImportResults(errorResults)
		}
	}

	const resetDialog = () => {
		setSelectedFile(null)
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

	if (!isOpen) return null

	return (
		<div className='fixed inset-0 flex items-center justify-center z-50 bg-black/50 p-4'>
			<div className='bg-white rounded-xl w-[90vw] max-w-6xl max-h-[90vh] overflow-y-auto shadow-2xl'>
				{/* Header */}
				<div className='flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-xl'>
					<div className='flex items-center space-x-3'>
						<Users className='h-6 w-6' />
						<h2 className='text-xl font-semibold'>
							Import danh sách quân nhân
						</h2>
					</div>
					<button
						onClick={handleClose}
						className='text-white hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-white hover:bg-opacity-20'
					>
						<X className='h-5 w-5' />
					</button>
				</div>

				{/* Content */}
				<div className='p-6 space-y-6'>
					{/* Instructions */}
					<div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
						<div className='flex items-start space-x-3'>
							<Info className='h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0' />
							<div>
								<h3 className='font-medium text-blue-900 mb-2'>
									Hướng dẫn import
								</h3>
								<div className='text-sm text-blue-800 space-y-2'>
									<div className='flex items-center space-x-2'>
										<span className='bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium'>
											1
										</span>
										<span>Tải xuống file mẫu</span>
									</div>
									<div className='flex items-center space-x-2'>
										<span className='bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium'>
											2
										</span>
										<span>
											Điền thông tin quân nhân theo định
											dạng mẫu
										</span>
									</div>
									<div className='flex items-center space-x-2'>
										<span className='bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium'>
											3
										</span>
										<span>Tải file lên và nhấn Import</span>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Download template */}
					<div className='border border-gray-200 rounded-lg p-4'>
						<div className='flex items-center justify-between'>
							<div className='flex items-center space-x-3'>
								<FileSpreadsheet className='h-8 w-8 text-green-500' />
								<div>
									<h3 className='font-medium text-gray-900'>
										File mẫu Excel
									</h3>
									<p className='text-sm text-gray-500'>
										Tải xuống để có cấu trúc dữ liệu chính
										xác
									</p>
								</div>
							</div>
							<button
								onClick={downloadTemplate}
								className='flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors'
							>
								<Download className='h-4 w-4' />
								<span>Tải xuống</span>
							</button>
						</div>
					</div>

					{/* File upload area */}
					<div className='space-y-4'>
						<h3 className='font-medium text-gray-900'>
							Chọn file để import
						</h3>

						<div
							className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
								dragActive
									? 'border-blue-400 bg-blue-50'
									: selectedFile
										? 'border-green-400 bg-green-50'
										: 'border-gray-300 hover:border-gray-400'
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
										<p className='font-medium text-green-700'>
											{selectedFile.name}
										</p>
										<p className='text-sm text-gray-500'>
											{(
												selectedFile.size /
												1024 /
												1024
											).toFixed(2)}{' '}
											MB
										</p>
									</div>
									<button
										onClick={() =>
											fileInputRef.current?.click()
										}
										className='text-blue-500 hover:text-blue-600 text-sm font-medium'
									>
										Chọn file khác
									</button>
								</div>
							) : (
								<div className='space-y-3'>
									<FileUp className='h-12 w-12 text-gray-400 mx-auto' />
									<div>
										<p className='text-gray-600'>
											Kéo thả file vào đây hoặc{' '}
											<button
												onClick={() =>
													fileInputRef.current?.click()
												}
												className='text-blue-500 hover:text-blue-600 font-medium'
											>
												chọn file
											</button>
										</p>
										<p className='text-sm text-gray-400 mt-1'>
											Hỗ trợ file CSV, Excel (.xlsx, .xls)
										</p>
									</div>
								</div>
							)}
						</div>
					</div>

					{/* Status message */}
					{uploadMessage && (
						<div
							className={`flex items-center space-x-2 p-3 rounded-lg ${
								uploadStatus === 'success'
									? 'bg-green-50 text-green-700 border border-green-200'
									: uploadStatus === 'error'
										? 'bg-red-50 text-red-700 border border-red-200'
										: 'bg-blue-50 text-blue-700 border border-blue-200'
							}`}
						>
							{uploadStatus === 'success' && (
								<CheckCircle className='h-5 w-5 flex-shrink-0' />
							)}
							{uploadStatus === 'error' && (
								<AlertCircle className='h-5 w-5 flex-shrink-0' />
							)}
							{uploadStatus === 'uploading' && (
								<div className='animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500'></div>
							)}
							<span>{uploadMessage}</span>
						</div>
					)}

					{/* Import results */}
					{importResults && (
						<div className='bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3'>
							<h4 className='font-medium text-gray-900'>
								Kết quả import:
							</h4>
							<div className='grid grid-cols-3 gap-4 text-sm'>
								<div className='text-center'>
									<div className='text-2xl font-bold text-green-600'>
										{importResults.successCount}
									</div>
									<div className='text-gray-600'>
										Thành công
									</div>
								</div>
								<div className='text-center'>
									<div className='text-2xl font-bold text-red-600'>
										{importResults.errorCount}
									</div>
									<div className='text-gray-600'>Lỗi</div>
								</div>
								<div className='text-center'>
									<div className='text-2xl font-bold text-blue-600'>
										{importResults.totalCount}
									</div>
									<div className='text-gray-600'>
										Tổng cộng
									</div>
								</div>
							</div>

							{importResults.errors &&
								importResults.errors.length > 0 && (
									<div className='mt-3 space-y-2'>
										<h5 className='font-medium text-red-700'>
											Chi tiết lỗi:
										</h5>
										<div className='max-h-32 overflow-y-auto space-y-1'>
											{importResults.errors.map(
												(error, index) => (
													<div
														key={index}
														className='text-sm text-red-600 bg-red-50 p-2 rounded'
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

				{/* Footer */}
				<div className='flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl'>
					<button
						onClick={handleClose}
						className='px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors'
					>
						{uploadStatus === 'success' ? 'Đóng' : 'Hủy'}
					</button>

					{uploadStatus !== 'success' && (
						<button
							onClick={handleImport}
							disabled={
								!selectedFile || uploadStatus === 'uploading'
							}
							className='flex items-center space-x-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
						>
							{uploadStatus === 'uploading' ? (
								<>
									<div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
									<span>Đang import...</span>
								</>
							) : (
								<>
									<Upload className='h-4 w-4' />
									<span>Import danh sách</span>
									<ArrowRight className='h-4 w-4' />
								</>
							)}
						</button>
					)}
				</div>
			</div>
		</div>
	)
}
