import i18n from '@/i18n'
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

// The 4 statuses a commander can propose a batch of troopers into, via an
// activity status proposal requiring a higher commander's approval.
const targetActivityStatusValues = [
	'annual_leave',
	'discharged',
	'weekly_leave',
	'rehearsal'
] as const

export const targetActivityStatusOptions = activityStatusOptions.filter(
	(
		o
	): o is {
		label: string
		value: (typeof targetActivityStatusValues)[number]
	} => (targetActivityStatusValues as readonly string[]).includes(o.value)
)

export const activityStatusLabels: Record<ActivityStatus, string> =
	Object.fromEntries(
		activityStatusOptions.map((o) => [o.value, o.label])
	) as Record<ActivityStatus, string>

// Language-aware label for display. The Vietnamese labels above are a data
// contract (import parsing and export templates match on them), so screens
// use this accessor instead.
export function activityStatusLabel(status: string): string {
	return status in activityStatusLabels
		? i18n.t(`proposals:activityStatus.${status as ActivityStatus}`)
		: status
}

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
