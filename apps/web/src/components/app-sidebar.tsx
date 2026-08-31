import { SidebarFooter, useSidebar } from '@/components/ui/sidebar'
import * as React from 'react'
import {
	Calendar,
	ChevronDown,
	PieChart,
	Building2,
	Building,
	Home,
	List,
	UserRoundCog,
	Package
} from 'lucide-react'
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
	SidebarRail
} from '@/components/ui/sidebar'
import { Link } from '@tanstack/react-router'
import StudentForm from '@/components/student-form'
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger
} from '@/components/ui/collapsible'
import useUnitsData from '@/hooks/useUnitsData'
import { getUnitDetailUrl } from '@/data/unit-levels'
import Cdhc2Logo from '@/assets/lu75.jpg'
import { AppSidebarSkeleton } from './app-sidebar-skeleton'
import { ThemeToggle } from './theme-toggle'
import useAuth from '@/hooks/useAuth'
import type { GetUnitQuery } from '@/types'
import { isSuperAdmin } from '@/lib/utils'
// Updated data structure to support unlimited nesting and icons
const data = {
	versions: ['1.0.1', '1.1.0-alpha', '2.0.0-beta1'],
	navMain: [
		{
			title: 'Chung',
			url: '#',
			superAdminOnly: false,
			items: [{ title: 'Trang chủ', url: '/', icon: Home }]
		},
		{
			title: 'Thống kê doanh trại',
			url: '#',
			superAdminOnly: false,
			icon: PieChart,
			items: [
				{
					title: 'Tổng hợp đơn vị',
					url: '/thong-ke-doanh-trai',
					icon: PieChart
				}
			]
		},
		{
			title: 'Sự kiện đơn vị',
			url: '#',
			superAdminOnly: false,
			icon: Calendar,
			items: [
				{
					title: 'Sinh nhật đồng đội',
					url: '/birthday',
					icon: Calendar
				},
				{
					title: '☭ Chuyển Đảng chính thức ',
					url: '/chuyen-dang-chinh-thuc'
					// icon: HeartHandshake
				}
			]
		},
		// Chức năng khác -> import quân nhân
		// {
		// 	title: 'Chức năng khác',
		// 	url: '#',
		// 	superAdminOnly: false,
		// 	icon: Star,
		// 	items: [
		// 		{
		// 			title: 'Import quân nhân',
		// 			url: '/import-students',
		// 			icon: UserPlus
		// 		}
		// 	]
		// },
		{
			title: 'Vật tư',
			url: '#',
			superAdminOnly: false,
			icon: Package,
			items: [
				{
					title: 'Danh mục vật tư',
					url: '/quan-ly-vat-tu/danh-muc',
					icon: Package
				}
			]
		},
		{
			title: 'Quản lý người dùng',
			url: '#',
			superAdminOnly: true,
			icon: Calendar,
			items: [
				{
					title: 'Danh sách người dùng',
					url: '/list-user',
					icon: List
				},
				{
					title: 'Danh sách vai trò',
					url: '/vai-tro',
					icon: UserRoundCog
				}
			]
		}
	]
}

// Type definition for navigation items
interface NavItem {
	title: string
	url: string
	isActive?: boolean
	superAdminOnly?: boolean
	items?: NavItem[]
	search?: { [k: string]: string }
	icon?: React.ElementType
}

// Recursive component to render nested menu items
function NavMenuItems({
	items,
	level = 0
}: {
	items: NavItem[]
	level?: number
}) {
	if (level === 0) {
		// Top level items
		return (
			<SidebarMenu>
				{items.map((item) => (
					<NavMenuItem key={item.title} item={item} level={level} />
				))}
			</SidebarMenu>
		)
	} else {
		// Nested items use SidebarMenuSub
		return (
			<SidebarMenuSub>
				{items.map((item) => (
					<NavMenuItem key={item.title} item={item} level={level} />
				))}
			</SidebarMenuSub>
		)
	}
}

