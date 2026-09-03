import {
	ArrowDown,
	ArrowRight,
	ArrowUp,
	CheckCircle,
	Circle,
	CircleOff,
	HelpCircle,
	Timer
} from 'lucide-react'

export const labels = [
	{
		value: 'bug',
		label: 'Bug'
	},
	{
		value: 'feature',
		label: 'Feature'
	},
	{
		value: 'documentation',
		label: 'Documentation'
	}
]

export const statuses = [
	{
		value: 'backlog',
		label: 'Backlog',
		icon: HelpCircle
	},
	{
		value: 'todo',
		label: 'Todo',
		icon: Circle
	},
	{
		value: 'in progress',
		label: 'In Progress',
		icon: Timer
	},
	{
		value: 'done',
		label: 'Done',
		icon: CheckCircle
	},
	{
		value: 'canceled',
		label: 'Canceled',
		icon: CircleOff
	}
]

export const priorities = [
	{
		label: 'Low',
		value: 'low',
		icon: ArrowDown
	},
	{
		label: 'Medium',
		value: 'medium',
		icon: ArrowRight
	},
	{
		label: 'High',
		value: 'high',
		icon: ArrowUp
	}
]

const MilitaryRankGroups: { group: string; ranks: string[] }[] = [
	{
		group: 'HSQ-BS',
		ranks: ['Binh nhì', 'Binh nhất', 'Hạ sĩ', 'Trung sĩ', 'Thượng sĩ']
	},
	{
		group: 'SQ',
		ranks: [
			'Thiếu úy',
			'Trung úy',
			'Thượng úy',
			'Đại úy',
			'Thiếu tá',
			'Trung tá',
			'Thượng tá',
			'Đại tá'
		]
	},
	{
		group: 'QNCN',
		ranks: [
			'Thiếu úy chuyên nghiệp',
			'Trung úy chuyên nghiệp',
			'Thượng úy chuyên nghiệp',
			'Đại úy chuyên nghiệp',
			'Thiếu tá chuyên nghiệp',
			'Trung tá chuyên nghiệp',
			'Thượng tá chuyên nghiệp'
		]
	}
]

export const MilitaryRankOptions = MilitaryRankGroups.flatMap(
	({ group, ranks }) =>
		ranks.map((rank) => ({ label: rank, value: rank, group }))
)

export const EduLevelOptions = [
	'7/12',
	'8/12',
	'9/12',
	'10/12',
	'11/12',
	'12/12',
	'Trung cấp',
	'Cao đẳng',
	'Đại học',
	'Sau đại học'
].map((el) => ({ label: el, value: el }))

export const ClassOptions = ['K1', 'KCL1'].map((el) => ({
	label: el,
	value: el
}))
