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
import { materialConditionOptionsVi } from '@/data/material-categories'
import ExcelJS from 'exceljs'
import type { StockImportLookups } from './build-lookups'

const HEADERS = [
	'materialTypeName',
	'unitName',
	'roomName',
	'quantity',
	'condition'
]
const VIETNAMESE_HEADERS = [
	'Loại vật tư',
	'Đơn vị',
	'Vị trí',
	'Số lượng',
	'Tình trạng'
]

const INSTRUCTIONS = [
	'1. Dòng thứ 3 chỉ là dữ liệu mẫu, KHÔNG được copy/sửa/xóa. ' +
		'Khi nhập xong toàn bộ dữ liệu có thể xóa dòng này đi, hoặc giữ nguyên thì vật tư đó sẽ được thêm vào hệ thống.',
	'2. Cột Loại vật tư và Đơn vị là danh sách chọn (dropdown) hiển thị tên thay vì mã số - vui lòng chỉ chọn từ danh sách có sẵn.',
	'3. Cột Vị trí là danh sách chọn phụ thuộc vào Đơn vị đã chọn ở cùng dòng - vui lòng chọn Đơn vị trước, sau đó danh sách phòng sẽ tự động lọc theo đơn vị đó. Có thể để trống nếu chưa có vị trí cụ thể.',
	'4. Cột Số lượng bắt buộc phải là số nguyên dương.',
	'5. Cột Tình trạng là dropdown tuỳ chọn, mặc định là "Tốt" nếu để trống.',
	'6. KHÔNG được thay đổi tên cột (row 1, row 2) và chỉ nhập dữ liệu từ dòng 4 trở đi.',
	'7. Sau khi tải file lên, hệ thống sẽ hiển thị bảng xem trước để kiểm tra dữ liệu trước khi import vào hệ thống.'
]

export async function downloadStockImportTemplate(
	lookups: StockImportLookups,
	fileSuffix: string | number | undefined
) {
	const { unitOptions, materialTypeOptions } = lookups
	const workbook = new ExcelJS.Workbook()

	const sheet = addTemplateSheet(workbook, VIETNAMESE_HEADERS, HEADERS, 24)
	sheet.getColumn(HEADERS.indexOf('quantity') + 1).numFmt = '0'

	addInlineListValidation(
		sheet,
		HEADERS,
		'condition',
		materialConditionOptionsVi.map((o) => o.label)
	)

	const lastUnitRow = addReferenceSheet(
		workbook,
		'Danh sách đơn vị',
		'Tên đơn vị',
		unitOptions
	)
	const lastTypeRow = addReferenceSheet(
		workbook,
		'Danh sách vật tư',
		'Tên vật tư',
		materialTypeOptions
	)
	addPerUnitSheet(
		workbook,
		'Danh sách phòng',
		unitOptions,
		lookups.roomsByUnitId,
		(r) => r.name,
		'R',
		{ skipEmptyUnits: true }
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
			rangePrefix: 'R',
			lastUnitRow
		})
	}
	if (materialTypeOptions.length) {
		addRangeListValidation(
			sheet,
			HEADERS,
			'materialTypeName',
			`'Danh sách vật tư'!$B$2:$B$${lastTypeRow}`
		)
	}

	addInstructionSheet(
		workbook,
		'📘 HƯỚNG DẪN NHẬP VẬT TƯ SINH HOẠT',
		INSTRUCTIONS
	)

	sheet.addRow([
		materialTypeOptions.length ? materialTypeOptions[0].label : '',
		unitOptions.length ? unitOptions[0].label : '',
		'',
		'1',
		'Tốt'
	])

	await saveWorkbook(
		workbook,
		`Mau_Import_Vat_Tu_Sinh_Hoat_${fileSuffix}.xlsx`
	)
}
