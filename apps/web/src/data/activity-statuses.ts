import type { ActivityStatus } from '@/types'

export const activityStatusOptions: { label: string; value: ActivityStatus }[] =
	[
		{ label: 'Đang phục vụ', value: 'serving' },
		{ label: 'Đang nằm viện', value: 'hospitalized' },
		{ label: 'Nghỉ phép năm', value: 'annual_leave' },
		{ label: 'Điều trị tại bệnh xá', value: 'infirmary_treatment' },
		{ label: 'Tham gia hội thi', value: 'contest' },
		{ label: 'Đi công tác', value: 'business_trip' },
		{ label: 'Nghỉ tuần', value: 'weekly_leave' },
		{ label: 'Luyện tập/diễn tập', value: 'rehearsal' },
		{ label: 'Xuất ngũ', value: 'discharged' }
	]

export const activityStatusLabels: Record<ActivityStatus, string> =
	Object.fromEntries(
		activityStatusOptions.map((o) => [o.value, o.label])
	) as Record<ActivityStatus, string>

// Badge color per status - kept separate from the label map so the table
// column can style each state distinctly (green = present/normal duty,
// amber = temporarily away, red = discharged).
export const activityStatusColors: Record<ActivityStatus, string> = {
	serving: 'bg-green-500',
	hospitalized: 'bg-red-500',
	annual_leave: 'bg-amber-500',
	infirmary_treatment: 'bg-red-400',
	contest: 'bg-blue-500',
	business_trip: 'bg-blue-400',
	weekly_leave: 'bg-amber-400',
	rehearsal: 'bg-blue-500',
	discharged: 'bg-gray-500'
}
