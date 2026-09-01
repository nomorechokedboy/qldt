import type { Student } from '@/types'

export interface StudentExportField {
	key: string
	label: string
	getValue: (student: Student) => string
}

function joinChildren(list?: { fullName?: string; dob?: string }[]): string {
	if (!list || list.length === 0) return ''
	return list
		.map((c) => [c.fullName, c.dob].filter(Boolean).join(' - '))
		.join(', ')
}

export const studentExportFields: StudentExportField[] = [
	{ key: 'fullName', label: 'Họ và tên', getValue: (s) => s.fullName ?? '' },
	{ key: 'dob', label: 'Ngày sinh', getValue: (s) => s.dob ?? '' },
	{ key: 'rank', label: 'Cấp bậc', getValue: (s) => s.rank ?? '' },
	{ key: 'position', label: 'Chức vụ', getValue: (s) => s.position ?? '' },
	{
		key: 'previousUnit',
		label: 'Đơn vị cũ',
		getValue: (s) => s.previousUnit ?? ''
	},
	{
		key: 'previousPosition',
		label: 'Chức vụ cũ',
		getValue: (s) => s.previousPosition ?? ''
	},
	{
		key: 'birthPlace',
		label: 'Quê quán',
		getValue: (s) => s.birthPlace ?? ''
	},
	{ key: 'address', label: 'Trú quán', getValue: (s) => s.address ?? '' },
	{
		key: 'enlistmentPeriod',
		label: 'Thời gian nhập ngũ',
		getValue: (s) => s.enlistmentPeriod ?? ''
	},
	{ key: 'ethnic', label: 'Dân tộc', getValue: (s) => s.ethnic ?? '' },
	{ key: 'religion', label: 'Tôn giáo', getValue: (s) => s.religion ?? '' },
	{
		key: 'educationLevel',
		label: 'Học vấn',
		getValue: (s) => s.educationLevel ?? ''
	},
	{
		key: 'schoolName',
		label: 'Tên trường',
		getValue: (s) => s.schoolName ?? ''
	},
	{ key: 'major', label: 'Chuyên ngành', getValue: (s) => s.major ?? '' },
	{
		key: 'isGraduated',
		label: 'Đã tốt nghiệp',
		getValue: (s) => (s.isGraduated ? 'Có' : 'Không')
	},
	{ key: 'phone', label: 'Số điện thoại', getValue: (s) => s.phone ?? '' },
	{
		key: 'policyBeneficiaryGroup',
		label: 'Đối tượng chính sách',
		getValue: (s) => s.policyBeneficiaryGroup ?? ''
	},
	{
		key: 'politicalOrg',
		label: 'Đoàn/Đảng',
		getValue: (s) => (s.politicalOrg === 'cpv' ? 'Đảng viên' : 'Đoàn viên')
	},
	{
		key: 'politicalOrgOfficialDate',
		label: 'Ngày vào Đoàn',
		getValue: (s) => s.politicalOrgOfficialDate ?? ''
	},
	{ key: 'cpvId', label: 'Số thẻ Đảng', getValue: (s) => s.cpvId ?? '' },
	{
		key: 'cpvOfficialAt',
		label: 'Ngày vào Đảng',
		getValue: (s) => s.cpvOfficialAt ?? ''
	},
	{
		key: 'shortcoming',
		label: 'Khuyết điểm',
		getValue: (s) => s.shortcoming ?? ''
	},
	{ key: 'talent', label: 'Tài năng', getValue: (s) => s.talent ?? '' },
	{
		key: 'fatherName',
		label: 'Họ tên bố',
		getValue: (s) => s.fatherName ?? ''
	},
	{
		key: 'fatherJob',
		label: 'Nghề nghiệp của bố',
		getValue: (s) => s.fatherJob ?? ''
	},
	{
		key: 'fatherPhoneNumber',
		label: 'SĐT bố',
		getValue: (s) => s.fatherPhoneNumber ?? ''
	},
	{
		key: 'motherName',
		label: 'Họ tên mẹ',
		getValue: (s) => s.motherName ?? ''
	},
	{
		key: 'motherJob',
		label: 'Nghề nghiệp của mẹ',
		getValue: (s) => s.motherJob ?? ''
	},
	{
		key: 'motherPhoneNumber',
		label: 'SĐT mẹ',
		getValue: (s) => s.motherPhoneNumber ?? ''
	},
	{
		key: 'isMarried',
		label: 'Đã kết hôn',
		getValue: (s) => (s.isMarried ? 'Có' : 'Không')
	},
	{
		key: 'spouseName',
		label: 'Họ tên vợ/chồng',
		getValue: (s) => s.spouseName ?? ''
	},
	{
		key: 'spouseJob',
		label: 'Nghề nghiệp vợ/chồng',
		getValue: (s) => s.spouseJob ?? ''
	},
	{
		key: 'spousePhoneNumber',
		label: 'SĐT vợ/chồng',
		getValue: (s) => s.spousePhoneNumber ?? ''
	},
	{
		key: 'familySize',
		label: 'Số nhân khẩu',
		getValue: (s) =>
			s.familySize !== undefined ? String(s.familySize) : ''
	},
	{
		key: 'familyBackground',
		label: 'Thành phần gia đình',
		getValue: (s) => s.familyBackground ?? ''
	},
	{
		key: 'achievement',
		label: 'Thành tích',
		getValue: (s) => s.achievement ?? ''
	},
	{
		key: 'disciplinaryHistory',
		label: 'Kỷ luật',
		getValue: (s) => s.disciplinaryHistory ?? ''
	},
	{
		key: 'childrenInfos',
		label: 'Con cái',
		getValue: (s) => joinChildren(s.childrenInfos)
	},
	{
		key: 'studentId',
		label: 'Mã học viên',
		getValue: (s) => s.studentId ?? ''
	},
	{
		key: 'status',
		label: 'Trạng thái',
		getValue: (s) =>
			s.status === 'confirmed' ? 'Đã xác nhận' : 'Chưa xác nhận'
	},
	{ key: 'class', label: 'Tiểu đội', getValue: (s) => s.class?.name ?? '' },
	{ key: 'unit', label: 'Đơn vị', getValue: (s) => s.unit?.name ?? '' }
]

export function buildStudentExportRow(
	student: Student,
	selectedKeys?: string[]
): Record<string, string> {
	const fields = selectedKeys
		? studentExportFields.filter((f) => selectedKeys.includes(f.key))
		: studentExportFields

	return Object.fromEntries(
		fields.map((field) => [field.label, field.getValue(student)])
	)
}
