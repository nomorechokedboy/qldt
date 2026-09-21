import {
	ArrowLeftRight,
	Calendar,
	ClipboardCheck,
	History,
	Home,
	Languages,
	List,
	Package,
	PieChart,
	TrendingUp,
	UserRoundCog
} from 'lucide-react'
import type { ElementType } from 'react'

export interface NavItem {
	// An i18n key ('nav:...') for the static entries; data-derived entries
	// (unit names) carry their text as it is.
	title: string
	url: string
	isActive?: boolean
	superAdminOnly?: boolean
	items?: NavItem[]
	search?: { [k: string]: string | number }
	icon?: ElementType
}

// The group every user starts with.
export const generalGroup: NavItem = {
	title: 'nav:groups.general',
	url: '#',
	superAdminOnly: false,
	items: [{ title: 'nav:items.home', url: '/', icon: Home }]
}

// Everything after the units group (which is built from the fetched units).
export const staticGroups: NavItem[] = [
	{
		title: 'nav:groups.unitStats',
		url: '#',
		superAdminOnly: false,
		icon: PieChart,
		items: [
			{
				title: 'nav:items.unitRollup',
				url: '/thong-ke-doanh-trai',
				icon: PieChart
			}
		]
	},
	{
		title: 'nav:groups.materials',
		url: '#',
		superAdminOnly: false,
		icon: Package,
		items: [
			{
				title: 'nav:items.materialCatalog',
				url: '/quan-ly-vat-tu/danh-muc',
				icon: Package
			},
			{
				title: 'nav:items.handover',
				url: '/chuyen-giao-tai-san',
				icon: ArrowLeftRight
			}
		]
	},
	{
		title: 'nav:groups.personnel',
		url: '#',
		superAdminOnly: false,
		icon: ClipboardCheck,
		items: [
			{
				title: 'nav:items.benefitProposals',
				url: '/de-xuat-che-do',
				icon: ClipboardCheck
			},
			{
				title: 'nav:items.promotionProposals',
				url: '/de-xuat-thang-quan-ham',
				icon: TrendingUp
			}
		]
	},
	{
		title: 'nav:groups.userAdmin',
		url: '#',
		superAdminOnly: true,
		icon: Calendar,
		items: [
			{ title: 'nav:items.userList', url: '/list-user', icon: List },
			{
				title: 'nav:items.roleList',
				url: '/vai-tro',
				icon: UserRoundCog
			},
			{
				title: 'nav:items.activityLog',
				url: '/nhat-ky-hoat-dong',
				icon: History
			},
			{ title: 'nav:items.positions', url: '/chuc-vu', icon: List },
			{
				title: 'nav:items.langPacks',
				url: '/cai-dat-ngon-ngu',
				icon: Languages
			}
		]
	}
]
