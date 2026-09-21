import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger
} from '@/components/ui/collapsible'
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarRail
} from '@/components/ui/sidebar'
import { useSidebar } from '@/components/ui/use-sidebar'
import useUnitsData from '@/hooks/useUnitsData'
import { isSuperAdmin } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'
import type { ComponentProps } from 'react'
import { useTranslation } from 'react-i18next'
import { AppSidebarSkeleton } from '../app-sidebar-skeleton'
import { ArtilleryEmblem } from '../artillery-emblem'
import { LanguageSwitcher } from '../language-switcher'
import { ThemeToggle } from '../theme-toggle'
import { buildNavGroups } from './build-nav'
import { NavMenuItems } from './nav-menu'
import { useNavLabel } from './use-nav-label'

function SidebarBrand({ isCollapsed }: { isCollapsed: boolean }) {
	const { t } = useTranslation('nav')

	return (
		<div className='flex items-center gap-2 px-4 py-2'>
			<div
				className='flex h-9 w-9 items-center justify-center rounded-md ring-1 ring-gold/40 shadow-sm'
				style={{ backgroundImage: 'var(--gradient-primary)' }}
			>
				<ArtilleryEmblem
					variant='mark'
					className='h-6 w-6'
					withBackground={false}
				/>
			</div>
			{!isCollapsed && (
				<div className='flex flex-col'>
					<span className='text-sm font-serif font-semibold text-sidebar-foreground tracking-wide'>
						{t('app.title')}
					</span>
					<span className='text-xs text-sidebar-foreground/60'>
						{t('app.subtitle')}
					</span>
				</div>
			)}
		</div>
	)
}

export function AppSidebar(props: ComponentProps<typeof Sidebar>) {
	const { state } = useSidebar()
	const isCollapsed = state === 'collapsed'
	const label = useNavLabel()
	const { data: units, isLoading: isLoadingUnits } = useUnitsData()
	if (isLoadingUnits) {
		return <AppSidebarSkeleton />
	}

	const navGroups = buildNavGroups({
		units,
		showAdminGroups: isSuperAdmin()
	})

	return (
		<Sidebar {...props}>
			<SidebarHeader>
				<SidebarBrand isCollapsed={isCollapsed} />
			</SidebarHeader>

			<SidebarContent>
				{navGroups.map((group) => (
					<Collapsible
						key={group.title}
						className='group/collapsible'
						defaultOpen
					>
						<SidebarGroup>
							{!isCollapsed && (
								<SidebarGroupLabel asChild>
									<CollapsibleTrigger>
										{label(group.title)}
										<ChevronDown className='ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180' />
									</CollapsibleTrigger>
								</SidebarGroupLabel>
							)}
							{isCollapsed ? (
								<SidebarGroupContent>
									<NavMenuItems items={group.items ?? []} />
								</SidebarGroupContent>
							) : (
								<CollapsibleContent>
									<SidebarGroupContent>
										<NavMenuItems
											items={group.items ?? []}
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
					<LanguageSwitcher tone='onDark' />
					<div className=''>
						<ThemeToggle />
					</div>
				</div>
			</SidebarFooter>
		</Sidebar>
	)
}
