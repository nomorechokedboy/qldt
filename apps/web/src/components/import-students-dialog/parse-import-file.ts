import { toIsoDate } from '@/common'
import { activityStatusOptions } from '@/data/activity-statuses'
import type { StudentBody } from '@/types'
import * as XLSX from 'xlsx'

export interface ParseImportFileParams {
	data: ArrayBuffer
	unitLabelToId: Map<string, number>
	positionLabelToId: Map<string, number>
	provinceNameToCode: Map<string, string>
	wardNameToCodeByProvince: Map<string, Map<string, string>>
}

export interface ParseImportFileResult {
	students: StudentBody[]
	rowErrors: { row: number; message: string }[]
}

export function parseImportFile({
	data,
	unitLabelToId,
	positionLabelToId,
	provinceNameToCode,
	wardNameToCodeByProvince
}: ParseImportFileParams): ParseImportFileResult {
	const workbook = XLSX.read(new Uint8Array(data), { type: 'array' })
	const sheetName = workbook.SheetNames[0]
	const worksheet = workbook.Sheets[sheetName]

	const jsonData = XLSX.utils.sheet_to_json(worksheet, {
		defval: '',
		header: 1
	})
	const dataRows = jsonData
		.slice(2)
		.filter((row) => row.some((cell) => cell !== '' && cell != null))

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
					const normalized = value.trim().toLowerCase()

					if (normalized.includes('đoàn') || normalized === 'hcyu') {
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
					typeof value === 'string' ? value.trim().toLowerCase() : ''
				if (normalized === '') {
					value = 'serving'
				} else {
					const match = activityStatusOptions.find(
						(o) =>
							o.label.toLowerCase() === normalized ||
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
					const normalized = value.trim().toLowerCase()
					if (normalized === 'có' || normalized === 'true')
						value = true
					else if (normalized === 'không' || normalized === 'false')
						value = false
					else value = false // mặc định false nếu không hợp lệ
				}
			}

			// ✅ familySize → số
			if (header === 'familySize') {
				if (typeof value === 'string') {
					const parsed = Number.parseInt(value, 10)
					value = Number.isNaN(parsed) ? 0 : parsed
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
				if (typeof value === 'string' && value.trim() !== '') {
					const id = unitLabelToId.get(value.trim().toLowerCase())
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
				if (typeof value === 'string' && value.trim() !== '') {
					const id = positionLabelToId.get(value.trim().toLowerCase())
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
					const decoded = XLSX.SSF.parse_date_code(value)
					value = decoded
						? `${String(decoded.m).padStart(2, '0')}/${decoded.y}`
						: ''
				} else {
					value = value != null ? String(value).trim() : ''
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

	return { students, rowErrors }
}
