import { getUnitDetailUrl } from '@/data/unit-levels'
import type { Unit } from '@/types'
import { Building, Building2, Home } from 'lucide-react'
import { generalGroup, staticGroups, type NavItem } from './nav-items'

const unitSearch = (unit: Pick<Unit, 'level' | 'name' | 'id'>) => ({
	level: unit.level,
	name: unit.name,
	id: unit.id
})

// One collapsible entry per unit: its overview page, then each child unit.
function unitNavItem(unit: Unit): NavItem {
	return {
		title: unit.name,
		url: '#',
		icon: Building,
		items: [
			{
				title: 'nav:items.unitOverview',
				url: `/${unit.level === 'company' ? 'dai-doi' : 'don-vi'}/${unit.alias}`,
				search: unitSearch(unit),
				icon: Home
			},
			...unit.children.map((child) => ({
				title: child.name,
				url: getUnitDetailUrl(
					child.level,
					encodeURIComponent(child.alias)
				),
				icon: Building2,
				search: unitSearch(child)
			}))
		]
	}
}

// Non-admin users get their whole accessible scope back flat (e.g. a
// company and its platoons), so only keep units whose parent isn't also in
// the list - otherwise a platoon renders both nested under its company and
// again as its own top-level entry.
function topLevelUnits(units: Unit[]) {
	const fetchedIds = new Set(units.map((u) => u.id))
	return units.filter((u) => !u.parent || !fetchedIds.has(u.parent.id))
}

export function buildNavGroups({
	units = [],
	showAdminGroups
}: {
	units?: Unit[]
	showAdminGroups: boolean
}): NavItem[] {
	const unitsGroup: NavItem = {
		title: 'nav:groups.units',
		url: '#',
		items: [
			{
				title: 'nav:items.unitManagement',
				url: '/quan-ly-don-vi',
				icon: Building2
			},
			...topLevelUnits(units).map(unitNavItem)
		]
	}

	return [generalGroup, unitsGroup, ...staticGroups].filter(
		(group) => !group.superAdminOnly || showAdminGroups
	)
}
