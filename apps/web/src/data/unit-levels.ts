import type { UnitLevel } from '@/types'

// Ordered from smallest to largest unit. A unit's parent must be strictly
// larger (later in this list) than the unit itself.
export const unitLevelOrder: UnitLevel[] = [
	'squad',
	'platoon',
	'company',
	'battalion',
	'department',
	'regiment',
	'brigade',
	'division',
	'corps'
]

export const unitLevelLabels: Record<UnitLevel, string> = {
	squad: 'Tiểu đội',
	platoon: 'Trung đội',
	company: 'Đại đội',
	battalion: 'Tiểu đoàn',
	department: 'Cơ quan',
	regiment: 'Trung đoàn',
	brigade: 'Lữ đoàn',
	division: 'Sư đoàn',
	corps: 'Quân đoàn'
}

export const unitLevelOptions = unitLevelOrder.map((level) => ({
	value: level,
	label: unitLevelLabels[level]
}))

// A root (parentless) unit must be Company level or larger.
export const rootUnitLevelOptions = unitLevelOptions.filter(
	(opt) =>
		unitLevelOrder.indexOf(opt.value) >= unitLevelOrder.indexOf('company')
)

export function isLargerUnitLevel(a: UnitLevel, b: UnitLevel): boolean {
	return unitLevelOrder.indexOf(a) > unitLevelOrder.indexOf(b)
}
