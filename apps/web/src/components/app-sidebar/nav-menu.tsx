import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger
} from '@/components/ui/collapsible'
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem
} from '@/components/ui/sidebar'
import { useSidebar } from '@/components/ui/use-sidebar'
import { Link, useLocation } from '@tanstack/react-router'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import type { NavItem } from './nav-items'
import { useNavLabel } from './use-nav-label'

const navButtonClass =
	'flex items-center gap-3 rounded-xl px-4 py-2 font-medium text-sidebar-foreground/85 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:bg-sidebar-accent cursor-pointer border-l-2 border-transparent data-[active=true]:border-primary data-[active=true]:text-sidebar-foreground'

// Top-level entries sit in the menu proper; anything nested sits in a
// sub-menu. The parts are the same, only the components differ.
const menuParts = {
	top: {
		Menu: SidebarMenu,
		Item: SidebarMenuItem,
		Button: SidebarMenuButton
	},
	nested: {
		Menu: SidebarMenuSub,
		Item: SidebarMenuSubItem,
		Button: SidebarMenuSubButton
	}
}

const partsFor = (level: number) =>
	level === 0 ? menuParts.top : menuParts.nested

// Renders nested items to any depth.
export function NavMenuItems({
	items,
	level = 0
}: {
	items: NavItem[]
	level?: number
}) {
	const { Menu } = partsFor(level)

	return (
		<Menu>
			{items.map((item) => (
				<NavMenuItem key={item.title} item={item} level={level} />
			))}
		</Menu>
	)
}

function NavMenuItem({ item, level }: { item: NavItem; level: number }) {
	const { Item, Button } = partsFor(level)
	const label = useNavLabel()
	const { state } = useSidebar()
	const isCollapsed = state === 'collapsed'
	const location = useLocation()
	const [isOpen, setIsOpen] = useState(false)

	const Icon = item.icon
	const children = item.items?.length ? item.items : undefined
	const content = (
		<>
			{Icon && <Icon className='w-5 h-5' />}
			{!isCollapsed && <span>{label(item.title)}</span>}
		</>
	)

	if (!children) {
		return (
			<Item>
				<Button
					asChild
					isActive={item.url === location.pathname}
					className={navButtonClass}
				>
					<Link
						to={item.url}
						search={item.search}
						className='flex items-center gap-3 w-full'
					>
						{content}
					</Link>
				</Button>
			</Item>
		)
	}

	return (
		<Item>
			<Collapsible open={isOpen} onOpenChange={setIsOpen}>
				<CollapsibleTrigger asChild>
					<Button className={navButtonClass}>
						{content}
						{!isCollapsed && (
							<ChevronDown
								className={`ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`}
							/>
						)}
					</Button>
				</CollapsibleTrigger>
				{!isCollapsed && (
					<CollapsibleContent>
						<NavMenuItems items={children} level={level + 1} />
					</CollapsibleContent>
				)}
			</Collapsible>
		</Item>
	)
}
