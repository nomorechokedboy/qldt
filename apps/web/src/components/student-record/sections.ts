import type { LucideIcon } from 'lucide-react'
import { Award, GraduationCap, Shield, User, Users } from 'lucide-react'

export type SectionId =
	| 'personal'
	| 'military'
	| 'education'
	| 'family'
	| 'history'

export interface RecordSectionMeta {
	id: SectionId
	label: string
	hint: string
	icon: LucideIcon
}

// The parts of a personnel record, in the order both the form and the
// read-only view present them.
export const RECORD_SECTIONS: RecordSectionMeta[] = [
	{
		id: 'personal',
		label: 'Thông tin cá nhân',
		hint: 'Họ tên, nơi ở, liên lạc',
		icon: User
	},
	{
		id: 'military',
		label: 'Quân sự & Chính trị',
		hint: 'Cấp bậc, chức vụ, chính trị',
		icon: Shield
	},
	{
		id: 'education',
		label: 'Học vấn & Kỹ năng',
		hint: 'Trường lớp, sở trường',
		icon: GraduationCap
	},
	{
		id: 'family',
		label: 'Gia đình',
		hint: 'Cha mẹ, vợ chồng, con',
		icon: Users
	},
	{
		id: 'history',
		label: 'Lịch sử & Khác',
		hint: 'Khen thưởng, kỷ luật, tài liệu',
		icon: Award
	}
]