// Individual menu item component
function NavMenuItem({ item, level }: { item: NavItem; level: number }) {
	const { state } = useSidebar()
	const isCollapsed = state === 'collapsed'

	const hasChildren = item.items && item.items.length > 0
	const Icon = item.icon

	const [isOpen, setIsOpen] = React.useState(false)

	if (level === 0) {
		// Top level menu item
		if (hasChildren) {
			return (
				<SidebarMenuItem>
					<Collapsible
						open={isOpen}
						onOpenChange={setIsOpen}
						defaultOpen={false}
					>
						<CollapsibleTrigger asChild>
							<SidebarMenuButton className='flex items-center gap-3 rounded-xl px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-200 focus:bg-blue-100 cursor-pointer'>
								{Icon && <Icon className='w-5 h-5' />}
								{!isCollapsed && <span>{item.title}</span>}
								{!isCollapsed && (
									<ChevronDown
										className={`ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`}
									/>
								)}
							</SidebarMenuButton>
						</CollapsibleTrigger>
						{!isCollapsed && (
							<CollapsibleContent>
								<NavMenuItems
									items={item.items!}
									level={level + 1}
								/>
							</CollapsibleContent>
						)}
					</Collapsible>
				</SidebarMenuItem>
			)
		} else {
			return (
				<SidebarMenuItem>
					<SidebarMenuButton
						asChild
						isActive={item.isActive}
						className='flex items-center gap-3 rounded-xl px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-200 focus:bg-blue-100 cursor-pointer'
					>
						<Link
							to={item.url}
							search={item.search}
							className='flex items-center gap-3 w-full'
						>
							{Icon && <Icon className='w-5 h-5' />}
							{!isCollapsed && <span>{item.title}</span>}
						</Link>
					</SidebarMenuButton>
				</SidebarMenuItem>
			)
		}
	}

	return (
		<SidebarMenuSubItem>
			{hasChildren ? (
				<Collapsible open={isOpen} onOpenChange={setIsOpen}>
					<CollapsibleTrigger asChild>
						<SidebarMenuSubButton className='flex items-center gap-3 rounded-xl px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-200 focus:bg-blue-100 cursor-pointer'>
							{Icon && <Icon className='w-5 h-5  ' />}
							{!isCollapsed && <span>{item.title}</span>}
							{!isCollapsed && (
								<ChevronDown
									className={`ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`}
								/>
							)}
						</SidebarMenuSubButton>
					</CollapsibleTrigger>
					{!isCollapsed && (
						<CollapsibleContent>
							<NavMenuItems
								items={item.items!}
								level={level + 1}
							/>
						</CollapsibleContent>
					)}
				</Collapsible>
			) : (
				<SidebarMenuSubButton
					asChild
					isActive={item.isActive}
					className='flex items-center gap-3 rounded-xl px-4 py-2 font-medium text-gray-700 transition-colors  hover:bg-gray-200  focus:bg-blue-100 '
				>
					<Link
						to={item.url}
						search={item.search}
						className='flex items-center gap-3 w-full'
					>
						{Icon && <Icon className='w-5 h-5  ' />}
						{!isCollapsed && <span>{item.title}</span>}
					</Link>
				</SidebarMenuSubButton>
			)}
		</SidebarMenuSubItem>
	)
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const { state } = useSidebar()
	const isCollapsed = state === 'collapsed'
	const { user } = useAuth()

	const getUnitsQuery: GetUnitQuery | undefined =
		user?.isSuperUser === true
			? {
					level: 'battalion'
				}
			: undefined
	const { data: units, isLoading: isLoadingUnits } =
		useUnitsData(getUnitsQuery)
	if (isLoadingUnits) {
		return <AppSidebarSkeleton />
	}

	// Non-admin users get their whole accessible scope back flat (e.g. a
	// company and its platoons), so only keep units whose parent isn't also
	// in the list — otherwise a platoon renders both nested under its
	// company and again as its own top-level entry.
	const fetchedUnitIds = new Set(units?.map((u) => u.id))
	const topLevelUnits = units?.filter(
		(unit) => !unit.parent || !fetchedUnitIds.has(unit.parent.id)
	)

	const unitsNavbar = topLevelUnits?.map(
		(unit) =>
			({
				title: unit.name,
				url: '#',
				items: [
					{
						title: 'Tổng quan',
						url: `/don-vi/${unit.alias}`,
						search: { level: unit.level, name: '' },
						icon: Home
					},
					...unit.children.map((child) => ({
						title: child.name,
						url: getUnitDetailUrl(child.level, child.alias),
						icon: Building2
					}))
				],
				icon: Building
			}) as NavItem
	)

	const [firstNavItem, ...navMain] = data.navMain
	const allNavItems = [
		firstNavItem,
		{
			title: 'Đơn vị',
			url: '#',
			items: [
				{
					title: 'Quản lý đơn vị',
					url: '/quan-ly-don-vi',
					icon: Building2
				},
				...(unitsNavbar ?? [])
			]
		},
		...navMain
	]
	const newData = {
		version: data.versions,
		navMain: allNavItems.filter(
			(item) => !item.superAdminOnly || isSuperAdmin()
		)
	}

	return (
		<Sidebar {...props}>
			<SidebarHeader>
				<div className='flex items-center gap-2 px-4 py-2'>
					<div className='flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-primary-foreground'>
						<img
							src={Cdhc2Logo}
							alt='Logo Trường Cao đẳng hậu cần 2'
							className='h-6 w-6'
						/>
					</div>
					{!isCollapsed && (
						<div className='flex flex-col'>
							<span className='text-sm font-semibold'>
								Quản lý doanh trại
							</span>
							<span className='text-xs text-muted-foreground'>
								Tiểu đoàn 1, Lữ đoàn 75
							</span>
						</div>
					)}
				</div>
			</SidebarHeader>

			<SidebarContent>
				{!isCollapsed && (
					<div className='p-4 w-full'>
						<StudentForm
							buttonProps={{ className: 'w-full' }}
							onSuccess={() => {}}
						/>
					</div>
				)}

				{newData.navMain.map((item) => (
					<Collapsible
						key={item.title}
						className='group/collapsible'
						defaultOpen={false}
					>
						<SidebarGroup>
							{!isCollapsed && (
								<SidebarGroupLabel asChild>
									<CollapsibleTrigger>
										{item.title}
										<ChevronDown className='ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180' />
									</CollapsibleTrigger>
								</SidebarGroupLabel>
							)}
							{isCollapsed ? (
								<SidebarGroupContent>
									<NavMenuItems items={item.items || []} />
								</SidebarGroupContent>
							) : (
								<CollapsibleContent>
									<SidebarGroupContent>
										<NavMenuItems
											items={item.items || []}
										/>
									</SidebarGroupContent>
								</CollapsibleContent>
							)}
						</SidebarGroup>
					</Collapsible>
				))}
			</SidebarContent>
			<SidebarRail />
			<SidebarFooter>
				<div className='w-full flex items-center justify-between'>
					<div></div>
					<div className=''>
						<ThemeToggle />
					</div>
				</div>
			</SidebarFooter>
		</Sidebar>
	)
}
