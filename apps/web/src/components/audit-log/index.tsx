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
import type { audit_logs } from '@/api/client'

const PAGE_SIZE = 20

const RESOURCE_LABELS: Record<string, string> = {
	students: 'Quân nhân',
	material_assets: 'Vũ khí/trang bị',
	material_types: 'Danh mục vật tư',
	material_stocks: 'Tồn kho vật tư',
	buildings: 'Tòa nhà',
	rooms: 'Phòng',
	classes: 'Đơn vị',
	units: 'Đơn vị',
	roles: 'Vai trò',
	permissions: 'Quyền',
	users: 'Người dùng',
	user_roles: 'Phân quyền người dùng',
	transfer_requests: 'Yêu cầu chuyển giao'
}

const ACTION_LABELS: Record<string, string> = {
	create: 'Tạo mới',
	update: 'Cập nhật',
	delete: 'Xoá',
	approve: 'Phê duyệt',
	reject: 'Từ chối'
}

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
						<SelectValue placeholder='Tài nguyên' />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value='all'>Tất cả tài nguyên</SelectItem>
						{Object.entries(RESOURCE_LABELS).map(
							([value, label]) => (
								<SelectItem key={value} value={value}>
									{label}
								</SelectItem>
							)
						)}
					</SelectContent>
				</Select>

				<Select
					value={action || 'all'}
					onValueChange={handleFilterChange(setAction)}
				>
					<SelectTrigger className='h-8 w-[160px]'>
						<SelectValue placeholder='Hành động' />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value='all'>Tất cả hành động</SelectItem>
						{Object.entries(ACTION_LABELS).map(([value, label]) => (
							<SelectItem key={value} value={value}>
								{label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className='rounded-md border'>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Thời gian</TableHead>
							<TableHead>Người thực hiện</TableHead>
							<TableHead>Tài nguyên</TableHead>
							<TableHead>Hành động</TableHead>
							<TableHead>Endpoint</TableHead>
							<TableHead className='text-right'>
								Chi tiết
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
									Không có nhật ký nào
								</TableCell>
							</TableRow>
						)}

						{!isLoading &&
							data?.data.map((log) => (
								<TableRow key={log.id}>
									<TableCell className='whitespace-nowrap text-sm'>
										{new Date(log.createdAt).toLocaleString(
											'vi-VN'
										)}
									</TableCell>
									<TableCell>
										{log.actor?.displayName ?? '—'}
									</TableCell>
									<TableCell>
										{RESOURCE_LABELS[log.resource] ??
											log.resource}
									</TableCell>
									<TableCell>
										<Badge
											variant={
												ACTION_BADGE_VARIANT[
													log.action
												] ?? 'secondary'
											}
										>
											{ACTION_LABELS[log.action] ??
												log.action}
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
											Xem
										</Button>
									</TableCell>
								</TableRow>
							))}
					</TableBody>
				</Table>
			</div>

			<div className='flex items-center justify-between text-sm text-muted-foreground'>
				<span>
					Trang {page} / {totalPages} ({total} bản ghi)
				</span>
				<div className='flex gap-2'>
					<Button
						variant='outline'
						size='sm'
						disabled={page <= 1}
						onClick={() => setPage((p) => Math.max(1, p - 1))}
					>
						Trước
					</Button>
					<Button
						variant='outline'
						size='sm'
						disabled={page >= totalPages}
						onClick={() =>
							setPage((p) => Math.min(totalPages, p + 1))
						}
					>
						Sau
					</Button>
				</div>
			</div>

			<Sheet
				open={selectedLog !== null}
				onOpenChange={(open) => !open && setSelectedLog(null)}
			>
				<SheetContent className='w-full overflow-y-auto sm:max-w-xl'>
					<SheetHeader>
						<SheetTitle>Chi tiết nhật ký</SheetTitle>
					</SheetHeader>
					{selectedLog && (
						<div className='space-y-4 px-4 pb-4'>
							<div className='grid grid-cols-2 gap-2 text-sm'>
								<span className='text-muted-foreground'>
									Tài nguyên
								</span>
								<span>
									{RESOURCE_LABELS[selectedLog.resource] ??
										selectedLog.resource}
								</span>
								<span className='text-muted-foreground'>
									Hành động
								</span>
								<span>
									{ACTION_LABELS[selectedLog.action] ??
										selectedLog.action}
								</span>
								<span className='text-muted-foreground'>
									Người thực hiện
								</span>
								<span>
									{selectedLog.actor?.displayName ?? '—'}
								</span>
								<span className='text-muted-foreground'>
									Thời gian
								</span>
								<span>
									{new Date(
										selectedLog.createdAt
									).toLocaleString('vi-VN')}
								</span>
							</div>

							<div>
								<h4 className='mb-1 text-sm font-medium'>
									Trước khi thay đổi
								</h4>
								<pre className='max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs'>
									{JSON.stringify(
										selectedLog.previousValue ?? null,
										null,
										2
									)}
								</pre>
							</div>

							<div>
								<h4 className='mb-1 text-sm font-medium'>
									Sau khi thay đổi
								</h4>
								<pre className='max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs'>
									{JSON.stringify(
										selectedLog.newValue ?? null,
										null,
										2
									)}
								</pre>
							</div>
						</div>
					)}
				</SheetContent>
			</Sheet>
		</div>
	)
}
