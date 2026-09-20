import type { Messages } from '../../types'
import type vi from '../vi/nav'

const nav: Messages<typeof vi> = {
	app: {
		title: 'Unit management',
		subtitle: '1st Battalion, Brigade 75'
	},
	groups: {
		general: 'General',
		unitStats: 'Unit statistics',
		units: 'Units',
		materials: 'Materiel',
		personnel: 'Personnel',
		userAdmin: 'User management'
	},
	items: {
		home: 'Home',
		unitRollup: 'Unit rollup',
		unitManagement: 'Unit management',
		unitOverview: 'Overview',
		materialCatalog: 'Materiel catalog',
		handover: 'Personnel and materiel handover',
		benefitProposals: 'Benefit proposals',
		promotionProposals: 'Rank promotion proposals',
		userList: 'Users',
		roleList: 'Roles',
		activityLog: 'Activity log',
		positions: 'Positions'
	},
	breadcrumb: {
		'dai-doi': 'Company',
		'trung-doi': 'Platoon',
		'don-vi': 'Unit',
		'quan-ly-don-vi': 'Unit management',
		'quan-ly-vat-tu': 'Materiel management',
		'danh-muc': 'Catalog',
		'chuyen-giao-tai-san': 'Personnel and materiel handover',
		'chuyen-dang-chinh-thuc': 'Full Party membership transfer',
		'de-xuat-che-do': 'Benefit proposals',
		'de-xuat-thang-quan-ham': 'Rank promotion proposals',
		'list-user': 'Users',
		'vai-tro': 'Roles',
		'cac-quyen': 'Permissions',
		'nhat-ky-hoat-dong': 'Activity log',
		'chuc-vu': 'Positions',
		'thong-ke-doanh-trai': 'Unit rollup',
		'thong-ke-chinh-tri': 'Political statistics',
		birthday: 'Comrades’ birthdays',
		'ethnic-minority': 'Ethnic minority personnel',
		hcyu: 'Youth Union members',
		cpv: 'Party members',
		religion: 'Personnel with a religion',
		'hoan-canh-kho-khan': 'Personnel in hardship',
		profile: 'Profile'
	},
	user: {
		profile: 'Profile',
		logout: 'Log out'
	},
	notifications: {
		title: 'Notifications'
	},
	theme: {
		toggle: 'Change theme',
		mode: 'Theme mode',
		colors: 'Accent colour',
		light: 'Light',
		dark: 'Dark',
		system: 'System',
		blue: 'Blue',
		green: 'Green',
		purple: 'Purple',
		orange: 'Orange',
		red: 'Red',
		zinc: 'Zinc',
		gray: 'Gray',
		stone: 'Stone',
		slate: 'Slate'
	}
}

export default nav
