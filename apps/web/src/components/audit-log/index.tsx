import RefreshButton from '@/components/refresh-button'
import { useState } from 'react'
import { ErrorState } from '@/components/error-state'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select'
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '@/components/ui/table'
import useAuditLogs from '@/hooks/useAuditLogs'
import { formatDbTimestamp } from '@/lib/utils'
import type { audit_logs } from '@/api/client'
import AuditLogDiff from './diff'
import { useTranslation } from 'react-i18next'

const PAGE_SIZE = 20

// Resource / action codes are what the API records; only their labels are
// translated (see `audit.resources` / `audit.actions` in the admin catalog).
const RESOURCES = [
	'students',
	'material_assets',
	'material_types',
	'material_stocks',
	'buildings',
	'rooms',
	'units',
	'roles',
	'permissions',
	'users',
	'user_roles',
	'transfer_requests',
	'inventory_sessions'
] as const

const ACTIONS = ['create', 'update', 'delete', 'approve', 'reject'] as const

const isResource = (value: string): value is (typeof RESOURCES)[number] =>
	(RESOURCES as readonly string[]).includes(value)

const isAction = (value: string): value is (typeof ACTIONS)[number] =>
	(ACTIONS as readonly string[]).includes(value)

const ACTION_BADGE_VARIANT: Record<
	string,
	'default' | 'secondary' | 'destructive'
> = {
	create: 'default',
	update: 'secondary',
	delete: 'destructive'
}

type AuditLogRow = audit_logs.GetAuditLogsResponse['data'][number]

export default function AuditLogTab() {
	const { t } = useTranslation('admin')
	const [page, setPage] = useState(1)
	const [resource, setResource] = useState<string>('')
	const [action, setAction] = useState<string>('')
	const [selectedLog, setSelectedLog] = useState<AuditLogRow | null>(null)

	const { data, isLoading, error, refetch } = useAuditLogs({
		page,
		pageSize: PAGE_SIZE,
		resource: resource || undefined,
		action: (action || undefined) as audit_logs.GetAuditLogsQuery['action']
	})

	const total = data?.total ?? 0
	const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

	// Unknown codes fall back to the raw value the API returned.
	const resourceLabel = (value: string) =>
		isResource(value) ? t(`audit.resources.${value}`) : value
	const actionLabel = (value: string) =>
		isAction(value) ? t(`audit.actions.${value}`) : value

	const handleFilterChange = (setter: (v: string) => void) => (v: string) => {
		setter(v === 'all' ? '' : v)
		setPage(1)
	}

	if (error) {
		return <ErrorState error={error as Error} onRetry={() => refetch()} />
	}

	return (
		<div className='space-y-4'>
			<div className='flex flex-wrap items-center gap-2'>
				<Select
					value={resource || 'all'}
					onValueChange={handleFilterChange(setResource)}
				>
					<SelectTrigger className='h-8 w-[200px]'>
						<SelectValue
							placeholder={t('audit.columns.resource')}
						/>
					</SelectTrigger>
					<SelectContent>
						<SelectItem value='all'>
							{t('audit.allResources')}
						</SelectItem>
						{RESOURCES.map((value) => (
							<SelectItem key={value} value={value}>
								{resourceLabel(value)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Select
					value={action || 'all'}
					onValueChange={handleFilterChange(setAction)}
				>
					<SelectTrigger className='h-8 w-[160px]'>
						<SelectValue placeholder={t('audit.columns.action')} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value='all'>
							{t('audit.allActions')}
						</SelectItem>
						{ACTIONS.map((value) => (
							<SelectItem key={value} value={value}>
								{actionLabel(value)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<RefreshButton onRefresh={() => refetch()} />
			</div>

			<div className='rounded-md border'>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>{t('audit.columns.time')}</TableHead>
							<TableHead>{t('audit.columns.actor')}</TableHead>
							<TableHead>{t('audit.columns.resource')}</TableHead>
							<TableHead>{t('audit.columns.action')}</TableHead>
							<TableHead>Endpoint</TableHead>
							<TableHead className='text-right'>
								{t('common.details')}
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading &&
							Array.from({ length: 8 }).map((_, i) => (
								<TableRow key={i}>
									{Array.from({ length: 6 }).map((_, j) => (
										<TableCell key={j}>
											<Skeleton className='h-4 w-full' />
										</TableCell>
									))}
								</TableRow>
							))}

						{!isLoading && data?.data.length === 0 && (
							<TableRow>
								<TableCell
									colSpan={6}
									className='py-10 text-center text-muted-foreground'
								>
									{t('audit.empty')}
								</TableCell>
							</TableRow>
						)}

						{!isLoading &&
							data?.data.map((log) => (
								<TableRow key={log.id}>
									<TableCell className='whitespace-nowrap text-sm'>
										{formatDbTimestamp(log.createdAt)}
									</TableCell>
									<TableCell>
										{log.actor?.displayName ?? '—'}
									</TableCell>
									<TableCell>
										{resourceLabel(log.resource)}
									</TableCell>
									<TableCell>
										<Badge
											variant={
												ACTION_BADGE_VARIANT[
													log.action
												] ?? 'secondary'
											}
										>
											{actionLabel(log.action)}
										</Badge>
									</TableCell>
									<TableCell className='font-mono text-xs text-muted-foreground'>
										{log.method} {log.path}
									</TableCell>
									<TableCell className='text-right'>
										<Button
											variant='ghost'
											size='sm'
											onClick={() => setSelectedLog(log)}
										>
											{t('audit.view')}
										</Button>
									</TableCell>
								</TableRow>
							))}
					</TableBody>
				</Table>
			</div>

			<div className='flex items-center justify-between text-sm text-muted-foreground'>
				<span>
					{t('audit.pagination', { page, totalPages, total })}
				</span>
				<div className='flex gap-2'>
					<Button
						variant='outline'
						size='sm'
						disabled={page <= 1}
						onClick={() => setPage((p) => Math.max(1, p - 1))}
					>
						{t('audit.previous')}
					</Button>
					<Button
						variant='outline'
						size='sm'
						disabled={page >= totalPages}
						onClick={() =>
							setPage((p) => Math.min(totalPages, p + 1))
						}
					>
						{t('audit.next')}
					</Button>
				</div>
			</div>

			<Sheet
				open={selectedLog !== null}
				onOpenChange={(open) => !open && setSelectedLog(null)}
			>
				<SheetContent className='w-full overflow-y-auto sm:max-w-xl'>
					<SheetHeader>
						<SheetTitle>{t('audit.detailTitle')}</SheetTitle>
					</SheetHeader>
					{selectedLog && (
						<div className='space-y-4 px-4 pb-4'>
							<div className='grid grid-cols-2 gap-2 text-sm'>
								<span className='text-muted-foreground'>
									{t('audit.columns.resource')}
								</span>
								<span>
									{resourceLabel(selectedLog.resource)}
								</span>
								<span className='text-muted-foreground'>
									{t('audit.columns.action')}
								</span>
								<span>{actionLabel(selectedLog.action)}</span>
								<span className='text-muted-foreground'>
									{t('audit.columns.actor')}
								</span>
								<span>
									{selectedLog.actor?.displayName ?? '—'}
								</span>
								<span className='text-muted-foreground'>
									{t('audit.columns.time')}
								</span>
								<span>
									{formatDbTimestamp(selectedLog.createdAt)}
								</span>
							</div>
							<AuditLogDiff
								before={selectedLog.previousValue ?? null}
								after={selectedLog.newValue ?? null}
							/>
						</div>
					)}
				</SheetContent>
			</Sheet>
		</div>
	)
}
