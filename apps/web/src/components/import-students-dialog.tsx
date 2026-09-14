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
import useCreateStudents from '@/hooks/useCreateStudents'
import { toIsoDate, toDdMmYyyy } from '@/common'
import type { StudentBody } from '@/types'
import useUnitsData from '@/hooks/useUnitsData'
import usePositionsData from '@/hooks/usePositionsData'
import useProvinces from '@/hooks/useProvinces'
import useWards from '@/hooks/useWards'
import { unitLevelLabels, unitLevelOrder } from '@/data/unit-levels'
import { activityStatusOptions } from '@/data/activity-statuses'
import { buildUnitsById, unitLabelWithAncestry } from '@/lib/unit-labels'
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
import type { ColumnDef } from '@tanstack/react-table'

export const reviewInputClass =
	'w-full min-w-28 bg-transparent border border-transparent hover:border-border focus:border-primary focus:outline-none rounded px-1.5 py-1'

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
	const { data: provinces = [] } = useProvinces({ enabled: isOpen })
	// Unfiltered - the whole ward list is needed up front to build the
	// per-province cascading dropdown sheet and the name->code lookup used
	// when parsing the uploaded file back.
	const { data: wards = [] } = useWards(undefined, { enabled: isOpen })

	// `units` is already a flat list of every unit the caller is
	// authorized for (each row also carries a shallow `children`
	// relation), so mapping directly avoids re-adding non-root units
	// a second time via `.children`.
	const unitsById = useMemo(() => buildUnitsById(units), [units])
	const unitOptions = useMemo(
		() =>
			units.map((u) => ({
				id: u.id,
				label: unitLabelWithAncestry(u, unitsById)
			})),
		[units, unitsById]
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
	const [students, setStudents] = useState<StudentBody[]>([])
	const [selectedFile, setSelectedFile] = useState<File | null>(null)
	const [dragActive, setDragActive] = useState(false)
	// idle -> ready (parsed, awaiting review confirmation) -> uploading ->
	// success | error (error can also happen pre-parse, e.g. wrong file type)
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

	// Once a file has been parsed into `students`, the dialog switches from
	// the upload step to the review step until the user either confirms the
	// import (-> success) or goes back to pick a different file.
	const isReviewing = students.length > 0 && uploadStatus !== 'success'

	// Row errors are recorded against the Excel row number (dataRow index +
	// 4, see handleFileSelect), which is a fixed offset from the matching
	// `students` array index - used to highlight bad rows in the review table.
	const errorsByStudentIndex = useMemo(() => {
		const map = new Map<number, string[]>()
		parseErrors.forEach((e) => {
			const index = e.row - 4
			const list = map.get(index) ?? []
			list.push(e.message)
			map.set(index, list)
		})
		return map
	}, [parseErrors])

	const validRowCount = students.length - errorsByStudentIndex.size

	const downloadTemplate = async () => {
		try {
			const workbook = new ExcelJS.Workbook()

			// Headers mapping
			const headers = [
				'fullName',
				'studentId',
				'birthPlaceProvinceName',
				'birthPlaceWardName',
				'birthPlaceDetail',
				'addressProvinceName',
				'addressWardName',
				'addressDetail',
				'dob',
				'phone',
				'unitId',
				'rank',
				'positionId',
				'ethnic',
				'religion',
				'enlistmentPeriod',
				'activityStatus',
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
				'disciplinaryHistory'
			]

			const vietnameseHeaders = [
				'Họ và tên',
				'Mã số quân nhân',
				'Tỉnh/Thành (Quê quán)',
				'Phường/Xã (Quê quán)',
				'Số nhà, đường (Quê quán)',
				'Tỉnh/Thành (Trú quán)',
				'Phường/Xã (Trú quán)',
				'Số nhà, đường (Trú quán)',
				'Ngày sinh',
				'Số điện thoại',
				'Đơn vị',
				'Cấp bậc',
				'Chức vụ',
				'Dân tộc',
				'Tôn giáo',
				'Thời gian nhập ngũ',
				'Tình trạng',
				'Đoàn/Đảng',
				'Ngày chính thức vào Đảng/Đoàn',
				'Số thẻ Đảng',
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
				'Lịch sử kỷ luật'
			]

			const sampleProvince = provinces[0]
			const sampleWard = sampleProvince
				? (wardsByProvinceCode.get(sampleProvince.code)?.[0] ?? null)
				: null

			const sampleData = [
				'Nguyễn Văn A',
				'',
				sampleProvince?.nameWithType ?? '',
				sampleWard?.nameWithType ?? '',
				'123 Đường ABC',
				sampleProvince?.nameWithType ?? '',
				sampleWard?.nameWithType ?? '',
				'123 Đường ABC',
				'01/01/2000',
				'0911222333',
				unitOptions.length ? unitOptions[0].label : '',
				'Binh nhất',
				positionOptions.length ? positionOptions[0].label : '',
				'Kinh',
				'Không',
				'2024',
				'Đang phục vụ',
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
				'Không'
			]

			// ===== Sheet Mẫu Import =====
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
				activityStatus: activityStatusOptions.map((o) => o.label),
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

			// ===== Sheet Tỉnh/Thành (reference list + dropdown source for the
			// two *ProvinceName columns) =====
			// Excel worksheet names can't contain '/' (or \ ? * [ ] :), so this
			// intentionally drops the slash that "Tỉnh/Thành" would otherwise have.
			const provinceSheet = workbook.addWorksheet('Danh sách tỉnh thành')
			provinceSheet.addRow(['Mã', 'Tên'])
			provinces.forEach((p) =>
				provinceSheet.addRow([p.code, p.nameWithType])
			)
			provinceSheet.getColumn(1).width = 10
			provinceSheet.getColumn(2).width = 40
			const lastProvinceRow = provinces.length + 1

			// ===== Sheet Phường/Xã - one column per province. Each column also
			// becomes a workbook-scoped named range "P<code>", which the ward
			// dropdowns below resolve into via INDIRECT so the ward list
			// cascades off whichever province was picked in the same row. =====
			const wardSheet = workbook.addWorksheet('Danh sách phường xã')
			provinces.forEach((p, colIdx) => {
				const col = colIdx + 1
				wardSheet.getCell(1, col).value = p.nameWithType
				const provinceWards = wardsByProvinceCode.get(p.code) ?? []
				provinceWards.forEach((w, rowIdx) => {
					wardSheet.getCell(rowIdx + 2, col).value = w.nameWithType
				})
				wardSheet.getColumn(col).width = 30

				if (provinceWards.length > 0) {
					const colLetter = wardSheet.getColumn(col).letter
					workbook.definedNames.add(
						`'Danh sách phường xã'!$${colLetter}$2:$${colLetter}$${provinceWards.length + 1}`,
						`P${p.code}`
					)
				}
			})

			// Dropdown cho *ProvinceName - every province's display name.
			;['birthPlaceProvinceName', 'addressProvinceName'].forEach(
				(field) => {
					const col = headers.indexOf(field)
					if (col >= 0 && provinces.length) {
						const colLetter = sheet.getColumn(col + 1).letter
						sheet.dataValidations.add(
							`${colLetter}4:${colLetter}1000`,
							{
								type: 'list',
								allowBlank: true,
								formulae: [
									`'Danh sách tỉnh thành'!$B$2:$B$${lastProvinceRow}`
								]
							}
						)
					}
				}
			)

			// Dropdown cho *WardName - cascades off the matching *ProvinceName
			// cell in the same row: resolves that province's code, then
			// INDIRECTs into the "P<code>" named range built above, so only
			// wards belonging to the chosen province are offered.
			;[
				{
					provinceField: 'birthPlaceProvinceName',
					wardField: 'birthPlaceWardName'
				},
				{
					provinceField: 'addressProvinceName',
					wardField: 'addressWardName'
				}
			].forEach(({ provinceField, wardField }) => {
				const provinceCol = headers.indexOf(provinceField)
				const wardCol = headers.indexOf(wardField)
				if (provinceCol >= 0 && wardCol >= 0 && provinces.length) {
					const provinceColLetter = sheet.getColumn(
						provinceCol + 1
					).letter
					const wardColLetter = sheet.getColumn(wardCol + 1).letter
					sheet.dataValidations.add(
						`${wardColLetter}4:${wardColLetter}1000`,
						{
							type: 'list',
							allowBlank: true,
							formulae: [
								`INDIRECT("P"&INDEX('Danh sách tỉnh thành'!$A$2:$A$${lastProvinceRow},MATCH(${provinceColLetter}4,'Danh sách tỉnh thành'!$B$2:$B$${lastProvinceRow},0)))`
							]
						}
					)
				}
			})

			const textDateFields = [
				'dob',
				'politicalOrgOfficialDate',
				'fatherDob',
				'motherDob',
				'spouseDob'
			]
			const numberFields = ['familySize']
			const forcedTextFields = [
				'phone',
				'fatherPhoneNumber',
				'motherPhoneNumber',
				'spousePhoneNumber',
				'enlistmentPeriod',
				'studentId',
				'cpvId'
			]

			// set format cho từng column
			headers.forEach((field, index) => {
				const col = sheet.getColumn(index + 1)
				if (
					textDateFields.includes(field) ||
					forcedTextFields.includes(field)
				) {
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
					'3. Cột Chức vụ và Đơn vị là danh sách chọn (dropdown) hiển thị tên thay vì mã số - vui lòng chỉ chọn từ danh sách có sẵn (xem thêm ở sheet "Danh sách đơn vị" / "Danh sách chức vụ").'
				],
				[''],
				[
					'4. Các cột có danh sách chọn (dropdown) khác vui lòng chỉ chọn từ danh sách có sẵn.'
				],
				[''],
				[
					'5. KHÔNG được thay đổi tên cột (row 1, row 2) và chỉ nhập dữ liệu từ dòng 4 trở đi.'
				],
				[''],
				[
					'6. Cột Tỉnh/Thành và Phường/Xã (cho cả Quê quán và Trú quán): vui lòng chọn Tỉnh/Thành trước, ' +
						'sau đó danh sách Phường/Xã sẽ tự động lọc theo Tỉnh/Thành đã chọn. Cả hai đều bắt buộc đối với quân nhân mới.'
				],
				[''],
				[
					'7. Sau khi tải file lên, hệ thống sẽ hiển thị bảng xem trước để kiểm tra dữ liệu trước khi import vào hệ thống.'
				],
				[''],
				[
					'8. Nếu có thắc mắc, vui lòng liên hệ bộ phận IT để được hỗ trợ.'
				],
				['']
			]

			const instructionSheet = workbook.addWorksheet('Hướng dẫn')
			instructionData.forEach((r) => instructionSheet.addRow(r))
			instructionSheet.getColumn(1).width = 100

			// Set sample data
			sheet.addRow(sampleData)

			// Export file
			const buffer = await workbook.xlsx.writeBuffer()
			const blob = new Blob([buffer], {
				type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
			})
			const url = URL.createObjectURL(blob)

			const link = document.createElement('a')
			link.href = url
			link.download = 'Mau_Import_Quan_Nhan.xlsx'
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

					const headers = jsonData[1] // API field names

					const booleanFields = ['isGraduated', 'isMarried']
					const dateFields = [
						'dob',
						'fatherDob',
						'motherDob',
						'spouseDob',
						'politicalOrgOfficialDate'
					]
					const forcedTextFields = [
						'phone',
						'fatherPhoneNumber',
						'motherPhoneNumber',
						'spousePhoneNumber',
						'studentId',
						'cpvId'
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

							// Tình trạng → activityStatus enum key. Blank defaults
							// to 'serving' (on duty); the backend column itself
							// also defaults to 'serving', but resolving it here
							// too keeps the preview table showing the real value.
							if (header === 'activityStatus') {
								const normalized =
									typeof value === 'string'
										? value.trim().toLowerCase()
										: ''
								if (normalized === '') {
									value = 'serving'
								} else {
									const match = activityStatusOptions.find(
										(o) =>
											o.label.toLowerCase() ===
												normalized ||
											o.value === normalized
									)
									if (match) {
										value = match.value
									} else {
										rowErrors.push({
											row: rowIndex + 4,
											message: `Giá trị "${value}" không hợp lệ cho Tình trạng`
										})
										value = 'serving'
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

							if (forcedTextFields.includes(header)) {
								if (typeof value === 'number') {
									value = String(Math.trunc(value))
								} else if (value != null) {
									value = String(value).trim()
								} else {
									value = ''
								}
							}

							if (header === 'enlistmentPeriod') {
								if (typeof value === 'number') {
									// Excel silently turned "03/2026" into a date serial — decode it
									// back into month/year instead of losing the data.
									const decoded =
										XLSX.SSF.parse_date_code(value)
									value = decoded
										? `${String(decoded.m).padStart(2, '0')}/${decoded.y}`
										: ''
								} else {
									value =
										value != null
											? String(value).trim()
											: ''
								}
							}
							student[header] = value
						})

						student.childrenInfos = []
						student.previousUnit = ''
						student.previousPosition = ''

						// Resolve the imported "<prefix>ProvinceName"/
						// "<prefix>WardName" dropdown values back to codes,
						// scoped to the row's own province (ward names
						// aren't globally unique). Both are required since
						// import always creates new students - same rule
						// the backend enforces in
						// controller.ts#validatePlaceCodes.
						const resolvePlace = (
							prefix: 'birthPlace' | 'address',
							placeLabel: string
						) => {
							const provinceNameKey = `${prefix}ProvinceName`
							const wardNameKey = `${prefix}WardName`
							const detailKey = `${prefix}Detail`

							const provinceName =
								typeof student[provinceNameKey] === 'string'
									? student[provinceNameKey].trim()
									: ''
							const wardName =
								typeof student[wardNameKey] === 'string'
									? student[wardNameKey].trim()
									: ''
							const detail =
								typeof student[detailKey] === 'string'
									? student[detailKey].trim()
									: ''

							delete student[provinceNameKey]
							delete student[wardNameKey]
							delete student[detailKey]
							student[prefix] = detail

							if (provinceName === '' && wardName === '') {
								rowErrors.push({
									row: rowIndex + 4,
									message: `Vui lòng chọn Tỉnh/Thành và Phường/Xã cho ${placeLabel}`
								})
								return
							}

							const provinceCode = provinceNameToCode.get(
								provinceName.toLowerCase()
							)
							if (provinceCode === undefined) {
								rowErrors.push({
									row: rowIndex + 4,
									message: `Không tìm thấy Tỉnh/Thành "${provinceName}" (${placeLabel})`
								})
								return
							}

							const wardCode = wardNameToCodeByProvince
								.get(provinceCode)
								?.get(wardName.toLowerCase())
							if (wardCode === undefined) {
								rowErrors.push({
									row: rowIndex + 4,
									message: `Không tìm thấy Phường/Xã "${wardName}" thuộc Tỉnh/Thành "${provinceName}" (${placeLabel})`
								})
								return
							}

							student[`${prefix}ProvinceCode`] = provinceCode
							student[`${prefix}WardCode`] = wardCode
						}

						resolvePlace('birthPlace', 'Quê quán')
						resolvePlace('address', 'Trú quán')

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

			const results = {
				successCount: students.length,
				errorCount: 0,
				totalCount: students.length,
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
				errorCount: students.length,
				totalCount: students.length,
				errors: [{ row: 1, message: error?.message || 'Unknown error' }]
			}
			setImportResults(errorResults)
		}
	}

	const resetDialog = () => {
		setSelectedFile(null)
		setStudents([])
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

	// Lets the user fix a row directly in the review table instead of having
	// to re-upload the whole file for a small mistake.
	const updateStudentField = <K extends keyof StudentBody>(
		index: number,
		field: K,
		value: StudentBody[K]
	) => {
		setStudents((prev) =>
			prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
		)
	}

	// Picking a unit/position from the dropdown always yields a valid id, so
	// the "not found" parse error recorded for this row (if any) no longer
	// applies once the user has corrected it here.
	const handleUnitChange = (index: number, value: string) => {
		const id = value === '' ? undefined : Number(value)
		updateStudentField(index, 'unitId', id)
		if (id !== undefined) {
			setParseErrors((prev) =>
				prev.filter(
					(e) =>
						!(e.row === index + 4 && e.message.includes('đơn vị'))
				)
			)
		}
	}

	const handlePositionChange = (index: number, value: string) => {
		const id = value === '' ? undefined : Number(value)
		updateStudentField(index, 'positionId', id)
		if (id !== undefined) {
			setParseErrors((prev) =>
				prev.filter(
					(e) =>
						!(e.row === index + 4 && e.message.includes('chức vụ'))
				)
			)
		}
	}

	const reviewColumns = useMemo<ColumnDef<StudentBody>[]>(
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
					const rowErrors = errorsByStudentIndex.get(row.index)
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
				accessorKey: 'fullName',
				header: 'Họ và tên',
				cell: ({ row }) => (
					<input
						type='text'
						className={reviewInputClass}
						value={row.original.fullName ?? ''}
						onChange={(e) =>
							updateStudentField(
								row.index,
								'fullName',
								e.target.value
							)
						}
					/>
				)
			},
			{
				accessorKey: 'studentId',
				header: 'Mã số QN',
				cell: ({ row }) => (
					<input
						type='text'
						className={reviewInputClass}
						value={row.original.studentId ?? ''}
						onChange={(e) =>
							updateStudentField(
								row.index,
								'studentId',
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
				accessorKey: 'positionId',
				header: 'Chức vụ',
				cell: ({ row }) => (
					<select
						className={reviewInputClass}
						value={row.original.positionId ?? ''}
						onChange={(e) =>
							handlePositionChange(row.index, e.target.value)
						}
					>
						<option value=''>-- Chọn chức vụ --</option>
						{positionOptions.map((o) => (
							<option key={o.id} value={o.id}>
								{o.label}
							</option>
						))}
					</select>
				)
			},
			{
				accessorKey: 'rank',
				header: 'Cấp bậc',
				cell: ({ row }) => (
					<input
						type='text'
						className={reviewInputClass}
						value={row.original.rank ?? ''}
						onChange={(e) =>
							updateStudentField(
								row.index,
								'rank',
								e.target.value
							)
						}
					/>
				)
			},
			{
				accessorKey: 'dob',
				header: 'Ngày sinh',
				cell: ({ row }) => (
					<input
						type='date'
						className={reviewInputClass}
						value={row.original.dob ?? ''}
						onChange={(e) =>
							updateStudentField(row.index, 'dob', e.target.value)
						}
					/>
				)
			},
			{
				accessorKey: 'phone',
				header: 'SĐT',
				cell: ({ row }) => (
					<input
						type='text'
						className={reviewInputClass}
						value={row.original.phone ?? ''}
						onChange={(e) =>
							updateStudentField(
								row.index,
								'phone',
								e.target.value
							)
						}
					/>
				)
			},
			{
				accessorKey: 'activityStatus',
				header: 'Tình trạng',
				cell: ({ row }) => (
					<select
						className={reviewInputClass}
						value={row.original.activityStatus ?? 'serving'}
						onChange={(e) =>
							updateStudentField(
								row.index,
								'activityStatus',
								e.target.value as StudentBody['activityStatus']
							)
						}
					>
						{activityStatusOptions.map((o) => (
							<option key={o.value} value={o.value}>
								{o.label}
							</option>
						))}
					</select>
				)
			}
		],
		[errorsByStudentIndex, unitOptions, positionOptions]
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
						<>
							{/* Instructions */}
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
										Điền thông tin quân nhân theo định dạng
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

							{/* Download template */}
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

							{/* File upload area */}
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
										{students.length}
									</span>
								</span>
								<Badge
									variant='outline'
									className='gap-1 border-green-400 text-green-700 dark:border-green-800 dark:text-green-400'
								>
									<CheckCircle className='h-3.5 w-3.5' />
									Hợp lệ: {validRowCount}
								</Badge>
								{errorsByStudentIndex.size > 0 && (
									<Badge
										variant='destructive'
										className='gap-1'
									>
										<AlertCircle className='h-3.5 w-3.5' />
										Lỗi: {errorsByStudentIndex.size}
									</Badge>
								)}
							</div>

							<DataTable
								columns={reviewColumns}
								data={students}
								toolbarVisible={false}
								placeholder='Không có dữ liệu'
								getRowClassName={(_student, index) =>
									errorsByStudentIndex.has(index)
										? 'bg-destructive/5 hover:bg-destructive/10'
										: undefined
								}
							/>

							{errorsByStudentIndex.size > 0 && (
								<p className='text-sm text-muted-foreground'>
									Di chuột vào nhãn "Lỗi" của từng dòng để xem
									chi tiết. Một số lỗi (quê quán/trú quán
									không hợp lệ) cần được sửa trong file và tải
									lên lại.
								</p>
							)}
						</div>
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
