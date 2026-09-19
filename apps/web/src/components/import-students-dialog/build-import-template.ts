import { activityStatusOptions } from '@/data/activity-statuses'
import { eduLevelOptions } from '@/data/education-levels'
import { EhtnicOptions } from '@/data/ethnicities'
import { rankOptions } from '@/data/ranks'
import { religionOptions } from '@/data/religions'
import ExcelJS from 'exceljs'

interface PlaceOption {
	code: string
	nameWithType: string
}

interface LabeledOption {
	id: number
	label: string
}

export interface DownloadImportTemplateParams {
	provinces: PlaceOption[]
	wardsByProvinceCode: Map<string, PlaceOption[]>
	unitOptions: LabeledOption[]
	positionOptions: LabeledOption[]
}

export async function downloadImportTemplate({
	provinces,
	wardsByProvinceCode,
	unitOptions,
	positionOptions
}: DownloadImportTemplateParams): Promise<void> {
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
			rank: rankOptions.map((opt) => opt.value),
			religion: religionOptions.map((opt) => opt.value),
			educationLevel: eduLevelOptions.map((opt) => opt.value),
			ethnic: EhtnicOptions.map((opt) => opt.value),
			isGraduated: ['Có', 'Không'],
			isMarried: ['Có', 'Không'],
			activityStatus: activityStatusOptions.map((o) => o.label),
			// Backend requires politicalOrg to be exactly 'hcyu'/'cpv'
			// (NOT NULL, no default - see schema/student.ts) - there is
			// no "not yet joined" state, so don't offer one here.
			politicalOrg: ['Đoàn', 'Đảng']
		}

		for (const [field, values] of Object.entries(dropdowns)) {
			const col = headers.indexOf(field)
			if (col >= 0) {
				const colLetter = sheet.getColumn(col + 1).letter
				sheet.dataValidations.add(`${colLetter}4:${colLetter}1000`, {
					type: 'list',
					allowBlank: true,
					formulae: [`"${values.join(',')}"`]
				})
			}
		}

		// ===== Sheet Đơn vị (reference list + dropdown source for unitId) =====
		const unitSheet = workbook.addWorksheet('Danh sách đơn vị')
		unitSheet.addRow(['ID', 'Tên đơn vị'])
		for (const u of unitOptions) {
			unitSheet.addRow([u.id, u.label])
		}
		unitSheet.getColumn(1).width = 10
		unitSheet.getColumn(2).width = 50

		// ===== Sheet Chức vụ (reference list + dropdown source for positionId) =====
		const positionSheet = workbook.addWorksheet('Danh sách chức vụ')
		positionSheet.addRow(['ID', 'Chức vụ'])
		for (const p of positionOptions) {
			positionSheet.addRow([p.id, p.label])
		}
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
		for (const p of provinces) {
			provinceSheet.addRow([p.code, p.nameWithType])
		}
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
		for (const field of ['birthPlaceProvinceName', 'addressProvinceName']) {
			const col = headers.indexOf(field)
			if (col >= 0 && provinces.length) {
				const colLetter = sheet.getColumn(col + 1).letter
				sheet.dataValidations.add(`${colLetter}4:${colLetter}1000`, {
					type: 'list',
					allowBlank: true,
					formulae: [
						`'Danh sách tỉnh thành'!$B$2:$B$${lastProvinceRow}`
					]
				})
			}
		}

		// Dropdown cho *WardName - cascades off the matching *ProvinceName
		// cell in the same row: resolves that province's code, then
		// INDIRECTs into the "P<code>" named range built above, so only
		// wards belonging to the chosen province are offered.
		for (const { provinceField, wardField } of [
			{
				provinceField: 'birthPlaceProvinceName',
				wardField: 'birthPlaceWardName'
			},
			{
				provinceField: 'addressProvinceName',
				wardField: 'addressWardName'
			}
		]) {
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
		}

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
			['8. Nếu có thắc mắc, vui lòng liên hệ bộ phận IT để được hỗ trợ.'],
			['']
		]

		const instructionSheet = workbook.addWorksheet('Hướng dẫn')
		for (const r of instructionData) {
			instructionSheet.addRow(r)
		}
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
