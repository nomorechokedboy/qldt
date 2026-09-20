import {
	addInlineListValidation,
	addInstructionSheet,
	addPerUnitSheet,
	addRangeListValidation,
	addReferenceSheet,
	addTemplateSheet,
	addUnitCascadeValidation,
	saveWorkbook
} from '@/components/material-import/template-helpers'
import {
	materialAssetStatusOptionsVi,
	materialConditionOptionsVi
} from '@/data/material-categories'
import ExcelJS from 'exceljs'
import { studentLabel, type AssetImportLookups } from './build-lookups'

const HEADERS = [
	'materialTypeName',
	'serialNumber',
	'unitName',
	'roomName',
	'condition',
	'status',
	'assignedTrooperName'
]
const VIETNAMESE_HEADERS = [
	'Loại khí tài',
	'Số sê-ri',
	'Đơn vị',
	'Vị trí',
	'Tình trạng',
	'Trạng thái sử dụng',
	'Cấp phát cho quân nhân'
]

const INSTRUCTIONS = [
	'1. Dòng thứ 3 chỉ là dữ liệu mẫu, KHÔNG được copy/sửa/xóa. ' +
		'Khi nhập xong toàn bộ dữ liệu có thể xóa dòng này đi, hoặc giữ nguyên thì khí tài đó sẽ được thêm vào hệ thống.',
	'2. Cột Loại khí tài và Đơn vị là danh sách chọn (dropdown) hiển thị tên thay vì mã số - vui lòng chỉ chọn từ danh sách có sẵn.',
	'3. Cột Vị trí và Cấp phát cho quân nhân là danh sách chọn phụ thuộc vào Đơn vị đã chọn ở cùng dòng - vui lòng chọn Đơn vị trước, sau đó danh sách sẽ tự động lọc theo đơn vị đó. Có thể để trống nếu chưa xác định.',
	'4. Cột Số sê-ri bắt buộc và phải là duy nhất.',
	'5. Cột Tình trạng và Trạng thái sử dụng là dropdown tuỳ chọn.',
	'6. KHÔNG được thay đổi tên cột (row 1, row 2) và chỉ nhập dữ liệu từ dòng 4 trở đi.',
	'7. Sau khi tải file lên, hệ thống sẽ hiển thị bảng xem trước để kiểm tra dữ liệu trước khi import vào hệ thống.'
]

export async function downloadAssetImportTemplate(
	lookups: AssetImportLookups,
	fileSuffix: string | number
) {
	const { unitOptions, materialTypeOptions } = lookups
	const workbook = new ExcelJS.Workbook()

	const sheet = addTemplateSheet(workbook, VIETNAMESE_HEADERS, HEADERS, 26)

	const lastUnitRow = addReferenceSheet(
		workbook,
		'Danh sách đơn vị',
		'Tên đơn vị',
		unitOptions
	)
	const lastTypeRow = addReferenceSheet(
		workbook,
		'Danh sách khí tài',
		'Tên khí tài',
		materialTypeOptions
	)
	addPerUnitSheet(
		workbook,
		'Danh sách phòng',
		unitOptions,
		lookups.roomsByUnitId,
		(r) => r.name,
		'Room',
		{ skipEmptyUnits: false }
	)
	addPerUnitSheet(
		workbook,
		'Danh sách quân nhân',
		unitOptions,
		lookups.studentsByUnitId,
		studentLabel,
		'Trooper',
		{ skipEmptyUnits: false }
	)

	if (unitOptions.length) {
		addRangeListValidation(
			sheet,
			HEADERS,
			'unitName',
			`'Danh sách đơn vị'!$B$2:$B$${lastUnitRow}`
		)
		addUnitCascadeValidation(sheet, HEADERS, {
			unitHeader: 'unitName',
			header: 'roomName',
			rangePrefix: 'Room',
			lastUnitRow
		})
		addUnitCascadeValidation(sheet, HEADERS, {
			unitHeader: 'unitName',
			header: 'assignedTrooperName',
			rangePrefix: 'Trooper',
			lastUnitRow
		})
	}
	if (materialTypeOptions.length) {
		addRangeListValidation(
			sheet,
			HEADERS,
			'materialTypeName',
			`'Danh sách khí tài'!$B$2:$B$${lastTypeRow}`
		)
	}
	addInlineListValidation(
		sheet,
		HEADERS,
		'condition',
		materialConditionOptionsVi.map((o) => o.label)
	)
	addInlineListValidation(
		sheet,
		HEADERS,
		'status',
		materialAssetStatusOptionsVi.map((o) => o.label)
	)

	addInstructionSheet(
		workbook,
		'📘 HƯỚNG DẪN NHẬP VŨ KHÍ/TRANG BỊ',
		INSTRUCTIONS
	)

	sheet.addRow([
		materialTypeOptions.length ? materialTypeOptions[0].label : '',
		'AK-000001',
		unitOptions.length ? unitOptions[0].label : '',
		'',
		'Tốt',
		'Đang sử dụng',
		''
	])

	await saveWorkbook(
		workbook,
		`Mau_Import_Vu_Khi_Trang_Bi_${fileSuffix}.xlsx`
	)
}
