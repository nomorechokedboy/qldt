import type ExcelJS from 'exceljs'

// Data rows a template validates: from the first row users fill in (4).
const FIRST_VALIDATED_ROW = 4
const LAST_VALIDATED_ROW = 1000

export interface NamedOption {
	id: number
	label: string
}

// Row 1 is the Vietnamese header users see, row 2 the API header the parser
// reads (hidden), so both share one setup.
export function addTemplateSheet(
	workbook: ExcelJS.Workbook,
	vietnameseHeaders: string[],
	apiHeaders: string[],
	columnWidth: number
) {
	const sheet = workbook.addWorksheet('Mẫu Import')
	const headerRowVN = sheet.addRow(vietnameseHeaders)
	const headerRowAPI = sheet.addRow(apiHeaders)
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

	apiHeaders.forEach((_, index) => {
		sheet.getColumn(index + 1).width = columnWidth
	})

	return sheet
}

// Reference list that also feeds a dropdown; returns the last data row.
export function addReferenceSheet(
	workbook: ExcelJS.Workbook,
	sheetName: string,
	nameHeader: string,
	options: NamedOption[]
) {
	const sheet = workbook.addWorksheet(sheetName)
	sheet.addRow(['ID', nameHeader])
	options.forEach((o) => sheet.addRow([o.id, o.label]))
	sheet.getColumn(1).width = 10
	sheet.getColumn(2).width = 50
	return options.length + 1
}

// One column per unit holding that unit's items, each also a workbook-scoped
// named range "<prefix><unitId>", so a dropdown can cascade off the unit
// chosen in the same row via INDIRECT.
export function addPerUnitSheet<T>(
	workbook: ExcelJS.Workbook,
	sheetName: string,
	unitOptions: NamedOption[],
	itemsByUnit: Map<number, T[]>,
	getLabel: (item: T) => string,
	rangePrefix: string,
	{ skipEmptyUnits }: { skipEmptyUnits: boolean }
) {
	const sheet = workbook.addWorksheet(sheetName)
	let column = 0
	unitOptions.forEach((u) => {
		const items = itemsByUnit.get(u.id) ?? []
		if (skipEmptyUnits && items.length === 0) return
		column += 1
		sheet.getCell(1, column).value = u.label
		items.forEach((item, rowIdx) => {
			sheet.getCell(rowIdx + 2, column).value = getLabel(item)
		})
		sheet.getColumn(column).width = 30
		const letter = sheet.getColumn(column).letter
		const lastRow = Math.max(items.length, 1) + 1
		workbook.definedNames.add(
			`'${sheetName}'!$${letter}$2:$${letter}$${lastRow}`,
			`${rangePrefix}${u.id}`
		)
	})
}

function addListValidation(
	sheet: ExcelJS.Worksheet,
	apiHeaders: string[],
	header: string,
	formula: string
) {
	const col = apiHeaders.indexOf(header)
	if (col < 0) return
	const letter = sheet.getColumn(col + 1).letter
	sheet.dataValidations.add(
		`${letter}${FIRST_VALIDATED_ROW}:${letter}${LAST_VALIDATED_ROW}`,
		{ type: 'list', allowBlank: true, formulae: [formula] }
	)
}

export function addInlineListValidation(
	sheet: ExcelJS.Worksheet,
	apiHeaders: string[],
	header: string,
	labels: string[]
) {
	addListValidation(sheet, apiHeaders, header, `"${labels.join(',')}"`)
}

export function addRangeListValidation(
	sheet: ExcelJS.Worksheet,
	apiHeaders: string[],
	header: string,
	range: string
) {
	addListValidation(sheet, apiHeaders, header, range)
}

// Dropdown for `header` that lists the named range "<prefix><unitId>" of
// whichever unit the row's unit cell holds.
export function addUnitCascadeValidation(
	sheet: ExcelJS.Worksheet,
	apiHeaders: string[],
	{
		unitHeader,
		header,
		rangePrefix,
		lastUnitRow
	}: {
		unitHeader: string
		header: string
		rangePrefix: string
		lastUnitRow: number
	}
) {
	const unitCol = apiHeaders.indexOf(unitHeader)
	if (unitCol < 0) return
	const unitLetter = sheet.getColumn(unitCol + 1).letter
	addListValidation(
		sheet,
		apiHeaders,
		header,
		`INDIRECT("${rangePrefix}"&INDEX('Danh sách đơn vị'!$A$2:$A$${lastUnitRow},MATCH(${unitLetter}4,'Danh sách đơn vị'!$B$2:$B$${lastUnitRow},0)))`
	)
}

export function addInstructionSheet(
	workbook: ExcelJS.Workbook,
	title: string,
	steps: string[]
) {
	const sheet = workbook.addWorksheet('Hướng dẫn')
	;[[title], [''], ...steps.flatMap((step) => [[step], ['']])].forEach((r) =>
		sheet.addRow(r)
	)
	sheet.getColumn(1).width = 100
}

export async function saveWorkbook(
	workbook: ExcelJS.Workbook,
	fileName: string
) {
	const buffer = await workbook.xlsx.writeBuffer()
	const blob = new Blob([buffer], {
		type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
	})
	const url = URL.createObjectURL(blob)

	const link = document.createElement('a')
	link.href = url
	link.download = fileName
	link.click()
	URL.revokeObjectURL(url)
}

export async function downloadWithErrorAlert(build: () => Promise<void>) {
	try {
		await build()
	} catch (err) {
		console.error('Error:', err)
		alert(`Lỗi tạo file: ${(err as Error).message}`)
	}
}
